"""Merge one entry into a shared JSON manifest (sources.json or eyes.json) under a file lock, so parallel agents
never clobber each other's entries. Re-reads the file inside the lock, sets only this id, writes it back in the
format the portrait tools use (indent 2, non-ASCII escaped, trailing newline).

Usage: python3 pipeline/portraits/merge.py <manifest.json> <id> '<entry as JSON>' [--replace]
Without --replace it refuses to overwrite an existing entry (exit 2).
"""
import fcntl
import json
import sys
from pathlib import Path

path, pid, raw = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
replace = '--replace' in sys.argv[4:]
entry = json.loads(raw)
with open(str(path) + '.lock', 'w') as lock:
    fcntl.flock(lock, fcntl.LOCK_EX)
    data = json.loads(path.read_text()) if path.exists() else {}
    if pid in data and not replace:
        print(f'{pid}: already in {path.name}; pass --replace to overwrite', file=sys.stderr)
        sys.exit(2)
    data[pid] = entry
    tmp = path.with_suffix('.json.tmp')
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=True) + '\n')
    tmp.replace(path)
print(f'{pid}: saved to {path.name}')
