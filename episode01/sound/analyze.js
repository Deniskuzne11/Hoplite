// Loudness / duration report for raw/*.mp3 (and any files passed as args).
//   node analyze.js [files...]   -> name, seconds, integrated LUFS, loudness range, true peak, 1-s loudness profile
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const files = process.argv.slice(2).length ? process.argv.slice(2)
  : fs.readdirSync(path.join(__dirname, 'raw')).filter((f) => f.endsWith('.mp3')).map((f) => path.join(__dirname, 'raw', f));

for (const f of files) {
  const dur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString();
  const log = execFileSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { stdio: ['ignore', 'pipe', 'pipe'] }).toString()
    + '';
  let err = '';
  try { execFileSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { stdio: ['ignore', 'ignore', 'pipe'] }); } catch (e) { err = String(e.stderr); }
  const r = require('child_process').spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' });
  const out = r.stderr + log + err;
  const sum = out.slice(out.lastIndexOf('Summary:'));
  const I = (sum.match(/I:\s+(-?[\d.]+) LUFS/) || [])[1];
  const LRA = (sum.match(/LRA:\s+([\d.]+) LU/) || [])[1];
  const TP = (sum.match(/Peak:\s+(-?[\d.inf]+) dBFS/) || [])[1];
  // short-term loudness sampled once per second
  const prof = [];
  for (const m of out.matchAll(/t:\s*([\d.]+)\s+TARGET.*?S:\s*(-?[\d.]+)/g)) {
    const t = Math.floor(+m[1]);
    if (prof[t] == null) prof[t] = Math.round(+m[2]);
  }
  const shown = prof.length > 40 ? prof.filter((_, i) => i % Math.ceil(prof.length / 40) === 0) : prof;
  console.log(`${path.basename(f, '.mp3').padEnd(18)} ${dur.toFixed(1).padStart(6)}s  I=${I} LRA=${LRA} TP=${TP}`);
  if (process.env.PROFILE) console.log('   S/s: ' + shown.join(' '));
}
