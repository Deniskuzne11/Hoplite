// Sound mix for episode 1. Every effect is anchored to a spoken word from anim/timing.json,
// so it re-syncs together with the animation when the real voiceover timing arrives.
//   node mix.js                 -> out/bed.wav: music + effects only, at their final levels (voice slot left empty)
//   node mix.js <voice file>    -> out/mix.wav: voice + music + effects, normalised to -14 LUFS, true peak -1 dBTP
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TM = JSON.parse(fs.readFileSync(path.join(ROOT, 'anim', 'timing.json'), 'utf8'));
const WORDS = TM.words, DUR = TM.duration;
const VOICE_LUFS = -14;                 // reference voice level
const MUSIC_LUFS = VOICE_LUFS - 19;     // background track ~19 dB under the voice

function W(line, norm, occ) {
  let k = 0;
  for (const w of WORDS) if (w.line === line && w.n === norm) { if (k === (occ || 0)) return w.s; k++; }
  throw new Error(`cue word not found: line ${line} "${norm}"`);
}
const LS = (L) => WORDS.find((w) => w.line === L).s - 0.12;
const RUN = W(13, 'run');

function lufs(file) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' });
  const s = r.stderr.slice(r.stderr.lastIndexOf('Summary:'));
  return +s.match(/I:\s+(-?[\d.]+) LUFS/)[1];
}
const raw = (n) => path.join(__dirname, 'raw', n + '.mp3');
const cache = {};
const srcL = (n) => (cache[n] == null ? (cache[n] = lufs(raw(n))) : cache[n]);

// at: timeline second; from/len: segment of the source; lufs: target loudness of that sound;
// trim: cut leading silence (one-shots); fi/fo: fade in/out seconds.
const FX = [
  // hook + radio
  { src: 'heartbeat', at: 0, from: 2, len: LS(1) + 0.4, lufs: -30, fi: 0.05, fo: 0.8 },
  { src: 'radio_static', at: LS(1) - 0.1, from: 3, len: LS(2) - LS(1) + 0.3, lufs: -37, fi: 0.15, fo: 0.6 },
  { src: 'thunder', at: W(1, 'three') - 0.6, from: 5, len: 7, lufs: -37, fi: 0.3, fo: 2.5 },
  // outside: the stuffy August night
  { src: 'amb_city_night', at: LS(2), from: 20, len: LS(7) - LS(2) + 1.5, lufs: -40, fi: 1.0, fo: 1.5 },
  { src: 'steps_walk', at: LS(2) + 0.2, from: 3, len: 5.5, lufs: -36, fi: 0.3, fo: 1.0 },
  { src: 'wind_gust', at: W(3, 'they') - 0.4, trim: 1, len: 4.5, lufs: -36, fi: 0.4, fo: 1.5 },
  { src: 'zombie_moan', at: W(3, 'standing') + 0.6, from: 4, len: 4.5, lufs: -40, fi: 0.8, fo: 1.5 },
  { src: 'steps_walk', at: LS(5) + 0.3, from: 3, len: 5.5, lufs: -37, fi: 0.3, fo: 1.0 },
  { src: 'creak', at: W(5, 'known') - 0.2, trim: 1, len: 1.6, lufs: -36, fo: 0.4 },
  // the boarded passage: prying, then the crash
  { src: 'creak_door', at: W(6, 'boarded') + 0.1, from: 3, len: W(6, 'crash') - W(6, 'boarded') - 0.05, lufs: -34, fi: 0.2, fo: 0.15 },
  { src: 'wood_break', at: W(6, 'crash') - 0.03, trim: 1, len: 1.4, lufs: -22, fo: 0.3 },
  { src: 'wood_crack', at: W(6, 'crash') + 0.25, from: 30, len: 1.8, lufs: -33, fi: 0.05, fo: 0.8 },
  // the bridge turns
  { src: 'zombie_horde', at: W(7, 'turned') - 0.15, from: 4, len: LS(8) - W(7, 'turned') + 0.6, lufs: -35, fi: 0.15, fo: 0.5 },
  { src: 'rain_street', at: W(7, 'behind') - 0.3, from: 3, len: RUN - W(7, 'behind') + 0.3, lufs: -39, fi: 1.5, fo: 0.05 },
  // running into the men; the shot
  { src: 'steps_run', at: LS(8) - 0.1, from: 3, len: W(8, 'straight') - LS(8) + 0.5, lufs: -33, fi: 0.1, fo: 0.3 },
  { src: 'gunshot', at: W(10, 'fired') - 0.02, trim: 1, len: 2.4, lufs: -21, fo: 1.2 },
  { src: 'zombie_horde', at: W(10, 'gunshot') - 0.1, from: 12, len: LS(11) - W(10, 'gunshot') + 0.4, lufs: -31, fi: 0.4, fo: 0.8 },
  { src: 'steps_run', at: W(10, 'gunshot') + 0.2, from: 20, len: LS(11) - W(10, 'gunshot'), lufs: -36, fi: 0.4, fo: 0.8 },
  // stadium: floodlights hum, then the voice from the stands
  { src: 'neon_hum', at: W(11, 'floodlights') - 0.1, from: 3, len: RUN - W(11, 'floodlights') + 0.1, lufs: -40, fi: 0.05, fo: 0.05 },
  { src: 'wind_gust', at: LS(13) + 0.2, trim: 1, len: 4, lufs: -37, fi: 0.6, fo: 1.5 },
  { src: 'heartbeat', at: W(13, 'brother'), from: 10, len: RUN - W(13, 'brother'), lufs: -31, fi: 0.3, fo: 0.05 },
  // after "Run.": one last heartbeat in the black
  { src: 'heartbeat', at: RUN + 0.9, from: 5.2, len: 1.6, lufs: -32, fi: 0.02, fo: 0.8 },
];

// Music: CC0 drone, slowed to 0.82x (lower and darker, and long enough for the whole episode).
const MUSIC = { src: 'music_spacedrone', rate: 0.82, fi: 2.5 };

function build(voice) {
  const inputs = [];
  const parts = [];
  const labels = [];
  const add = (file) => { inputs.push('-i', file); return inputs.length / 2 - 1; };

  const mi = add(raw(MUSIC.src));
  const mGain = MUSIC_LUFS - srcL(MUSIC.src);
  // music cuts out on "Run." and returns, quieter, under the 06:00 title card
  const duck = `volume='if(lt(t,${RUN.toFixed(3)}),1,if(lt(t,${(RUN + 1.4).toFixed(3)}),0.0,0.45))':eval=frame`;
  parts.push(`[${mi}:a]aresample=48000,asetrate=${Math.round(48000 * MUSIC.rate)},aresample=48000,aformat=channel_layouts=stereo,` +
    `atrim=0:${DUR.toFixed(3)},asetpts=PTS-STARTPTS,volume=${mGain.toFixed(2)}dB,afade=t=in:d=${MUSIC.fi},${duck},` +
    `afade=t=out:st=${(DUR - 1.6).toFixed(3)}:d=1.6[mus]`);
  labels.push('[mus]');

  FX.forEach((f, i) => {
    if (process.env.MUSIC_ONLY) return;
    const k = add(raw(f.src));
    const g = f.lufs - srcL(f.src);
    let c = `[${k}:a]aresample=48000,aformat=channel_layouts=stereo,`;
    if (f.trim) c += 'silenceremove=start_periods=1:start_threshold=-45dB,';
    c += `atrim=${f.from || 0}:${((f.from || 0) + f.len).toFixed(3)},asetpts=PTS-STARTPTS,volume=${g.toFixed(2)}dB`;
    if (f.fi) c += `,afade=t=in:d=${f.fi}`;
    if (f.fo) c += `,afade=t=out:st=${Math.max(0, f.len - f.fo).toFixed(3)}:d=${f.fo}`;
    c += `,adelay=${Math.max(0, Math.round(f.at * 1000))}:all=1[f${i}]`;
    parts.push(c);
    labels.push(`[f${i}]`);
  });

  if (voice) {
    const vi = add(voice);
    parts.push(`[${vi}:a]aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=${VOICE_LUFS}:TP=-2:LRA=11,adelay=${Math.round(TM.lead * 1000)}:all=1[vox]`);
    labels.push('[vox]');
  }
  parts.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0:duration=longest,atrim=0:${DUR.toFixed(3)}[pre]`);
  return { inputs, graph: parts.join(';') };
}

function run(args) {
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(r.stderr.split('\n').slice(-15).join('\n'));
  return r.stderr;
}

const voice = process.argv[2];
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
const { inputs, graph } = build(voice);
if (!voice) {
  const out = path.join(ROOT, 'out', 'bed.wav');
  run(['-y', '-hide_banner', ...inputs, '-filter_complex', graph + ';[pre]alimiter=limit=0.89:level=false[o]', '-map', '[o]', '-c:a', 'pcm_s16le', out]);
  console.log(`bed (music + effects, voice slot empty) -> ${out}, ${FX.length} effects, music ${MUSIC_LUFS} LUFS target`);
} else {
  // two-pass loudness normalisation of the full mix to -14 LUFS / -1 dBTP
  const pre = path.join(ROOT, 'out', 'mix_pre.wav');
  run(['-y', '-hide_banner', ...inputs, '-filter_complex', graph, '-map', '[pre]', '-c:a', 'pcm_f32le', pre]);
  const m = JSON.parse(run(['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json', '-f', 'null', '-']).match(/\{[\s\S]*\}/)[0]);
  const out = path.join(ROOT, 'out', 'mix.wav');
  run(['-y', '-hide_banner', '-i', pre, '-af', `loudnorm=I=-14:TP=-1:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`, '-c:a', 'pcm_s16le', out]);
  console.log(`final mix -> ${out}`);
}
