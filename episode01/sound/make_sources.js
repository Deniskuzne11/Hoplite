// Writes ../SOURCES.txt from sources.json, listing only the sounds mix.js actually uses.
'use strict';
const fs = require('fs');
const path = require('path');

const db = JSON.parse(fs.readFileSync(path.join(__dirname, 'sources.json'), 'utf8'));
const mix = fs.readFileSync(path.join(__dirname, 'mix.js'), 'utf8');
const used = Object.keys(db).filter((k) => mix.includes(`'${k}'`));
const role = {
  music_spacedrone: 'BACKGROUND MUSIC — whole episode (slowed to 0.82x, about 19 dB under the voice)',
  heartbeat: 'heartbeat — opening hook, last scene, final black frame',
  radio_static: 'radio static — kitchen, the evacuation announcement',
  thunder: 'distant thunder — heat lightning in the kitchen window',
  amb_city_night: 'quiet city night (crickets) — street, bridge, courtyards',
  steps_walk: 'footsteps — walking down the street and through the courtyards',
  wind_gust: 'wind — bridge reveal, stadium stands',
  zombie_moan: 'distant moan — the infected on the bridge',
  creak: 'creak — courtyards',
  creak_door: 'wood creaking — prying the board with the crowbar',
  wood_break: 'board breaking — "the board came off with a crash"',
  wood_crack: 'wood splinters — tail of the crash',
  zombie_horde: 'crowd of the infected — the bridge turns; the crowd runs past the doorway',
  rain_street: 'rain on pavement — from the torn palm to the end',
  steps_run: 'running footsteps — running into the men; the crowd',
  gunshot: 'rifle shot — "his partner stepped back and fired"',
  neon_hum: 'electric hum — stadium floodlights',
};

const lines = [
  '06:00 — Episode 1 — SOUND SOURCES',
  '=================================',
  '',
  'Every sound effect and the music in this episode is from Freesound (https://freesound.org)',
  'and is released under Creative Commons 0 (CC0 1.0 Universal, public domain dedication):',
  'https://creativecommons.org/publicdomain/zero/1.0/',
  'CC0 allows any use, including commercial, with no attribution required. Authors are listed anyway.',
  'The license was checked on each sound\'s own Freesound page at download time.',
  'Files used are the Freesound HQ previews (MP3); they were trimmed, faded, re-levelled and mixed.',
  'Voice: generated with ElevenLabs (model eleven_v3, premade voice "Jessica") — not CC0; see SERIES.md.',
  'On the ElevenLabs free plan the voice is for non-commercial use and requires attribution to ElevenLabs.',
  'No copyrighted music is used.',
  '',
];
used.forEach((k, i) => {
  const s = db[k];
  lines.push(`${String(i + 1).padStart(2)}. ${role[k] || k}`);
  lines.push(`    "${s.title}" by ${s.author} — Freesound #${s.id}`);
  lines.push(`    Page:    ${s.page}`);
  lines.push(`    License: ${s.license}`);
  lines.push(`    Fetched: ${s.fetched}   Local file: sound/raw/${k}.mp3`);
  lines.push('');
});
fs.writeFileSync(path.join(__dirname, '..', 'SOURCES.txt'), lines.join('\n'));
console.log(`SOURCES.txt: ${used.length} sounds (unused in mix: ${Object.keys(db).filter((k) => !used.includes(k)).join(', ') || 'none'})`);
