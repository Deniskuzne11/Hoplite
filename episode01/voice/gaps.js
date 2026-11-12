// Lists silences between words (from anim/timing.json) and total speech vs pause time.
'use strict';
const T = require('../anim/timing.json');
let pause = 0;
const gaps = [];
T.words.forEach((w, i) => {
  if (!i) return;
  const g = w.s - T.words[i - 1].e;
  pause += Math.max(0, g);
  if (g > 0.45) gaps.push(`${g.toFixed(2)}s before "${w.raw}" (line ${w.line})`);
});
const speech = T.words.reduce((a, w) => a + (w.e - w.s), 0);
console.log(`speech ${speech.toFixed(1)}s, pauses ${pause.toFixed(1)}s, last word ends ${T.words.at(-1).e.toFixed(1)}s`);
console.log(gaps.join('\n'));
