// Builds timing.js (word start/end seconds) for the animation.
//   node make_timing.js                      -> estimated timing from voiceover.md (draft, no audio yet)
//   node make_timing.js <alignment.json>     -> real timing from an ElevenLabs "with-timestamps" alignment
'use strict';
const fs = require('fs');
const path = require('path');

const LEAD = 0.6; // seconds of picture (clock + heartbeat) before the first word
const TAIL = 3.4; // black + "06:00" after the last word

const DANGER = new Set(['six', 'listening', 'crash', 'heard', 'nail', 'palm', 'turned', 'rifles', "kid's", 'hand', 'bite', 'fired', 'gunshot', 'sorting', 'left', 'run']);
const KEY = new Set(['morning', 'convoy', 'stadium', 'wristband', 'wristbands', 'seat', 'crowbar', 'tyoma', 'questions', 'bridge', 'courtyards', 'boarded', 'mister', 'fifty-two', 'floodlights', 'flashlight', 'voice', 'brother']);

const md = fs.readFileSync(path.join(__dirname, '..', 'voiceover.md'), 'utf8');
const lines = md.split('```')[1].trim().split('\n');

// Tokenise the script once; both modes share it.
const script = [];
lines.forEach((line, L) => {
  let inQ = false;
  for (const tok of line.match(/\[[^\]]+\]|[^\s[]+/g)) {
    if (tok.startsWith('[')) { script.push({ cue: tok.slice(1, -1), line: L }); continue; }
    if (tok === '—') { script.push({ dash: true, line: L }); continue; }
    if (tok.startsWith('"')) inQ = true;
    const dlg = inQ;
    if (/"[.,?!:]*$/.test(tok)) inQ = false;
    const clean = tok.replace(/["“”]/g, '');
    const norm = clean.toLowerCase().replace(/[^a-z0-9'-]/g, '');
    script.push({
      line: L, raw: clean, t: clean.replace(/[.,:;]+$/, ''), n: norm, dlg,
      key: DANGER.has(norm) ? 'd' : KEY.has(norm) ? 'k' : '',
      stop: /[.?!]$/.test(clean) ? 'end' : /[,:;]$/.test(clean) ? 'comma' : '',
    });
  }
});

function estimate() {
  let t = LEAD, rate = 1, line = 0;
  const words = [];
  for (const it of script) {
    if (it.line !== line) { t += 0.25; line = it.line; }
    if (it.cue) {
      if (it.cue === 'long pause') t += 1.3; else if (it.cue === 'pause') t += 0.55;
      else rate = /fast/.test(it.cue) ? 0.85 : /slow|short phrases/.test(it.cue) ? 1.15 : /whisper/.test(it.cue) ? 1.05 : 1;
      continue;
    }
    if (it.dash) { t += 0.3; continue; }
    const d = (0.09 + 0.052 * it.n.replace(/[^a-z0-9]/g, '').length) * rate;
    words.push(Object.assign({}, it, { s: +t.toFixed(3), e: +(t + d).toFixed(3) }));
    t += d + (it.stop === 'end' ? 0.38 : it.stop === 'comma' ? 0.18 : 0);
  }
  return words;
}

// ElevenLabs alignment: { characters:[], character_start_times_seconds:[], character_end_times_seconds:[] }
function fromAlignment(file) {
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  const al = j.normalized_alignment || j.alignment || j;
  const chars = al.characters, cs = al.character_start_times_seconds, ce = al.character_end_times_seconds;
  const spoken = [];
  let cur = null;
  chars.forEach((c, i) => {
    if (/[A-Za-z0-9']/.test(c)) {
      if (!cur) { cur = { txt: '', s: cs[i], e: ce[i] }; spoken.push(cur); }
      cur.txt += c.toLowerCase(); cur.e = ce[i];
    } else if (c !== '-') cur = null;
  });
  const words = [];
  let k = 0;
  for (const it of script) {
    if (!it.n) continue;
    const want = it.n.replace(/[^a-z0-9']/g, '');
    while (k < spoken.length && !spoken[k].txt.startsWith(want.slice(0, 3))) k++;
    if (k >= spoken.length) throw new Error('alignment lost at word: ' + it.raw);
    words.push(Object.assign({}, it, { s: +(spoken[k].s + LEAD).toFixed(3), e: +(spoken[k].e + LEAD).toFixed(3) }));
    k++;
  }
  return words;
}

const words = process.argv[2] ? fromAlignment(process.argv[2]) : estimate();
const out = { source: process.argv[2] ? 'alignment' : 'estimate', lead: LEAD, duration: +(words[words.length - 1].e + TAIL).toFixed(3), words };
fs.writeFileSync(path.join(__dirname, 'timing.json'), JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(__dirname, 'timing.js'), 'window.TIMING = ' + JSON.stringify(out) + ';\n');
console.log(`${out.source}: ${words.length} words, duration ${out.duration}s`);
