// A body's name (a council, a board, an agency) stands in for a face, set in Young Serif as large as its box allows.
// The name has to fit whole: no word broken or cut off at the edge. Both the site (Face.astro) and the share images
// (og/[slug].png.ts) size it here.

// Young Serif's advance widths in thousandths of an em, read from @fontsource/young-serif's latin and latin-ext files
// (with fontkitten). Kerning is left out, so fits keep a little room.
const WIDTHS: Record<string, number> = {
  "0":602, "1":397, "2":543, "3":529, "4":575, "5":537, "6":608, "7":572, "8":558, "9":608, " ":250, "!":373,
  "\"":402, "#":760, "$":723, "%":883, "&":813, "'":214, "(":454, ")":454, "*":582, "+":600, ",":316, "-":511,
  ".":313, "/":500, ":":313, ";":316, "<":600, "=":600, ">":600, "?":540, "@":1042, "A":786, "B":719, "C":749,
  "D":790, "E":755, "F":694, "G":772, "H":898, "I":407, "J":525, "K":798, "L":699, "M":1036, "N":891, "O":822,
  "P":700, "Q":822, "R":798, "S":723, "T":788, "U":808, "V":784, "W":1207, "X":853, "Y":794, "Z":745, "[":397,
  "\\":500, "]":397, "^":600, "_":598, "`":600, "a":619, "b":609, "c":514, "d":619, "e":515, "f":402, "g":522,
  "h":681, "i":347, "j":303, "k":631, "l":347, "m":1036, "n":681, "o":574, "p":631, "q":625, "r":530, "s":542,
  "t":410, "u":659, "v":600, "w":932, "x":603, "y":578, "z":544, "{":456, "|":600, "}":456, "~":600, "á":619, "à":619,
  "â":619, "ä":619, "ã":619, "å":619, "ç":514, "é":515, "è":515, "ê":515, "ë":515, "í":347, "ì":347, "î":347, "ï":347,
  "ñ":681, "ó":574, "ò":574, "ô":574, "ö":574, "õ":574, "ú":659, "ù":659, "û":659, "ü":659, "ý":578, "Á":786, "É":755,
  "Í":407, "Ó":822, "Ú":808, "Ñ":891, "Ü":808, "’":316, "‘":316, "“":539, "”":539, "–":549, "—":751,
};
const OTHER = 620; // a character not in the table: about an average lowercase letter

// A word's width in ems, with the type's tracking (letter-spacing, in ems) after each letter.
const ems = (word: string, tracking: number) => [...word].reduce((sum, ch) => sum + (WIDTHS[ch] ?? OTHER) / 1000 + tracking, 0);

// The longest word's width in ems: no line can be narrower than this.
export function longestWord(name: string, tracking: number): number {
  return Math.max(...name.split(/\s+/).map((w) => ems(w, tracking)));
}

// The largest type size, up to `max`, at which `name` wraps into a box `width` wide and `height` tall. All three
// are in the same unit (cqw, px), and so is the answer.
export function fitName(name: string, box: { width: number; height: number; max: number; lineHeight: number; tracking: number }): number {
  const words = name.split(/\s+/).filter(Boolean);
  const space = ems(' ', box.tracking);
  const lines = (measure: number) => {
    let count = 1;
    let line = 0;
    for (const w of words.map((w) => ems(w, box.tracking))) {
      if (line && line + space + w > measure) {
        count++;
        line = w;
      } else line += (line ? space : 0) + w;
    }
    return count;
  };
  let size = Math.min(box.max, (box.width * 0.97) / longestWord(name, box.tracking));
  while (lines(box.width / size) * box.lineHeight * size > box.height) size *= 0.97;
  return Math.round(size * 100) / 100;
}
