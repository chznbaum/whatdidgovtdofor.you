// In the browser: the action index and the cards lists load beyond what they render (see src/lib/search.ts).
export type ActionIndex = {
  status: string[];
  level: string[];
  topic: string[];
  // [id, name, kind, parent position or -1, positions of the place and everything inside it]
  place: [string, string, string, number, number[]][];
  // [slug, status, level, topics, places], newest first
  actions: [string, number, number, number[], number[]][];
};

let index: Promise<ActionIndex> | undefined;
export const getIndex = () => (index ??= fetch('/action-index.json').then((r) => r.json()));

// The list items for these actions, in order, from /card/<slug>.html. Card headlines are h2s; a list under its own
// h2 (as on /you) asks for h3s.
export async function cardItems(slugs: string[], heading: 'h2' | 'h3' = 'h2'): Promise<Element[]> {
  const html = await Promise.all(slugs.map((s) => fetch(`/card/${s}.html`).then((r) => (r.ok ? r.text() : ''))));
  const t = document.createElement('template');
  t.innerHTML = html.join('');
  const items = [...t.content.children];
  if (heading === 'h3') {
    for (const h2 of t.content.querySelectorAll('h2')) {
      const h3 = document.createElement('h3');
      for (const a of h2.attributes) h3.setAttribute(a.name, a.value);
      h3.append(...h2.childNodes);
      h2.replaceWith(h3);
    }
  }
  return items;
}
