// Runs a prompt through a model CLI and returns schema-validated JSON.
// Two providers from two companies so a writer is always checked by a different family:
//   claude → Claude Code CLI (`claude -p --json-schema`), uses the local Claude login
//   codex  → OpenAI Codex CLI (`codex exec --output-schema`), uses the local ChatGPT login
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export type Provider = 'claude' | 'codex';

export const MODELS: Record<Provider, string> = {
  claude: process.env.CLAUDE_MODEL ?? 'claude-opus-5-5',
  codex: process.env.CODEX_MODEL ?? 'gpt-5.6-sol',
};
// Triage only screens and scores candidates from their titles, so it runs on a cheaper model.
export const TRIAGE_MODEL = process.env.TRIAGE_MODEL ?? 'claude-sonnet-5-5';
const VIA: Record<Provider, string> = { claude: 'claude-code', codex: 'codex-cli' };

export const otherProvider = (p: Provider): Provider => (p === 'claude' ? 'codex' : 'claude');
export const providerOfModel = (model: string): Provider => (/^claude/i.test(model) ? 'claude' : 'codex');

export type LlmCall = { prompt: string; schema: object; web: boolean; cwd: string; timeoutMs?: number; model?: string };
export type LlmResult<T> = { data: T; model: string; via: string };

function exec(cmd: string, args: string[], input: string, cwd: string, timeoutMs: number) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`${cmd} timed out after ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
    child.stdin.end(input);
  });
}

async function runClaude<T>(call: LlmCall, timeoutMs: number): Promise<T> {
  const tools = call.web ? 'WebSearch,WebFetch' : '';
  const args = [
    '-p',
    '--output-format',
    'json',
    '--json-schema',
    JSON.stringify(call.schema),
    '--model',
    call.model ?? MODELS.claude,
    // Keep runs hermetic: no MCP servers, no user hooks or CLAUDE.md, no saved session.
    '--strict-mcp-config',
    '--setting-sources',
    'project',
    '--no-session-persistence',
    '--tools',
    tools,
    ...(tools ? ['--allowedTools', tools] : []),
  ];
  const { code, stdout, stderr } = await exec('claude', args, call.prompt, call.cwd, timeoutMs);
  let events: any;
  try {
    events = JSON.parse(stdout);
  } catch {
    throw new Error(`claude exited ${code}: ${(stderr || stdout).slice(-800)}`);
  }
  const result = (Array.isArray(events) ? events : [events]).find((e) => e?.type === 'result');
  if (!result || result.is_error) throw new Error(`claude failed: ${JSON.stringify(result ?? events).slice(0, 800)}`);
  return (result.structured_output ?? JSON.parse(result.result)) as T;
}

async function runCodex<T>(call: LlmCall, timeoutMs: number): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'wdgdfy-'));
  try {
    const schemaPath = join(dir, 'schema.json');
    const outPath = join(dir, 'out.json');
    await writeFile(schemaPath, JSON.stringify(call.schema));
    const args = [
      ...(call.web ? ['--search'] : []),
      'exec',
      '--skip-git-repo-check',
      '--sandbox',
      'read-only',
      '--model',
      call.model ?? MODELS.codex,
      '-c',
      `model_reasoning_effort=${process.env.CODEX_EFFORT ?? 'high'}`,
      '--output-schema',
      schemaPath,
      '--output-last-message',
      outPath,
      '-',
    ];
    const { code, stdout, stderr } = await exec('codex', args, call.prompt, call.cwd, timeoutMs);
    const out = await readFile(outPath, 'utf8').catch(() => '');
    if (!out) throw new Error(`codex exited ${code}: ${(stderr || stdout).slice(-800)}`);
    return JSON.parse(out) as T;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function runLlm<T>(provider: Provider, call: LlmCall): Promise<LlmResult<T>> {
  const timeoutMs = call.timeoutMs ?? 20 * 60_000;
  const data = provider === 'claude' ? await runClaude<T>(call, timeoutMs) : await runCodex<T>(call, timeoutMs);
  return { data, model: call.model ?? MODELS[provider], via: VIA[provider] };
}
