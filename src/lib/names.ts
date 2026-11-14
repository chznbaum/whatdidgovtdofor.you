// Matching a person's name as two sources write it ("John W. Mannion" and "John Mannion").
const normalize = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z ]/g, '')
    .replace(/\b(jr|sr|ii|iii)\b/g, '')
    .split(/\s+/)
    .filter(Boolean);
// "Robert C. "Bobby" Scott" and "Bobby Scott" match on last name plus any shared given name.
export const sameName = (a: string, b: string) => {
  const x = normalize(a);
  const y = normalize(b);
  return x.at(-1) === y.at(-1) && x.slice(0, -1).some((w) => y.includes(w));
};
