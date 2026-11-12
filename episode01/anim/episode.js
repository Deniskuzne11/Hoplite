/* 06:00 — Episode 1 animation. renderFrame(t) draws the 1080×1920 frame at second t.
   Every beat is anchored to a spoken word from timing.js, so replacing the timing
   (estimate -> real voiceover alignment) re-syncs the whole episode. */
(function () {
  'use strict';
  const { person, CHAR, SCENES, PROPS, defs, crowbar, car, silhouette, rng, PAL, rain } = window.ART;
  const TM = window.TIMING, WORDS = TM.words, DUR = TM.duration;
  const n = (v) => Math.round(v * 10) / 10;

  // ---------------------------------------------------------------- timing helpers
  function W(line, norm, occ) {
    let k = 0;
    for (const w of WORDS) if (w.line === line && w.n === norm) { if (k === (occ || 0)) return w.s; k++; }
    throw new Error(`cue word not found: line ${line} "${norm}"`);
  }
  const lineStart = (L) => WORDS.find((w) => w.line === L).s;
  const NL = 14;
  const S = [];
  for (let L = 0; L < NL; L++) S[L] = L === 0 ? 0 : lineStart(L) - 0.12;
  const RUN = W(13, 'run');
  S[NL] = RUN;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const prog = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const ease = (k) => { k = clamp(k, 0, 1); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
  const hash = (i) => rng(i * 7919 + 13)();

  function flick(t, seed) {
    const h = hash(Math.floor(t * 12) + seed * 1000);
    return Math.sin(t * 0.9 + seed) > 0.55 ? (h < 0.45 ? 0.12 : 1) : (h < 0.04 ? 0.4 : 1);
  }
  function lightning(t) {
    const i = Math.floor(t * 1.5), h = hash(i + 77);
    return h < 0.2 ? Math.max(0, 1 - (t - i / 1.5) * 3) * (0.6 + h * 2) : 0;
  }
  function heartbeat(t) {
    const p = (t * 1.15) % 1;
    return Math.exp(-Math.pow((p - 0.05) / 0.04, 2)) + 0.6 * Math.exp(-Math.pow((p - 0.25) / 0.04, 2));
  }
  function shake(t, t0, dur, amp) {
    if (t < t0 || t > t0 + dur) return [0, 0];
    const k = 1 - (t - t0) / dur, f = Math.floor(t * 30);
    return [(hash(f) - 0.5) * 2 * amp * k, (hash(f + 999) - 0.5) * 2 * amp * k];
  }
  // Camera: look at (cx,cy) with zoom z, never showing outside the 1080×1920 world.
  function cam(content, cx, cy, z, sh) {
    const hw = 540 / z, hh = 960 / z;
    cx = clamp(cx, hw, 1080 - hw); cy = clamp(cy, hh, 1920 - hh);
    sh = sh || [0, 0];
    return `<g transform="translate(${n(540 + sh[0])} ${n(960 + sh[1])}) scale(${z.toFixed(4)}) translate(${n(-cx)} ${n(-cy)})">${content}</g>`;
  }

  // ---------------------------------------------------------------- motion helpers
  function walk(ph, amp) {
    amp = amp || 1;
    const s = Math.sin(ph), c = Math.cos(ph);
    return {
      fHip: 26 * s * amp, fKnee: -(c > 0 ? c * 38 : 4) * amp, bHip: -26 * s * amp, bKnee: -(c < 0 ? -c * 38 : 4) * amp,
      fSh: -20 * s * amp, fEl: 18 + 10 * amp, bSh: 20 * s * amp, bEl: 18 + 10 * amp, lean: 3 * amp,
    };
  }
  const bob = (ph, amp) => -Math.abs(Math.sin(ph)) * 5 * (amp || 1);
  function run(ph) {
    const p = walk(ph, 1.7), s = Math.sin(ph);
    return Object.assign(p, { lean: 14, crouch: 12, fSh: -45 * s, bSh: 45 * s, fEl: 85, bEl: 85 });
  }
  // World position of a hand, mirroring the rig in lib.js.
  function handPos(s, pose, x, y, sc, which) {
    const p = Object.assign({ fSh: 6, fEl: 8, bSh: -6, bEl: 8, lean: 0, crouch: 0, facing: 1 }, pose);
    const r = Math.PI / 180, hipY = -(s.leg1 + s.leg2) + p.crouch, shY = hipY - s.torso;
    const F = which !== 'B', a1 = F ? p.fSh : p.bSh, a2 = F ? p.fEl : p.bEl;
    const hx = (F ? 1 : -1) * s.shW * 0.28 + Math.sin(a1 * r) * s.arm1 + Math.sin((a1 + a2) * r) * s.arm2;
    const hy = shY + s.armW * 0.5 + Math.cos(a1 * r) * s.arm1 + Math.cos((a1 + a2) * r) * s.arm2;
    const L = p.lean * r, dy = hy - hipY;
    const rx = hx * Math.cos(L) - dy * Math.sin(L), ry = hx * Math.sin(L) + dy * Math.cos(L) + hipY;
    return { x: x + rx * sc * p.facing, y: y + ry * sc };
  }

  // ---------------------------------------------------------------- small effects
  function motes(t, seed, count, col, op) {
    const R = rng(seed);
    let o = '';
    for (let i = 0; i < count; i++) {
      const x0 = R() * 1080, y0 = R() * 1920, sp = 10 + R() * 25, ph = R() * 6.28, r = 1.5 + R() * 2.5;
      const x = (x0 + Math.sin(t * 0.5 + ph) * 30 + t * sp) % 1080, y = (y0 - t * sp * 0.6 + 19200) % 1920;
      o += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${col}" opacity="${n(op * (0.4 + 0.6 * Math.abs(Math.sin(t + ph))) * 100) / 100}"/>`;
    }
    return o;
  }
  function rings(cx, cy, t, t0, col, count, maxR, dur) {
    let o = '';
    for (let i = 0; i < count; i++) {
      const k = (t - t0 - i * 0.22) / dur;
      if (k < 0 || k > 1) continue;
      o += `<circle cx="${cx}" cy="${cy}" r="${n(20 + k * maxR)}" fill="none" stroke="${col}" stroke-width="${n(14 * (1 - k) + 2)}" opacity="${(0.7 * (1 - k)).toFixed(2)}"/>`;
    }
    return o;
  }
  function loopRings(cx, cy, t, period, col, maxR) {
    let o = '';
    for (let i = 0; i < 3; i++) {
      const k = (t / period + i / 3) % 1;
      o += `<circle cx="${cx}" cy="${cy}" r="${n(40 + k * maxR)}" fill="none" stroke="${col}" stroke-width="${n(6 * (1 - k) + 1)}" opacity="${(0.4 * (1 - k)).toFixed(2)}"/>`;
    }
    return o;
  }
  function qmark(x, y, k) {
    const s = 0.4 + 0.6 * ease(k) + 0.08 * Math.sin(k * 9);
    return `<g transform="translate(${n(x)} ${n(y)}) scale(${s.toFixed(3)})"><text x="0" y="0" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="96" fill="#e8c46a" stroke="#05060a" stroke-width="10" paint-order="stroke">?</text></g>`;
  }
  const dark = (op, col) => `<rect width="1080" height="1920" fill="${col || '#05070d'}" opacity="${op.toFixed(3)}"/>`;
  const flash = (op, col) => (op > 0 ? dark(op, col || '#fff6e0') : '');

  // ---------------------------------------------------------------- shots
  const SHOTS = [];

  // 0 — hook: a red 04:10 in the dark, heartbeat push-in.
  SHOTS[0] = (t) => {
    const colon = Math.floor(t * 2) % 2 === 0 ? ':' : ' ', clk = '04' + colon + '10', hb = heartbeat(t);
    let g = SCENES.kitchen({ lightning: lightning(t) * 0.6, clock: clk, radioGlow: 0.2, noVig: 1 });
    g += dark(0.88 - 0.08 * hb, '#000') + PROPS.clock(170, 1115, clk);
    const z = (1.05 + 1.35 * ease(prog(t, 0, S[1] + 0.3))) * (1 + 0.025 * hb);
    return cam(g, 320, 1178, z);
  };

  // 1 — the radio; her fist with two wristbands.
  SHOTS[1] = (t) => {
    const k = ease(prog(t, S[1], S[2])), lt = lightning(t + 3), ts = W(1, 'seat');
    let g = SCENES.kitchen({ lightning: 0.3 + lt * 0.9, clock: '04:12', radioGlow: 0.55 + 0.45 * Math.abs(Math.sin(t * 11) * Math.sin(t * 3.1)), noVig: 1 });
    g += loopRings(870, 1070, t, 0.9, PAL.sodium, 260);
    const sq = Math.sin(Math.PI * prog(t, ts, ts + 0.5));
    g += `<g transform="translate(330 1330) rotate(${n(-14 - 6 * sq)}) scale(${(1 + 0.05 * sq).toFixed(3)})">
      <path d="M-700 520L-40 40" stroke="#2e4a50" stroke-width="150" stroke-linecap="round"/>
      ${PROPS.wristband(-10, -80, '0417', -18)}${PROPS.wristband(0, -14, '0418', -4)}
      <ellipse cx="10" cy="0" rx="78" ry="64" fill="#d9b49b"/>
      <path d="M-30 -40q40 -20 80 0M-34 -8q44 -16 88 2M-30 24q40 -12 80 4" stroke="#b8927a" stroke-width="6" fill="none"/></g>`;
    if (lt > 0) g += dark(lt * 0.08, '#c9c0f0');
    return cam(g, 600 + 40 * k, 1120, 1.12 + 0.16 * k);
  };

  // 2 — walking the stuffy street: wristbands, crowbar, Tyoma.
  SHOTS[2] = (t) => {
    const a = S[2], k = prog(t, a, S[3]), x = lerp(260, 640, k), ph = (t - a) * 7.5;
    const tc = W(2, 'crowbar'), tq = W(2, 'questions');
    let g = SCENES.street({ flicker: flick(t, 1), noVig: 1, noCar: 1 }) + motes(t, 3, 40, '#f0c890', 0.3);
    const kp = Object.assign(walk(ph), { pocket: true, expr: 'determined' });
    if (t > tc && t < tc + 1.3) Object.assign(kp, { bSh: -24, bEl: 6 });
    const tp = Object.assign(walk(ph + 0.6, 0.9), { fSh: 62, fEl: -10, expr: t > W(2, 'tyoma') ? 'curious' : 'neutral', head: t > W(2, 'tyoma') ? -14 : 0 });
    g += person(CHAR.ksyusha, kp, x, 1450 + bob(ph), 1.3);
    g += person(CHAR.tyoma, tp, x - 125, 1462 + bob(ph + 0.6), 1.3);
    if (t > tq) g += qmark(x - 115, 1110, prog(t, tq, tq + 0.3));
    return cam(g, x - 40, 1150, 1.25);
  };

  // 3 — the bridge, they stand on it; snap zoom on "they".
  SHOTS[3] = (t) => {
    const a = S[3], tw = W(3, 'they');
    let g = SCENES.bridge({ flicker: flick(t, 2), turn: 0, noVig: 1 }) + motes(t, 5, 30, '#9fb3d6', 0.22);
    const zk = ease(prog(t, tw, tw + 0.35));
    const z = t < tw ? 1.0 + 0.2 * ease(prog(t, a, tw)) : 1.2 + 0.7 * zk;
    return cam(g, 540, lerp(960, 905, zk), z, shake(t, tw, 0.3, 6));
  };

  // 4 — behind a car: "Why are they just standing there?" — "They're listening".
  SHOTS[4] = (t) => {
    const tq = W(4, "they're"), hush = ease(prog(t, tq - 0.45, tq - 0.1));
    let g = `<g transform="translate(0 -300)" filter="url(#blur5)">${SCENES.bridge({ flicker: flick(t, 2), noVig: 1 })}</g>` + dark(0.45);
    const kp = { expr: t > tq - 0.3 ? 'whisper' : 'determined', crouch: 40, head: 4, fSh: lerp(10, 100, hush), fEl: lerp(20, 165, hush), bSh: -10, bEl: 20 };
    const tp = { expr: t < tq - 0.3 ? 'curious' : 'scared', crouch: 10, head: t < tq - 0.3 ? -12 + Math.sin(t * 3) * 3 : 0, fSh: 30, fEl: 30, facing: -1 };
    g += person(CHAR.ksyusha, kp, 380, 1560, 2.0) + person(CHAR.tyoma, tp, 700, 1560, 2.0);
    if (hush > 0.98) {
      const hp = handPos(CHAR.ksyusha, kp, 380, 1560, 2.0, 'F');
      g += `<path d="M${n(hp.x)} ${n(hp.y)}l2 -34" stroke="${CHAR.ksyusha.skin}" stroke-width="12" stroke-linecap="round"/>`;
    }
    g += car(540, 1830, 2.0, '#1d222b');
    return cam(g, 540, 960, 1.0 + 0.06 * prog(t, S[4], S[5]));
  };

  // 5 — the courtyards she has known since she was five.
  SHOTS[5] = (t) => {
    const a = S[5], k = prog(t, a, S[6]), ph = (t - a) * 7;
    let g = SCENES.courtyard({ sway: Math.sin(t * 1.3), noVig: 1 });
    if (t % 3.1 < 0.14) g += `<rect x="240" y="1312" width="34" height="12" fill="#07090d"/>`;
    const x = lerp(170, 500, k), y = lerp(1600, 1530, k), sc = lerp(1.0, 0.8, k);
    g += person(CHAR.ksyusha, Object.assign(walk(ph), { pocket: true, expr: 'determined' }), x, y + bob(ph) * sc, sc);
    g += person(CHAR.tyoma, Object.assign(walk(ph + 0.6, 0.9), { fSh: 62, fEl: -10, expr: 'curious' }), x - 100 * sc, y + 12 * sc + bob(ph + 0.6) * sc, sc);
    g += motes(t, 8, 25, '#f0c890', 0.25);
    return cam(g, lerp(420, 560, ease(k)), 1180, lerp(1.3, 1.4, ease(k)));
  };

  // 6 — the boarded passage; the crowbar; the crash the whole street hears.
  SHOTS[6] = (t) => {
    const a = S[6], tc = W(6, 'crash'), after = t >= tc;
    let g = SCENES.passage({ boardOff: after ? 1 : 0, noVig: 1 });
    const pull = after ? 0 : Math.sin((t - a) * 9) * 0.5 + 0.5;
    const kx = after ? 160 - 50 * ease(prog(t, tc, tc + 0.3)) : 160;
    const kp = after
      ? { fSh: 40, fEl: 50, bSh: 20, bEl: 40, lean: -14, crouch: 10, holdF: 'crowbar', expr: 'scared', fHip: 14, bHip: -18 }
      : { fSh: 78, fEl: 8, bSh: 70, bEl: 18, lean: -6 - 7 * pull, crouch: 12, expr: 'pain', fHip: 12, bHip: -16 };
    g += person(CHAR.ksyusha, kp, kx, 1690, 1.7);
    if (!after) {
      const hp = handPos(CHAR.ksyusha, kp, kx, 1690, 1.7, 'F');
      g += crowbar(hp.x, hp.y, 196 + 3 * pull, 210);
    } else {
      const k = prog(t, tc, tc + 0.7);
      if (k < 1) g += `<g transform="translate(${n(540 + k * 700)} ${n(1170 + k * k * 900)}) rotate(${n(9 + k * 160)})"><rect x="-290" y="-26" width="580" height="52" rx="4" fill="#6b5640"/></g>`;
      g += rings(540, 1170, t, tc, PAL.sodium, 4, 1500, 1.6);
    }
    g += person(CHAR.tyoma, { facing: -1, expr: 'scared', fSh: 150, fEl: 60, bSh: 150, bEl: 60 }, 900, 1700, 1.6);
    g += flash(after ? Math.max(0, 1 - (t - tc) / 0.12) * 0.7 : 0);
    return cam(g, 520, 1150, 1.08 + 0.1 * prog(t, a, S[7]), shake(t, tc, 0.7, 34));
  };

  // 7 — the nail in her palm; then the whole bridge turns at once.
  SHOTS[7] = (t) => {
    const a = S[7], tb = W(7, 'behind'), tt = W(7, 'turned');
    if (t < tb - 0.1) {
      let g = `<g filter="url(#blur5)">${SCENES.passage({ boardOff: 1, noVig: 1 })}</g>` + dark(0.55);
      g += `<circle cx="560" cy="700" r="520" fill="url(#glowS)" opacity=".35"/>`;
      g += `<g transform="translate(230 330) scale(3.9) rotate(${n(-4 + Math.sin(t * 20) * 0.6)} 80 100)">${PROPS.palm(0, 0)}
        <ellipse cx="90" cy="76" rx="${n(10 + 22 * prog(t, a, a + 1.5))}" ry="${n(5 + 8 * prog(t, a, a + 1.5))}" fill="${PAL.blood}" opacity=".85"/></g>`;
      for (let i = 0; i < 6; i++) {
        const d = t - (a + 0.35 + i * 0.42);
        if (d < 0 || d > 1.2) continue;
        g += `<ellipse cx="${n(590 + ((i * 37) % 70) - 35)}" cy="${n(680 + d * d * 1400)}" rx="9" ry="${n(12 + d * 14)}" fill="${PAL.blood}"/>`;
      }
      return cam(g, 540, 960, 1.0 + 0.08 * prog(t, a, tb), shake(t, a, 1.0, 7));
    }
    const turned = t >= tt;
    let g = SCENES.bridge({ flicker: flick(t, 2), turn: turned ? 1 : 0, noVig: 1 });
    if (turned) g += flash(Math.max(0, 1 - (t - tt) / 0.2) * 0.25, PAL.infEye);
    const z = turned ? 1.25 + 0.45 * ease(prog(t, tt, tt + 0.25)) : 1.25;
    return cam(g, 540, 930, z, shake(t, tt, 0.25, 8));
  };

  // Standoff on the street at 05:30 — shared by shots 8–10.
  function standoff(t, o) {
    o = Object.assign({ kx: 330, lit: true, stX: 760 }, o);
    const kp = o.kp || { holdF: 'crowbar', fSh: 20, fEl: 40, bSh: -20, bEl: 20, expr: 'scared', lean: -4 };
    const tp = o.tp || { fSh: 70, fEl: -5, expr: 'scared', head: -6 };
    const stP = Object.assign({ facing: -1, fSh: 80, fEl: 4, bSh: 66, bEl: 28, holdF: 'rifle', rifleA: 12, expr: 'stern' }, o.stP || {});
    const tlP = Object.assign({ facing: -1, bSh: 62, bEl: 12, holdB: 'flashlight', flashA: 8, beam: o.lit ? 520 : 0, fSh: 10, fEl: 105, expr: 'stern' }, o.tlP || {});
    let g = SCENES.street({ flicker: flick(t, 3) * 0.6, noVig: 1, noCar: 1 }) + dark(0.22);
    g += person(o.lit ? CHAR.tall : silhouette(CHAR.tall, '#0a0d15'), tlP, 930, 1450, 1.3);
    g += person(o.lit ? CHAR.stocky : silhouette(CHAR.stocky, '#0a0d15'), stP, o.stX, 1450, 1.3);
    g += person(CHAR.tyoma, tp, o.kx - 110, 1458, 1.3) + person(CHAR.ksyusha, kp, o.kx, 1450, 1.3);
    if (o.lit) g += `<circle cx="${o.kx - 40}" cy="1200" r="300" fill="url(#glowW)" opacity=".22"/>`;
    return { g, stP, tlP };
  }

  // 8 — they run straight into two men with rifles.
  SHOTS[8] = (t) => {
    const a = S[8], ts = W(8, 'straight'), tw = W(8, 'wristband'), tk = W(8, "kid's");
    const rk = prog(t, a, ts + 0.3), kx = lerp(-120, 330, 1 - Math.pow(1 - rk, 2)), ph = (t - a) * 12, moving = t < ts + 0.3;
    const o = { kx, lit: t >= ts, stP: { rifleA: lerp(-2, 12, ease(prog(t, tk, tk + 0.4))) } };
    if (moving) {
      o.kp = Object.assign(run(ph), { holdF: 'crowbar', expr: 'scared' });
      o.tp = Object.assign(run(ph + 0.8), { expr: 'scared' });
    }
    let g = standoff(t, o).g;
    g += flash(t >= ts ? Math.max(0, 1 - (t - ts) / 0.15) * 0.3 : 0, '#fffbe8');
    const zk = ease(prog(t, tw, tw + 0.6));
    return cam(g, lerp(540, 700, zk), lerp(1085, 1000, zk), lerp(1.15, 1.45, zk));
  };

  // 9 — "Mister, why are you hiding your hand?"
  SHOTS[9] = (t) => {
    const tm = W(9, 'mister'), th = W(9, 'hiding');
    const point = ease(prog(t, th - 0.3, th));
    const tp = { fSh: lerp(70, 95, point), fEl: lerp(-5, -8, point), expr: 'curious', head: -14 + Math.sin(t * 2) * 2 };
    const g = standoff(t, { tp }).g;
    const k = ease(prog(t, tm, th + 0.5));
    return cam(g, lerp(235, 809, k), lerp(1190, 1126, k), lerp(2.2, 2.5, k));
  };

  // 10 — the bite; the partner fires; the infected flood past their doorway.
  SHOTS[10] = (t) => {
    const a = S[10], th = W(10, 'his'), tst = W(10, 'stepped'), tf = W(10, 'fired'), tg = W(10, 'gunshot');
    if (t < th - 0.1) {
      const rv = ease(prog(t, a + 0.1, a + 0.7)), j = Math.sin(t * 13) * 8;
      let g = `<rect width="1080" height="1920" fill="#07090f"/><circle cx="${n(540 + j)}" cy="980" r="560" fill="url(#glowW)" opacity=".38"/>`;
      g += `<g transform="translate(70 780) scale(2.75)">${PROPS.bite(0, 0)}<rect x="${n(40 + rv * 170)}" y="22" width="150" height="126" rx="20" fill="#3e4534"/><path d="M${n(40 + rv * 170)} 22v126" stroke="#2c3126" stroke-width="8"/></g>`;
      return cam(g, 540, 960, 1.0 + 0.1 * prog(t, a, th));
    }
    if (t < tg - 0.2) {
      const step = ease(prog(t, tst, tst + 0.4)), fired = t >= tf, fall = ease(prog(t, tf, tf + 0.45));
      const o = {
        stX: lerp(760, 690, step),
        stP: step > 0.5 ? { facing: 1, fSh: 80, fEl: 4, bSh: 66, bEl: 28, rifleA: -3 } : { rifleA: 12 },
        tlP: { lean: -55 * fall, crouch: 60 * fall, expr: fired ? 'shout' : 'scared' },
        kp: { holdF: 'crowbar', fSh: 20, fEl: 40, bSh: 40, bEl: 30, expr: 'scared', lean: -8 },
      };
      const so = standoff(t, o);
      let g = so.g;
      if (fired && t < tf + 0.12) {
        const hp = handPos(CHAR.stocky, so.stP, o.stX, 1450, 1.3, 'F'), r = so.stP.rifleA * Math.PI / 180;
        const mx = hp.x + so.stP.facing * 1.3 * (164 * Math.cos(r) + 5 * Math.sin(r)), my = hp.y + 1.3 * (164 * Math.sin(r) - 5 * Math.cos(r));
        g += `<circle cx="${n(mx)}" cy="${n(my)}" r="140" fill="url(#glowS)"/><polygon points="${n(mx)},${n(my - 30)} ${n(mx + 70)},${n(my)} ${n(mx)},${n(my + 30)} ${n(mx + 14)},${n(my)}" fill="#fff3c4"/>`;
      }
      g += flash(fired ? Math.max(0, 1 - (t - tf) / 0.1) * 0.85 : 0);
      return cam(g, 700, 1000, 1.3, shake(t, tf, 0.5, 28));
    }
    // doorway: the gunshot pulls the whole bridge past them
    let g = `<rect width="1080" height="1920" fill="url(#brick)"/>` + dark(0.45, '#000');
    g += `<rect x="300" y="640" width="480" height="880" fill="#050608"/><path d="M300 640q240-140 480 0" fill="#050608"/>`;
    g += person(CHAR.ksyusha, { expr: 'scared', holdF: 'crowbar', fSh: 20, fEl: 50, bSh: -30, bEl: 40, lean: -4 }, 480, 1500, 1.25);
    g += person(CHAR.tyoma, { facing: -1, expr: 'scared', fSh: 70, fEl: 10, head: 4 }, 610, 1505, 1.25);
    g += `<rect x="300" y="570" width="480" height="950" fill="#04050a" opacity=".42"/><rect y="1520" width="1080" height="400" fill="#0d0f14"/>`;
    for (let i = 0; i < 9; i++) {
      const st = tg + 0.1 + i * 0.3, x = -350 + (t - st) * 1500;
      if (x < -350 || x > 1450) continue;
      const k = ['inf1', 'inf2', 'inf3'][i % 3];
      g += person(silhouette(CHAR[k], '#06080d'), Object.assign(run((t - st) * 14 + i), { expr: 'infected', lean: 22, head: -8 }), x, 1960 + (i % 2) * 40, 2.1 + (i % 3) * 0.15);
    }
    return cam(g, 540, 1000, 1.05, shake(t, tg, 2.0, 5));
  };

  function queues(t) {
    let o = '';
    const kinds = ['stocky', 'ksyusha', 'tyoma', 'stocky', 'ksyusha', 'inf2'];
    for (let i = 0; i < 6; i++) {
      o += person(silhouette(CHAR[kinds[i]], '#141925'), { head: Math.sin(t * 1.3 + i) * 4, facing: 1 }, 110 + i * 68, 1480, 0.5);
      o += person(silhouette(CHAR[kinds[5 - i]], '#141925'), { head: Math.sin(t * 1.1 + i) * 4, facing: -1 }, 630 + i * 68, 1480, 0.5);
    }
    return o;
  }

  // 11 — 05:52, the stadium; floodlights; two lines.
  SHOTS[11] = (t) => {
    const a = S[11], tf = W(11, 'floodlights'), ts = W(11, 'sorting');
    let g = SCENES.stadium({ rain: 0, t, noVig: 1 }) + queues(t);
    g += t < tf ? dark(0.6, '#000') : flash(Math.max(0, 1 - (t - tf) / 0.25) * 0.35, '#eef4ff');
    const k = ease(prog(t, a, ts)), zk = ease(prog(t, ts, ts + 0.5));
    return cam(g, 540, lerp(lerp(700, 1150, k), 1200, zk), lerp(lerp(1.5, 1.12, k), 1.35, zk));
  };

  // 12 — the guard's flashlight on her palm: "To the left." Their hands come apart.
  SHOTS[12] = (t) => {
    const tp = W(12, 'palm'), tl = W(12, 'left'), sep = ease(prog(t, tl + 0.15, tl + 0.9));
    let g = `<g filter="url(#blur5)">${SCENES.stadium({ rain: 0, t, noVig: 1 })}</g>` + dark(0.35);
    const kx = lerp(330, 190, sep), tx = lerp(560, 780, sep), gx = 880;
    const kp = { expr: 'numb', fSh: 82, fEl: -6, bSh: -8, bEl: 14 };
    const tyP = { facing: -1, expr: 'scared', fSh: lerp(62, 92, sep), fEl: -6, head: -4 };
    const gp = { facing: -1, fSh: 66, fEl: 10, holdF: 'flashlight', bSh: t > tl ? 92 : 10, bEl: t > tl ? 0 : 10 };
    const gh = handPos(CHAR.guard, gp, gx, 1500, 1.6, 'F'), kh = handPos(CHAR.ksyusha, kp, kx, 1500, 1.6, 'F');
    gp.flashA = Math.atan2(kh.y - gh.y, (kh.x - gh.x) * -1) * 180 / Math.PI;
    g += person(CHAR.guard, gp, gx, 1500, 1.6) + person(CHAR.ksyusha, kp, kx, 1500, 1.6);
    g += `<polygon points="${n(gh.x)},${n(gh.y - 10)} ${n(gh.x)},${n(gh.y + 10)} ${n(kh.x)},${n(kh.y + 70)} ${n(kh.x)},${n(kh.y - 70)}" fill="#fffbe8" opacity=".16"/>`;
    g += `<circle cx="${n(kh.x)}" cy="${n(kh.y)}" r="90" fill="url(#glowW)"/><path d="M${n(kh.x - 14)} ${n(kh.y - 4)}l26 8" stroke="${PAL.blood}" stroke-width="6" stroke-linecap="round"/>`;
    g += person(CHAR.tyoma, tyP, tx, 1508, 1.6);
    const zp = ease(prog(t, tp - 0.4, tp + 0.3)), zo = ease(prog(t, tl + 0.1, tl + 0.7));
    return cam(g, lerp(lerp(560, kh.x, zp), 480, zo), lerp(lerp(1150, kh.y, zp), 1150, zo), lerp(lerp(1.15, 1.7, zp), 1.25, zo));
  };

  // 13 — a voice from the dark stands; Tyoma turns.
  SHOTS[13] = (t) => {
    const a = S[13], tb = W(13, 'brother');
    if (t < tb + 0.25) {
      const k = ease(prog(t, a, tb + 0.25));
      let g = SCENES.stadium({ rain: 0, t, noVig: 1 }) + dark(0.6, '#000');
      g += `<ellipse cx="610" cy="700" rx="120" ry="150" fill="url(#glowW)" opacity="${(0.3 + 0.1 * Math.sin(t * 2)).toFixed(2)}"/>`;
      g += person(CHAR.stranger, { expr: 'glint', head: -4 }, 610, 800, 0.5);
      return cam(g, lerp(560, 610, k), lerp(720, 700, k), lerp(1.9, 2.6, k));
    }
    const k = ease(prog(t, tb + 0.5, tb + 0.9)), sx = Math.cos(Math.PI * k), hb = heartbeat(t);
    let g = `<g filter="url(#blur5)">${SCENES.stadium({ rain: 0, t, noVig: 1 })}</g>` + dark(0.5);
    g += `<g transform="translate(540 0) scale(${sx.toFixed(3)} 1) translate(-540 0)">${person(CHAR.tyoma, { expr: 'scared', head: -6 }, 540, 1950, 6)}</g>`;
    return cam(g, 540, 960, 1.0 + 0.03 * hb + 0.06 * prog(t, tb, RUN));
  };

  function finale(t) {
    const k = prog(t, RUN, RUN + 0.15);
    let g = `<rect width="1080" height="1920" fill="#000"/>`;
    const s = 1.4 - 0.4 * ease(k), op = t < RUN + 1.0 ? 1 : 1 - 0.6 * prog(t, RUN + 1.0, RUN + 1.4);
    g += `<g transform="translate(540 880) scale(${s.toFixed(3)})" opacity="${op.toFixed(2)}"><text x="0" y="0" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="220" fill="#ff3b30" filter="url(#ledGlow)">RUN</text></g>`;
    if (t > RUN + 1.1) {
      const on = Math.floor(t * 2) % 2 === 0 || t > RUN + 2.4;
      g += `<text x="540" y="1160" text-anchor="middle" font-family="DejaVu Sans Mono" font-weight="bold" font-size="150" fill="#ff3b30" filter="url(#ledGlow)" opacity="${on ? 1 : 0.25}">06:00</text>`;
    }
    if (t > RUN + 1.8) g += `<text x="540" y="1250" text-anchor="middle" font-family="DejaVu Sans" font-size="40" letter-spacing="10" fill="#8c93a3" opacity="${prog(t, RUN + 1.8, RUN + 2.3).toFixed(2)}">EPISODE 1</text>`;
    return g;
  }

  // ---------------------------------------------------------------- subtitles
  const SUBX = 510, SUBY = 1470, MAXW = 840;
  const CH = [];
  WORDS.forEach((w, i) => {
    const prev = WORDS[i - 1];
    if (!CH.length || CH[CH.length - 1].w.length >= 3 || prev.line !== w.line || /[.,?!:]$/.test(prev.raw) || (prev.dlg !== w.dlg)) CH.push({ w: [] });
    CH[CH.length - 1].w.push(w);
  });
  CH.forEach((c, i) => {
    c.s = c.w[0].s - 0.05;
    const last = c.w[c.w.length - 1];
    c.e = i + 1 < CH.length ? Math.min(CH[i + 1].w[0].s - 0.05, last.e + 0.7) : last.e + 0.7;
  });
  const ctx = document.createElement('canvas').getContext('2d');
  const measure = (txt, it, fs) => { ctx.font = `${it ? 'italic ' : ''}bold ${fs}px "DejaVu Sans"`; return ctx.measureText(txt).width; };
  const COL = { d: '#ff4a3d', k: '#f5b14c' };

  function subs(t) {
    if (t >= RUN - 0.05) return '';
    const c = CH.find((c) => t >= c.s && t < c.e);
    if (!c) return '';
    let fs = 86, ws = c.w.map((w) => measure(w.t, w.dlg, fs)), gap = fs * 0.5;
    let tot = ws.reduce((x, y) => x + y, 0) + gap * (ws.length - 1);
    if (tot > MAXW) { const k = MAXW / tot; fs *= k; gap *= k; ws = ws.map((v) => v * k); tot = MAXW; }
    let x = SUBX - tot / 2, o = `<ellipse cx="${SUBX}" cy="${SUBY - fs * 0.35}" rx="${n(tot / 2 + 90)}" ry="${n(fs * 0.95)}" fill="#000" opacity=".38" filter="url(#soft)"/>`;
    c.w.forEach((w, i) => {
      const cx = x + ws[i] / 2;
      x += ws[i] + gap;
      if (t < w.s - 0.02) return;
      const s = 1.08 - 0.08 * ease(prog(t, w.s, w.s + 0.14)), cy = SUBY - fs * 0.35;
      const col = COL[w.key] || (w.dlg ? '#d9e6ff' : '#ffffff');
      o += `<text x="${n(cx)}" y="${SUBY}" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold"${w.dlg ? ' font-style="italic"' : ''} font-size="${n(fs)}" fill="${col}" stroke="#05060a" stroke-width="${n(fs * 0.14)}" stroke-linejoin="round" paint-order="stroke" transform="translate(${n(cx)} ${n(cy)}) scale(${s.toFixed(3)}) translate(${n(-cx)} ${n(-cy)})">${w.t}</text>`;
    });
    return o;
  }

  // ---------------------------------------------------------------- frame
  const HUD = ['', '', '04:25', '04:40', '04:41', '04:52', '05:05', '05:06', '05:30', '05:31', '05:33', '05:52', '05:55', '05:59'];
  const EXTRA = `<defs><filter id="blur5" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="5"/></filter></defs>`;
  const RAIN_FROM = W(7, 'behind');

  function frameSVG(t) {
    let body;
    if (t >= RUN) body = finale(t);
    else {
      let L = 0;
      for (let i = 0; i < NL; i++) if (t >= S[i]) L = i;
      body = SHOTS[L](t);
      if (t >= RAIN_FROM) body += rain(17, 150, t, 0.4 * prog(t, RAIN_FROM, RAIN_FROM + 1.5));
      body += `<rect width="1080" height="1920" fill="url(#vig)"/>`;
      if (HUD[L]) body += `<text x="540" y="240" text-anchor="middle" font-family="DejaVu Sans Mono" font-weight="bold" font-size="56" fill="${PAL.ledRed}" filter="url(#ledGlow)" opacity=".9">${HUD[L]}</text>`;
      if (L > 0) body += dark(1 - prog(t, S[L], S[L] + 0.1), '#000');
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">${defs()}${EXTRA}${body}${subs(t)}</svg>`;
  }

  const out = document.getElementById('out');
  window.DURATION = DUR;
  window.CUES = { S, RUN };
  window.renderFrame = function (t) {
    out.innerHTML = frameSVG(t);
    return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))));
  };
  window.READY = true;
})();
