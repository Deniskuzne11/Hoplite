// ElevenLabs helper. Reads ELEVENLABS_API_KEY from the environment and never prints it.
//   node eleven.js info                                   -> plan, characters used/left, available voices
//   node eleven.js say <voice_id> <model> <textfile> <outname> [stability]
//        -> voice/<outname>.mp3 + voice/<outname>.alignment.json (character timestamps)
'use strict';
const fs = require('fs');
const path = require('path');

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('ELEVENLABS_API_KEY is not set'); process.exit(1); }
const API = 'https://api.elevenlabs.io';
const H = { 'xi-api-key': KEY, 'Content-Type': 'application/json' };

async function call(method, url, body) {
  const r = await fetch(API + url, { method, headers: H, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(180000) });
  const txt = await r.text();
  if (!r.ok) throw new Error(`${method} ${url} -> HTTP ${r.status}: ${txt.slice(0, 400)}`);
  return JSON.parse(txt);
}

async function info() {
  try {
    const s = await call('GET', '/v1/user/subscription');
    console.log(`plan=${s.tier} used=${s.character_count} limit=${s.character_limit} left=${s.character_limit - s.character_count} resets=${s.next_character_count_reset_unix ? new Date(s.next_character_count_reset_unix * 1000).toISOString().slice(0, 10) : '?'}`);
  } catch (e) { console.log('subscription: ' + e.message.slice(0, 160)); }
  const v = await call('GET', '/v2/voices?page_size=100');
  for (const x of v.voices) {
    const l = x.labels || {};
    console.log(`${x.voice_id}  ${(x.name || '').slice(0, 34).padEnd(34)} ${(x.category || '').padEnd(10)} ${l.gender || ''}/${l.age || ''}/${l.accent || ''}  ${(l.descriptive || l.description || l.use_case || '').slice(0, 40)}`);
  }
}

async function say(voice, model, textFile, name, stability) {
  const text = fs.readFileSync(textFile, 'utf8').trim();
  const body = { text, model_id: model, output_format: 'mp3_44100_128' };
  if (stability != null) body.voice_settings = { stability: +stability, similarity_boost: 0.8, style: 0, use_speaker_boost: true };
  const j = await call('POST', `/v1/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_128`, body);
  const dir = path.join(__dirname);
  fs.writeFileSync(path.join(dir, name + '.mp3'), Buffer.from(j.audio_base64, 'base64'));
  fs.writeFileSync(path.join(dir, name + '.alignment.json'), JSON.stringify({ alignment: j.alignment, normalized_alignment: j.normalized_alignment }));
  const al = j.alignment || j.normalized_alignment;
  console.log(`ok ${name}: ${text.length} chars sent, audio ends ~${al ? al.character_end_times_seconds.slice(-1)[0].toFixed(2) : '?'}s`);
}

const [cmd, ...a] = process.argv.slice(2);
(cmd === 'info' ? info() : say(...a)).catch((e) => { console.error('ERROR ' + e.message); process.exit(1); });
