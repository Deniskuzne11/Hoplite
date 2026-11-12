// Shortens long silences in a take and writes a matching alignment file.
//   node tighten.js <in-name> <out-name> [cap=0.65]
// Gaps between words longer than `cap` are cut in the middle, keeping cap/2 of room on each side.
// A few dramatic pauses keep a longer cap (see KEEP). Speech itself is untouched.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const [inName, outName, capArg] = process.argv.slice(2);
const CAP = +(capArg || 0.65);
// Longer pauses that carry the drama: key = the word that follows the pause.
const KEEP = { 'and@3': 0.95, 'why@4': 0.9, "they're@4": 0.8, 'behind@7': 0.85, 'mister@9': 0.75, 'they@11': 0.9, 'run@13': 1.45 };

const dir = __dirname;
const j = JSON.parse(fs.readFileSync(path.join(dir, inName + '.alignment.json'), 'utf8'));
const al = j.alignment;
const C = al.characters, S = al.character_start_times_seconds, E = al.character_end_times_seconds;

// spoken words (tags excluded) with their line index (lines = newline characters)
const words = [];
let cur = null, inTag = false, line = 0;
C.forEach((c, i) => {
  if (c === '\n') { line++; cur = null; return; }
  if (c === '[') { inTag = true; cur = null; return; }
  if (inTag) { if (c === ']') inTag = false; return; }
  if (/[A-Za-z0-9'-]/.test(c)) {
    if (!cur) { cur = { txt: '', s: S[i], e: E[i], line }; words.push(cur); }
    cur.txt += c.toLowerCase(); cur.e = E[i];
  } else if (/\s/.test(c)) cur = null;
});

const cuts = [];
for (let i = 1; i < words.length; i++) {
  const g = words[i].s - words[i - 1].e;
  const cap = KEEP[`${words[i].txt}@${words[i].line}`] || CAP;
  if (g > cap) cuts.push([words[i - 1].e + cap / 2, words[i].s - cap / 2]);
}
const total = +spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(dir, inName + '.mp3')], { encoding: 'utf8' }).stdout;
const lastEnd = words[words.length - 1].e;
const keeps = [];
let t = 0;
for (const [a, b] of cuts) { keeps.push([t, a]); t = b; }
keeps.push([t, Math.min(total, lastEnd + 0.6)]);

const removedBefore = (x) => cuts.reduce((acc, [a, b]) => acc + (x >= b ? b - a : x > a ? x - a : 0), 0);
const map = (x) => +(x - removedBefore(x)).toFixed(3);
const out = { alignment: { characters: C, character_start_times_seconds: S.map(map), character_end_times_seconds: E.map(map) } };
fs.writeFileSync(path.join(dir, outName + '.alignment.json'), JSON.stringify(out));

// 12 ms fades at every join so the cuts never click
const F = 0.012;
const parts = keeps.map(([a, b], i) => `[0:a]atrim=${a.toFixed(3)}:${b.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=${F},afade=t=out:st=${(b - a - F).toFixed(3)}:d=${F}[k${i}]`);
const graph = parts.join(';') + ';' + keeps.map((_, i) => `[k${i}]`).join('') + `concat=n=${keeps.length}:v=0:a=1[o]`;
const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', path.join(dir, inName + '.mp3'), '-filter_complex', graph, '-map', '[o]', '-c:a', 'pcm_s16le', '-ar', '44100', path.join(dir, outName + '.wav')], { encoding: 'utf8' });
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
const removed = cuts.reduce((a, [x, y]) => a + y - x, 0);
console.log(`${cuts.length} pauses shortened, ${removed.toFixed(1)}s removed; last word now ends at ${map(lastEnd).toFixed(2)}s -> ${outName}.wav`);
