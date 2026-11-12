// Prints words + times from an alignment file, and loudness of each half of the audio.
//   node inspect.js <name>
'use strict';
const fs = require('fs');
const { spawnSync } = require('child_process');
const name = process.argv[2];
const j = JSON.parse(fs.readFileSync(`${__dirname}/${name}.alignment.json`, 'utf8'));
for (const key of ['alignment', 'normalized_alignment']) {
  const al = j[key];
  if (!al) { console.log(key + ': none'); continue; }
  const words = [];
  let cur = null;
  al.characters.forEach((c, i) => {
    if (/\s/.test(c)) { cur = null; return; }
    if (!cur) { cur = { w: '', s: al.character_start_times_seconds[i], e: 0 }; words.push(cur); }
    cur.w += c; cur.e = al.character_end_times_seconds[i];
  });
  console.log(key + ': ' + words.map((w) => `${w.w}@${w.s.toFixed(2)}-${w.e.toFixed(2)}`).join(' '));
}
const split = (s, d) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-ss', String(s), '-t', String(d), '-i', `${__dirname}/${name}.mp3`, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
  return (r.stderr.match(/mean_volume: (-?[\d.]+)/) || [])[1];
};
const al = j.alignment;
const idx = al.characters.join('').indexOf('"');
const tq = al.character_start_times_seconds[idx];
console.log(`mean dB before quote: ${split(0, tq)}   after quote (whisper): ${split(tq, 30)}`);
