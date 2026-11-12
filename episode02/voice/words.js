// Prints spoken words with times and the long silences, straight from an alignment file.
//   node words.js <name>
'use strict';
const j = require(`./${process.argv[2]}.alignment.json`).alignment;
const words = [];
let cur = null, inTag = false, line = 0;
j.characters.forEach((c, i) => {
  if (c === '\n') { line++; cur = null; return; }
  if (c === '[') { inTag = true; cur = null; return; }
  if (inTag) { if (c === ']') inTag = false; return; }
  if (/[A-Za-z0-9'-]/.test(c)) {
    if (!cur) { cur = { w: '', s: j.character_start_times_seconds[i], e: 0, line }; words.push(cur); }
    cur.w += c; cur.e = j.character_end_times_seconds[i];
  } else if (/\s/.test(c)) cur = null;
});
const out = [];
words.forEach((w, i) => {
  const g = i ? w.s - words[i - 1].e : w.s;
  out.push((g > 0.45 ? ` ‖${g.toFixed(2)}‖ ` : ' ') + w.w);
});
console.log(`${words.length} words, ${line + 1} lines, last word ends ${words.at(-1).e.toFixed(2)}s\n` + out.join(''));
