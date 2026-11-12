// Renders episode.html frame by frame through headless Chrome (DevTools protocol, no extra packages).
//   node render.js stills <t1,t2,...> <outdir>          -> PNG keyframes
//   node render.js video <out.mp4> [fps] [from] [to]     -> silent H.264 video, 1080×1920
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 9333 + Math.floor(Math.random() * 500);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function openPage() {
  const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
    `--remote-debugging-port=${PORT}`, '--window-size=1080,1920', '--force-device-scale-factor=1', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
  let page;
  for (let i = 0; i < 100 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === 'page'); } catch (e) { /* not up yet */ }
    if (!page) await sleep(150);
  }
  if (!page) throw new Error('Chrome did not start');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
    }
  });
  const send = (method, params) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params: params || {} })); });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text);
    return r.result.value;
  };
  await send('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
  await send('Page.enable');
  await send('Page.navigate', { url: 'file://' + path.join(__dirname, 'episode.html') });
  for (let i = 0; i < 100; i++) {
    const st = await evaluate('JSON.stringify({ready: !!window.READY, err: window.ERR || null})').catch(() => null);
    if (st) {
      const s = JSON.parse(st);
      if (s.err) throw new Error('page error: ' + s.err);
      if (s.ready) break;
    }
    await sleep(100);
  }
  const shot = async (t, format) => {
    await evaluate(`renderFrame(${t})`);
    const { data } = await send('Page.captureScreenshot', format === 'png' ? { format: 'png' } : { format: 'jpeg', quality: 93 });
    return Buffer.from(data, 'base64');
  };
  return { chrome, evaluate, shot, close: () => { ws.close(); chrome.kill('SIGKILL'); } };
}

async function main() {
  const [mode, a1, a2, a3, a4] = process.argv.slice(2);
  const p = await openPage();
  try {
    if (mode === 'stills') {
      fs.mkdirSync(a2, { recursive: true });
      const times = a1.split(',').map(Number);
      for (let i = 0; i < times.length; i++) fs.writeFileSync(path.join(a2, `k${String(i).padStart(2, '0')}.png`), await p.shot(times[i], 'png'));
      console.log(`${times.length} stills -> ${a2}`);
    } else if (mode === 'video') {
      const fps = +(a2 || 30), dur = await p.evaluate('window.DURATION');
      const from = +(a3 || 0), to = Math.min(+(a4 || dur), dur), frames = Math.round((to - from) * fps);
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps), '-movflags', '+faststart', a1], { stdio: ['pipe', 'inherit', 'inherit'] });
      const t0 = Date.now();
      for (let f = 0; f < frames; f++) {
        const buf = await p.shot(from + f / fps, 'jpeg');
        if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
        if (f % 300 === 0) console.log(`frame ${f}/${frames}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      }
      ff.stdin.end();
      await new Promise((r) => ff.on('close', r));
      console.log(`video ${a1}: ${frames} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    } else throw new Error('mode must be stills or video');
  } finally { p.close(); }
}
main().catch((e) => { console.error(e.message); process.exit(1); });
