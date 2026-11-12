// Freesound helper — CC0 only.
//   node freesound.js search "<query>" [maxDurationSec]   -> top CC0 results (id, author, seconds, downloads, title)
//   node freesound.js get <id> <name>                     -> verifies CC0 on the sound page, downloads the HQ preview
//                                                            to raw/<name>.mp3 and records it in sources.json
'use strict';
const fs = require('fs');
const path = require('path');

const UA = { headers: { 'User-Agent': 'Mozilla/5.0 (06:00 episode sound research)' } };
const CC0 = 'creativecommons.org/publicdomain/zero/1.0';
const attr = (block, k) => { const m = block.match(new RegExp(`data-${k}="([^"]*)"`)); return m ? m[1] : ''; };
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

async function search(q, maxDur) {
  const url = `https://freesound.org/search/?q=${encodeURIComponent(q)}&f=${encodeURIComponent('license:"Creative Commons 0"')}&s=${encodeURIComponent('Downloads (most first)')}`;
  const html = await (await fetch(url, UA)).text();
  const rows = html.split('class="bw-player"').slice(1).map((b) => ({
    id: attr(b, 'sound-id'), user: attr(b, 'username'), title: dec(attr(b, 'title')),
    dur: +attr(b, 'duration'), dl: +attr(b, 'num-downloads'),
  })).filter((r) => r.id && (!maxDur || r.dur <= maxDur));
  const seen = new Set();
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    console.log(`${r.id.padEnd(7)} ${r.user.slice(0, 18).padEnd(18)} ${r.dur.toFixed(1).padStart(7)}s ${String(r.dl).padStart(6)}dl  ${r.title}`);
  }
}

async function get(id, name) {
  const page = `https://freesound.org/s/${id}/`;
  const res = await fetch(page, UA);
  const html = await res.text();
  const finalUrl = res.url;
  const licenses = [...new Set(html.match(/creativecommons\.org\/[a-z/.0-9-]+/gi) || [])];
  if (!licenses.length || !licenses.every((l) => l.includes('publicdomain/zero/1.0'))) throw new Error(`#${id} is not CC0: ${licenses.join(', ')}`);
  const title = dec((html.match(/<title>Freesound - (.*) by ([^<]*)<\/title>/) || [])[1] || '');
  const user = dec((html.match(/<title>Freesound - .* by ([^<]*)<\/title>/) || [])[1] || '');
  const mp3 = (html.match(/https:\/\/cdn\.freesound\.org\/previews\/[^"]*-hq\.mp3/) || [])[0];
  if (!mp3) throw new Error('no HQ preview for #' + id);
  const buf = Buffer.from(await (await fetch(mp3, UA)).arrayBuffer());
  fs.mkdirSync(path.join(__dirname, 'raw'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'raw', name + '.mp3'), buf);
  const dbFile = path.join(__dirname, 'sources.json');
  const db = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile, 'utf8')) : {};
  db[name] = { id: +id, title, author: user, page: finalUrl, file: mp3, license: 'CC0 1.0 Universal (https://' + CC0 + '/)', fetched: new Date().toISOString().slice(0, 10) };
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 1));
  console.log(`ok ${name}: #${id} "${title}" by ${user} — CC0 verified, ${(buf.length / 1024).toFixed(0)} KB`);
}

const [cmd, a, b] = process.argv.slice(2);
(cmd === 'search' ? search(a, b ? +b : 0) : get(a, b)).catch((e) => { console.error('ERROR', e.message); process.exit(1); });
