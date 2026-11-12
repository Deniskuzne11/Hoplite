/* 06:00 — shared art library.
   Characters, props and locations are plain SVG strings built from code, so the same
   pieces drive the sheets (Step 3) and the animation frames (Step 4). */
(function (root) {
  'use strict';
  const n = (v) => Math.round(v * 10) / 10;

  const PAL = {
    ink: '#07090f',
    sodium: '#f0a94b',
    ledRed: '#ff3b30',
    blood: '#9e1f26',
    crowbar: '#b5332b',
    infSkin: '#7f8c6c',
    infEye: '#dfe8b8',
    paper: '#e8e1cf',
    flood: '#e9f1ff',
    clear: '#9fd3a8',
  };

  function shade(hex, a) {
    const v = parseInt(hex.slice(1), 16);
    let r = v >> 16, g = (v >> 8) & 255, b = v & 255;
    const t = a < 0 ? 0 : 255, k = Math.abs(a);
    r = Math.round(r + (t - r) * k); g = Math.round(g + (t - g) * k); b = Math.round(b + (t - b) * k);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  function rng(seed) {
    let s = seed | 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------------------------------------------------------------- body parts
  // Angles in degrees: 0 = straight down, positive = towards the facing direction.
  function limb(x, y, a1, l1, a2, l2) {
    const r = Math.PI / 180;
    const x1 = x + Math.sin(a1 * r) * l1, y1 = y + Math.cos(a1 * r) * l1;
    const x2 = x1 + Math.sin((a1 + a2) * r) * l2, y2 = y1 + Math.cos((a1 + a2) * r) * l2;
    return { x, y, x1, y1, x2, y2, dir: a1 + a2 };
  }

  function line(L, w, c, t) {
    if (t != null) {
      return `<path d="M${n(L.x)} ${n(L.y)}L${n(L.x + (L.x1 - L.x) * t)} ${n(L.y + (L.y1 - L.y) * t)}" stroke="${c}" stroke-width="${n(w)}" stroke-linecap="round" fill="none"/>`;
    }
    return `<path d="M${n(L.x)} ${n(L.y)}L${n(L.x1)} ${n(L.y1)}L${n(L.x2)} ${n(L.y2)}" stroke="${c}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  }

  function face(s, expr) {
    const r = s.headR, k = s.eyeK || 1, ew = r * 0.085 * k, ey = r * 0.04;
    const xs = [-r * 0.08, r * 0.52];
    const ec = s.eyeC || '#15161a';
    const bc = s.browC || shade(s.hairC || '#222222', -0.1);
    const table = {
      neutral: ['dot', [0, 0], 'line'],
      determined: ['narrow', [0.07, -0.03], 'line'],
      scared: ['wide', [-0.11, 0.03], 'o'],
      whisper: ['side', [-0.06, 0], 'o'],
      pain: ['shut', [0.08, -0.02], 'grit'],
      curious: ['dot', [-0.09, -0.02], 'o'],
      numb: ['narrow', [0, 0], 'line'],
      stern: ['narrow', [0.09, -0.04], 'down'],
      shout: ['wide', [-0.12, 0.02], 'open'],
      fever: ['narrow', [-0.07, 0.04], 'o'],
      tired: ['narrow', [-0.05, 0.03], 'down'],
      relieved: ['shut', [-0.06, 0.02], 'line'],
      infected: ['glow', null, 'slack'],
      glint: ['glint', null, null],
    };
    const [mode, brow, mouth] = table[expr] || table.neutral;
    const o = [];
    xs.forEach((x, i) => {
      switch (mode) {
        case 'wide':
          o.push(`<ellipse cx="${n(x)}" cy="${n(ey)}" rx="${n(ew * 1.55)}" ry="${n(ew * 1.75)}" fill="#ece8df"/><circle cx="${n(x + ew * 0.2)}" cy="${n(ey)}" r="${n(ew * 0.72)}" fill="${ec}"/>`);
          break;
        case 'narrow':
          o.push(`<ellipse cx="${n(x)}" cy="${n(ey)}" rx="${n(ew * 1.05)}" ry="${n(ew * 0.62)}" fill="${ec}"/>`);
          break;
        case 'shut':
          o.push(`<path d="M${n(x - ew * 1.2)} ${n(ey)}Q${n(x)} ${n(ey + ew * 0.9)} ${n(x + ew * 1.2)} ${n(ey)}" stroke="${ec}" stroke-width="${n(r * 0.06)}" fill="none" stroke-linecap="round"/>`);
          break;
        case 'glow':
          o.push(`<circle cx="${n(x)}" cy="${n(ey)}" r="${n(ew * 2.6)}" fill="${PAL.infEye}" opacity=".16"/><ellipse cx="${n(x)}" cy="${n(ey)}" rx="${n(ew * 1.1)}" ry="${n(ew * 1.25)}" fill="${PAL.infEye}"/>`);
          break;
        case 'glint':
          o.push(`<circle cx="${n(x)}" cy="${n(ey)}" r="${n(ew * 0.65)}" fill="#cfd6e6" opacity=".9"/>`);
          break;
        default: {
          const dx = mode === 'side' ? -ew * 0.55 : 0;
          o.push(`<ellipse cx="${n(x + dx)}" cy="${n(ey)}" rx="${n(ew)}" ry="${n(ew * 1.3)}" fill="${ec}"/><circle cx="${n(x + dx + ew * 0.35)}" cy="${n(ey - ew * 0.45)}" r="${n(ew * 0.38)}" fill="#fff" opacity=".85"/>`);
        }
      }
      if (brow) {
        const inner = i === 0 ? 1 : -1, bw = r * 0.17;
        let by = ey - r * 0.3 - (mode === 'wide' ? ew * 0.6 : 0);
        if (expr === 'curious' && i === 1) by -= r * 0.08;
        o.push(`<path d="M${n(x - inner * bw)} ${n(by + brow[1] * r)}L${n(x + inner * bw * 0.9)} ${n(by + brow[0] * r)}" stroke="${bc}" stroke-width="${n(r * 0.075)}" stroke-linecap="round"/>`);
      }
    });
    if (mode !== 'glint') {
      o.push(`<path d="M${n(r * 0.8)} ${n(-r * 0.02)}Q${n(r * 0.93)} ${n(r * 0.2)} ${n(r * 0.78)} ${n(r * 0.25)}" stroke="${shade(s.skin, -0.22)}" stroke-width="${n(r * 0.05)}" fill="none" stroke-linecap="round"/>`);
    }
    if (s.blush) o.push(`<ellipse cx="${n(r * 0.72)}" cy="${n(r * 0.36)}" rx="${n(r * 0.14)}" ry="${n(r * 0.08)}" fill="#d9776b" opacity=".3"/>`);
    if (s.tired && mode !== 'glow') xs.forEach((x) => o.push(`<path d="M${n(x - ew * 1.4)} ${n(ey + ew * 1.7)}q${n(ew * 1.4)} ${n(ew * 1.1)} ${n(ew * 2.8)} 0" stroke="${shade(s.skin, -0.32)}" stroke-width="${n(r * 0.04)}" fill="none" stroke-linecap="round"/>`));
    if (s.sweat) {
      [[r * 0.62, -r * 0.42, 1], [r * 0.12, -r * 0.5, 0.8], [r * 0.86, r * 0.02, 0.7]].forEach(([x, y, k]) => o.push(`<path d="M${n(x)} ${n(y - r * 0.1 * k)}q${n(r * 0.07 * k)} ${n(r * 0.11 * k)} 0 ${n(r * 0.16 * k)}q${n(-r * 0.07 * k)} ${n(-r * 0.05 * k)} 0 ${n(-r * 0.16 * k)}z" fill="#cfe3f0" opacity=".85"/>`));
      o.push(`<ellipse cx="${n(r * 0.66)}" cy="${n(r * 0.3)}" rx="${n(r * 0.16)}" ry="${n(r * 0.09)}" fill="#d9776b" opacity=".35"/>`);
    }
    const mx = r * 0.3, my = r * 0.5, mc = shade(s.skin, -0.5);
    switch (mouth) {
      case 'line': o.push(`<path d="M${n(mx - r * 0.13)} ${n(my)}L${n(mx + r * 0.13)} ${n(my)}" stroke="${mc}" stroke-width="${n(r * 0.055)}" stroke-linecap="round"/>`); break;
      case 'down': o.push(`<path d="M${n(mx - r * 0.14)} ${n(my + r * 0.03)}Q${n(mx)} ${n(my - r * 0.06)} ${n(mx + r * 0.14)} ${n(my + r * 0.03)}" stroke="${mc}" stroke-width="${n(r * 0.055)}" fill="none" stroke-linecap="round"/>`); break;
      case 'o': o.push(`<ellipse cx="${n(mx)}" cy="${n(my)}" rx="${n(r * 0.065)}" ry="${n(r * 0.085)}" fill="#3b1c1c"/>`); break;
      case 'open': o.push(`<ellipse cx="${n(mx)}" cy="${n(my)}" rx="${n(r * 0.12)}" ry="${n(r * 0.16)}" fill="#2a1212"/>`); break;
      case 'grit': o.push(`<rect x="${n(mx - r * 0.15)}" y="${n(my - r * 0.05)}" width="${n(r * 0.3)}" height="${n(r * 0.1)}" rx="${n(r * 0.03)}" fill="#e9e2d6" stroke="#3b1c1c" stroke-width="${n(r * 0.03)}"/>`); break;
      case 'slack': o.push(`<ellipse cx="${n(mx)}" cy="${n(my + r * 0.05)}" rx="${n(r * 0.13)}" ry="${n(r * 0.2)}" fill="#160d0e"/>`); break;
      default: break;
    }
    return o.join('');
  }

  // Head centred at (0,0), facing +x.
  function head(s, expr) {
    const r = s.headR, hc = s.hairC, sk = s.skin, o = [];
    const ear = `<ellipse cx="${n(-r * 0.32)}" cy="${n(r * 0.14)}" rx="${n(r * 0.14)}" ry="${n(r * 0.2)}" fill="${shade(sk, -0.12)}"/>`;
    if (s.hair === 'ksyusha') {
      o.push(`<ellipse cx="${n(-r * 1.02)}" cy="${n(r * 0.45)}" rx="${n(r * 0.28)}" ry="${n(r * 0.72)}" fill="${hc}" transform="rotate(16 ${n(-r * 1.02)} ${n(r * 0.45)})"/>`);
      o.push(`<circle cx="${n(-r * 0.06)}" cy="${n(-r * 0.06)}" r="${n(r * 1.08)}" fill="${hc}"/>`);
    } else if (s.hair === 'boy' || s.hair === 'short') {
      o.push(`<circle cx="${n(-r * 0.08)}" cy="${n(-r * 0.12)}" r="${n(r)}" fill="${hc}"/>`);
    } else if (s.hair === 'hazmat' || s.hair === 'hood') {
      o.push(`<circle cx="${n(-r * 0.05)}" cy="${n(-r * 0.02)}" r="${n(r * 1.3)}" fill="${s.hoodC || s.top}"/>`);
    }
    if (s.hair !== 'hazmat') {
      o.push(`<ellipse cx="${n(r * 0.1)}" cy="${n(r * 0.1)}" rx="${n(r * 0.9)}" ry="${n(r * 0.92)}" fill="${sk}"/>`);
    }
    if (s.stubble) {
      o.push(`<path d="M${n(-r * 0.2)} ${n(r * 0.35)}Q${n(r * 0.3)} ${n(r * 1.12)} ${n(r * 0.98)} ${n(r * 0.35)}Q${n(r * 0.9)} ${n(r * 0.8)} ${n(r * 0.4)} ${n(r * 1.0)}Q${n(-r * 0.05)} ${n(r * 0.95)} ${n(-r * 0.2)} ${n(r * 0.35)}Z" fill="#000" opacity=".2"/>`);
    }
    switch (s.hair) {
      case 'ksyusha':
        o.push(`<path d="M${n(-r * 0.55)} ${n(-r * 0.55)}Q${n(r * 0.1)} ${n(-r * 0.18)} ${n(r * 0.98)} ${n(-r * 0.16)}Q${n(r * 0.88)} ${n(-r * 0.95)} ${n(0)} ${n(-r * 1.04)}Q${n(-r * 0.5)} ${n(-r * 0.98)} ${n(-r * 0.55)} ${n(-r * 0.55)}Z" fill="${hc}"/>`);
        o.push(`<path d="M${n(-r * 0.9)} ${n(-r * 0.4)}Q${n(-r * 0.42)} ${n(r * 0.1)} ${n(-r * 0.58)} ${n(r * 0.82)}L${n(-r * 0.98)} ${n(r * 0.62)}Z" fill="${hc}"/>`);
        o.push(`<path d="M${n(-r * 0.2)} ${n(-r * 0.92)}Q${n(r * 0.35)} ${n(-r * 0.7)} ${n(r * 0.7)} ${n(-r * 0.32)}" stroke="#fff" stroke-opacity=".08" stroke-width="${n(r * 0.08)}" fill="none"/>`);
        break;
      case 'boy':
        o.push(ear);
        o.push(`<path d="M${n(-r * 0.5)} ${n(-r * 0.6)}Q${n(r * 0.2)} ${n(-r * 0.32)} ${n(r * 0.95)} ${n(-r * 0.34)}Q${n(r * 0.8)} ${n(-r * 1.0)} ${n(0)} ${n(-r * 1.04)}Q${n(-r * 0.5)} ${n(-r * 0.92)} ${n(-r * 0.5)} ${n(-r * 0.6)}Z" fill="${hc}"/>`);
        o.push(`<path d="M${n(-r * 0.15)} ${n(-r * 1.0)}Q${n(-r * 0.05)} ${n(-r * 1.4)} ${n(r * 0.25)} ${n(-r * 1.3)}" stroke="${hc}" stroke-width="${n(r * 0.12)}" fill="none" stroke-linecap="round"/>`);
        break;
      case 'short':
        o.push(ear);
        o.push(`<path d="M${n(-r * 0.6)} ${n(-r * 0.5)}Q${n(r * 0.2)} ${n(-r * 0.58)} ${n(r * 0.85)} ${n(-r * 0.45)}Q${n(r * 0.7)} ${n(-r * 1.0)} ${n(0)} ${n(-r * 1.04)}Q${n(-r * 0.55)} ${n(-r * 0.95)} ${n(-r * 0.6)} ${n(-r * 0.5)}Z" fill="${hc}"/>`);
        break;
      case 'cap':
        o.push(ear);
        o.push(`<path d="M${n(-r * 0.97)} ${n(-r * 0.12)}Q${n(-r * 0.92)} ${n(-r * 1.18)} ${n(r * 0.1)} ${n(-r * 1.12)}Q${n(r * 0.97)} ${n(-r * 1.02)} ${n(r * 0.99)} ${n(-r * 0.22)}Z" fill="${s.capC}"/>`);
        o.push(`<path d="M${n(r * 0.45)} ${n(-r * 0.3)}L${n(r * 1.5)} ${n(-r * 0.16)}Q${n(r * 1.45)} ${n(-r * 0.02)} ${n(r * 0.55)} ${n(-r * 0.06)}Z" fill="${shade(s.capC, -0.25)}"/>`);
        break;
      case 'patchy':
        o.push(ear);
        o.push(`<path d="M${n(-r * 0.6)} ${n(-r * 0.6)}Q${n(-r * 0.2)} ${n(-r * 1.15)} ${n(r * 0.3)} ${n(-r * 0.92)}M${n(-r * 0.75)} ${n(-r * 0.3)}Q${n(-r * 0.6)} ${n(-r * 0.9)} ${n(-r * 0.2)} ${n(-r * 0.95)}" stroke="${hc}" stroke-width="${n(r * 0.14)}" fill="none" stroke-linecap="round"/>`);
        o.push(`<ellipse cx="${n(r * 0.45)}" cy="${n(-r * 0.45)}" rx="${n(r * 0.18)}" ry="${n(r * 0.12)}" fill="#3f4636" opacity=".7"/>`);
        break;
      case 'hazmat':
        o.push(`<rect x="${n(-r * 0.2)}" y="${n(-r * 0.58)}" width="${n(r * 1.25)}" height="${n(r * 0.86)}" rx="${n(r * 0.25)}" fill="#1f2d36"/>`);
        o.push(`<path d="M${n(0)} ${n(-r * 0.5)}L${n(r * 0.35)} ${n(-r * 0.5)}L${n(r * 0.05)} ${n(r * 0.2)}L${n(-r * 0.1)} ${n(r * 0.2)}Z" fill="#fff" opacity=".13"/>`);
        o.push(`<circle cx="${n(r * 0.72)}" cy="${n(r * 0.6)}" r="${n(r * 0.32)}" fill="#2b2f33"/><circle cx="${n(r * 0.8)}" cy="${n(r * 0.66)}" r="${n(r * 0.16)}" fill="#454b51"/>`);
        return o.join('');
      case 'hood':
        break;
      default:
        break;
    }
    o.push(face(s, s.forceExpr || expr));
    return o.join('');
  }

  function torso(s, hipY, shY, facing) {
    const hw = s.hipW / 2, sw = s.shW / 2, c = s.top, dk = shade(c, -0.25), o = [];
    o.push(`<polygon points="${n(-hw)},${n(hipY + 4)} ${n(hw)},${n(hipY + 4)} ${n(sw)},${n(shY + 6)} ${n(-sw)},${n(shY + 6)}" fill="${c}" stroke="${c}" stroke-width="16" stroke-linejoin="round"/>`);
    const T = s.torso;
    switch (s.topStyle) {
      case 'hoodie':
        o.push(`<rect x="${n(-hw - 6)}" y="${n(hipY - 6)}" width="${n(hw * 2 + 12)}" height="12" rx="6" fill="${dk}"/>`);
        o.push(`<path d="M${n(-hw * 0.7)} ${n(hipY - 8)}L${n(hw * 0.75)} ${n(hipY - 8)}L${n(hw * 0.55)} ${n(hipY - T * 0.34)}L${n(-hw * 0.5)} ${n(hipY - T * 0.34)}Z" fill="${dk}"/>`);
        o.push(`<path d="M-4 ${n(shY + 10)}l-2 34M10 ${n(shY + 10)}l2 30" stroke="#cfc8bb" stroke-width="2.5" stroke-linecap="round"/>`);
        break;
      case 'tee':
        o.push(`<g transform="translate(0 ${n(shY + T * 0.62)}) scale(${facing} 1)"><text x="0" y="0" font-family="DejaVu Sans" font-weight="bold" font-size="${n(T * 0.42)}" text-anchor="middle" fill="#2b2a33" opacity=".8">?</text></g>`);
        o.push(`<rect x="${n(-hw - 6)}" y="${n(hipY - 4)}" width="${n(hw * 2 + 12)}" height="8" rx="4" fill="${dk}"/>`);
        break;
      case 'jacket':
        o.push(`<path d="M6 ${n(shY + 12)}L6 ${n(hipY + 6)}" stroke="${dk}" stroke-width="3"/>`);
        o.push(`<path d="M-14 ${n(shY + 2)}L6 ${n(shY + 30)}L22 ${n(shY + 2)}Z" fill="${dk}"/>`);
        o.push(`<rect x="${n(-sw * 0.62)}" y="${n(shY + T * 0.22)}" width="${n(sw * 0.45)}" height="${n(T * 0.17)}" rx="3" fill="${dk}"/><rect x="${n(sw * 0.2)}" y="${n(shY + T * 0.22)}" width="${n(sw * 0.45)}" height="${n(T * 0.17)}" rx="3" fill="${dk}"/>`);
        o.push(`<rect x="${n(-hw - 6)}" y="${n(hipY - 8)}" width="${n(hw * 2 + 12)}" height="10" fill="#1a1c18"/>`);
        break;
      case 'vest':
        o.push(`<polygon points="${n(-hw * 0.95)},${n(hipY - 4)} ${n(hw * 0.95)},${n(hipY - 4)} ${n(sw * 0.8)},${n(shY + 14)} ${n(-sw * 0.8)},${n(shY + 14)}" fill="#1e2228"/>`);
        for (let i = 0; i < 3; i++) o.push(`<rect x="${n(-hw * 0.85 + i * hw * 0.62)}" y="${n(hipY - T * 0.32)}" width="${n(hw * 0.5)}" height="${n(T * 0.2)}" rx="3" fill="#2b3038"/>`);
        o.push(`<rect x="${n(-hw - 6)}" y="${n(hipY - 6)}" width="${n(hw * 2 + 12)}" height="10" fill="#14171b"/>`);
        break;
      case 'torn': {
        const zz = [];
        for (let i = 0; i <= 8; i++) zz.push(`${n(-hw - 6 + i * (hw * 2 + 12) / 8)},${n(hipY + 4 + (i % 2 ? 16 : 0))}`);
        o.push(`<polygon points="${n(-hw - 6)},${n(hipY - 4)} ${n(hw + 6)},${n(hipY - 4)} ${zz.reverse().join(' ')}" fill="${c}"/>`);
        o.push(`<ellipse cx="${n(sw * 0.3)}" cy="${n(shY + T * 0.35)}" rx="${n(sw * 0.3)}" ry="${n(T * 0.12)}" fill="#3a1d1d" opacity=".75"/>`);
        o.push(`<path d="M${n(-sw * 0.5)} ${n(shY + T * 0.5)}l14 22l-20 6z" fill="${shade(c, -0.45)}"/>`);
        break;
      }
      case 'hazmat':
        o.push(`<rect x="${n(-hw - 6)}" y="${n(hipY - 10)}" width="${n(hw * 2 + 12)}" height="12" fill="#5e6772"/>`);
        o.push(`<path d="M2 ${n(shY + 10)}L2 ${n(hipY - 10)}" stroke="#7d8792" stroke-width="4"/>`);
        o.push(`<rect x="${n(sw * 0.15)}" y="${n(shY + T * 0.18)}" width="${n(sw * 0.6)}" height="${n(T * 0.12)}" fill="#c9a43a"/>`);
        break;
      case 'paramedic':
        // reflective bands + a cross patch
        o.push(`<rect x="${n(-sw - 4)}" y="${n(shY + T * 0.5)}" width="${n(sw * 2 + 8)}" height="${n(T * 0.08)}" fill="#c8ccc4"/><rect x="${n(-hw - 6)}" y="${n(shY + T * 0.72)}" width="${n(hw * 2 + 12)}" height="${n(T * 0.08)}" fill="#c8ccc4"/>`);
        o.push(`<rect x="${n(-hw - 6)}" y="${n(shY + T * 0.53)}" width="${n(hw * 2 + 12)}" height="${n(T * 0.02)}" fill="#e8e4c0" opacity=".6"/>`);
        o.push(`<g transform="translate(${n(sw * 0.42)} ${n(shY + T * 0.28)})"><rect x="-13" y="-13" width="26" height="26" rx="4" fill="#e8e1cf"/><path d="M0 -8v16M-8 0h16" stroke="#9e1f26" stroke-width="6"/></g>`);
        o.push(`<path d="M-12 ${n(shY + 4)}L4 ${n(shY + 24)}L20 ${n(shY + 4)}" stroke="${dk}" stroke-width="5" fill="none"/>`);
        o.push(`<rect x="${n(-hw - 6)}" y="${n(hipY - 8)}" width="${n(hw * 2 + 12)}" height="10" fill="#1d232c"/>`);
        break;
      case 'sweater':
        o.push(`<rect x="${n(-hw - 6)}" y="${n(hipY - 12)}" width="${n(hw * 2 + 12)}" height="14" rx="5" fill="${dk}"/>`);
        for (let i = 0; i < 5; i++) o.push(`<path d="M${n(-hw + i * hw * 0.5)} ${n(hipY - 12)}v14" stroke="${shade(c, -0.4)}" stroke-width="2"/>`);
        o.push(`<path d="M-16 ${n(shY + 2)}Q4 ${n(shY + 22)} 22 ${n(shY + 2)}" stroke="${dk}" stroke-width="8" fill="none"/>`);
        o.push(`<ellipse cx="${n(sw * 0.2)}" cy="${n(shY + T * 0.3)}" rx="${n(sw * 0.35)}" ry="${n(T * 0.1)}" fill="#000" opacity=".12"/>`);
        break;
      default:
        break;
    }
    return o.join('');
  }

  // ---------------------------------------------------------------- props
  function crowbar(x, y, d, L) {
    L = L || 150;
    const w = Math.max(6, L * 0.055);
    return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(-d)})">
      <path d="M0 ${n(-L * 0.22)}L0 ${n(L * 0.7)}Q0 ${n(L * 0.86)} ${n(L * 0.12)} ${n(L * 0.84)}L${n(L * 0.15)} ${n(L * 0.77)}" stroke="${PAL.crowbar}" stroke-width="${n(w)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M0 ${n(-L * 0.22)}L${n(-L * 0.05)} ${n(-L * 0.3)}" stroke="#3a3a3e" stroke-width="${n(w * 0.9)}" stroke-linecap="round"/>
      <path d="M${n(L * 0.12)} ${n(L * 0.84)}L${n(L * 0.15)} ${n(L * 0.77)}" stroke="#3a3a3e" stroke-width="${n(w * 0.9)}" stroke-linecap="round"/>
      <path d="M${n(-w * 0.18)} ${n(-L * 0.15)}L${n(-w * 0.18)} ${n(L * 0.65)}" stroke="#fff" stroke-opacity=".2" stroke-width="${n(w * 0.25)}"/>
    </g>`;
  }

  function rifle(x, y, a) {
    return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(a)})">
      <path d="M-78 -2L-22 -9L-22 9L-76 16Z" fill="#2d3239"/>
      <rect x="10" y="5" width="16" height="32" rx="3" fill="#23272d" transform="rotate(12 18 5)"/>
      <rect x="-24" y="-12" width="86" height="19" rx="3" fill="#2a2f36"/>
      <rect x="60" y="-8" width="104" height="6" fill="#262a30"/>
      <rect x="150" y="-12" width="5" height="9" fill="#262a30"/>
      <rect x="-24" y="-12" width="86" height="3" fill="#525b67"/>
      <rect x="60" y="-8" width="104" height="2" fill="#4a525d"/>
    </g>`;
  }

  function flashlight(x, y, a, beam) {
    return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(a)})">
      ${beam ? `<polygon points="16,-7 16,7 ${beam},${n(beam * 0.3)} ${beam},${n(-beam * 0.3)}" fill="url(#beamW)"/>` : ''}
      <rect x="-14" y="-6" width="30" height="12" rx="3" fill="#2a2d31"/>
      <rect x="14" y="-8" width="6" height="16" rx="2" fill="#3a3e44"/>
      <circle cx="20" cy="0" r="5" fill="#fffbe8"/>
    </g>`;
  }

  function wristbandsInHand(x, y) {
    return `<g transform="translate(${n(x)} ${n(y)})">
      <ellipse cx="-4" cy="10" rx="15" ry="7" fill="none" stroke="${PAL.paper}" stroke-width="5" transform="rotate(-20 -4 10)"/>
      <ellipse cx="6" cy="16" rx="15" ry="7" fill="none" stroke="${shade(PAL.paper, -0.12)}" stroke-width="5" transform="rotate(15 6 16)"/>
    </g>`;
  }

  function holdItem(kind, L, p) {
    switch (kind) {
      case 'crowbar': return crowbar(L.x2, L.y2, L.dir, 140);
      case 'rifle': return rifle(L.x2, L.y2, p.rifleA || 0);
      case 'flashlight': return flashlight(L.x2, L.y2, p.flashA == null ? 0 : p.flashA, p.beam || 0);
      case 'wristbands': return wristbandsInHand(L.x2, L.y2);
      default: return '';
    }
  }

  // ---------------------------------------------------------------- person
  const POSE0 = { fHip: 3, fKnee: -2, bHip: -3, bKnee: -2, fSh: 6, fEl: 8, bSh: -6, bEl: 8, lean: 0, head: 0, crouch: 0, expr: 'neutral', facing: 1 };

  function person(s, pose, x, y, sc) {
    const p = Object.assign({}, POSE0, pose || {});
    x = x || 0; y = y || 0; sc = sc || 1;
    const dk = (c) => shade(c, -0.22);
    const hipY = -(s.leg1 + s.leg2) + p.crouch;
    const shY = hipY - s.torso;
    const o = [];

    const legB = limb(-s.hipW * 0.2, hipY, p.bHip, s.leg1, p.bKnee, s.leg2);
    const legF = limb(s.hipW * 0.2, hipY, p.fHip, s.leg1, p.fKnee, s.leg2);
    const leg = (L, back) => {
      const c = back ? dk(s.pants) : s.pants, sk = back ? dk(s.skin) : s.skin;
      let r = s.shorts ? line(L, s.legW * 0.8, sk) + line(L, s.legW + 4, c, 0.6) : line(L, s.legW, c);
      r += `<ellipse cx="${n(L.x2 + s.legW * 0.35)}" cy="${n(L.y2 - s.legW * 0.1)}" rx="${n(s.legW * 0.8)}" ry="${n(s.legW * 0.45)}" fill="${back ? dk(s.shoe) : s.shoe}" transform="rotate(${n(-L.dir * 0.4)} ${n(L.x2)} ${n(L.y2)})"/>`;
      return r;
    };
    const arm = (L, back, hide) => {
      const c = back ? dk(s.top) : s.top, sk = back ? dk(s.skin) : s.skin;
      let r = s.sleeve === 'short' ? line(L, s.armW * 0.82, sk) + line(L, s.armW + 4, c, 0.55) : line(L, s.armW, c);
      if (hide) r += `<circle cx="${n(L.x2)}" cy="${n(L.y2)}" r="${n(s.armW * 0.62)}" fill="${shade(c, -0.15)}"/>`;
      return r;
    };
    const hand = (L, back) => `<circle cx="${n(L.x2)}" cy="${n(L.y2)}" r="${n(s.armW * 0.56)}" fill="${back ? dk(s.skin) : s.skin}"/>`;

    o.push(leg(legB, true));
    o.push(`<g transform="rotate(${n(p.lean)} 0 ${n(hipY)})">`);
    if (s.topStyle === 'hoodie') o.push(`<ellipse cx="${n(-s.headR * 0.45)}" cy="${n(shY - 2)}" rx="${n(s.headR * 0.8)}" ry="${n(s.headR * 0.42)}" fill="${dk(s.top)}"/>`);
    if (s.backpack) o.push(`<rect x="${n(-s.hipW / 2 - 26)}" y="${n(shY + 8)}" width="34" height="${n(s.torso * 0.7)}" rx="10" fill="${s.backpack}"/>`);
    if (s.slung) o.push(rifle(-s.shW * 0.1, shY + s.torso * 0.45, -62));
    if (p.pocket) o.push(crowbar(-s.hipW * 0.36, hipY + 4, 190, 120));
    const armB = limb(-s.shW * 0.28, shY + s.armW * 0.5, p.bSh, s.arm1, p.bEl, s.arm2);
    o.push(arm(armB, true, false));
    o.push(holdItem(p.holdB, armB, p));
    o.push(hand(armB, true));
    o.push(`</g>`);
    o.push(leg(legF, false));
    o.push(`<g transform="rotate(${n(p.lean)} 0 ${n(hipY)})">`);
    o.push(torso(s, hipY, shY, p.facing));
    if (s.backpack) o.push(`<path d="M${n(-s.shW * 0.3)} ${n(shY + 4)}L${n(-s.hipW * 0.28)} ${n(shY + s.torso * 0.62)}" stroke="${shade(s.backpack, -0.3)}" stroke-width="7" stroke-linecap="round"/>`);
    const headY = shY - s.neck - s.headR * 0.85;
    o.push(`<g transform="rotate(${n(p.head)} 0 ${n(shY)})">`);
    o.push(`<rect x="${n(-s.neckW / 2)}" y="${n(shY - s.neck - 6)}" width="${n(s.neckW)}" height="${n(s.neck + 12)}" fill="${shade(s.skin, -0.12)}"/>`);
    if (s.neckBite) o.push(`<g transform="translate(${n(s.neckW * 0.15)} ${n(shY - s.neck * 0.4)})"><ellipse rx="${n(s.neckW * 0.5)}" ry="${n(s.neck * 0.5)}" fill="#7a3434" opacity=".55"/>${[-0.3, 0, 0.3].map((k) => `<circle cx="${n(k * s.neckW)}" cy="${n(-s.neck * 0.22)}" r="2.6" fill="${PAL.blood}"/><circle cx="${n(k * s.neckW)}" cy="${n(s.neck * 0.26)}" r="2.6" fill="${PAL.blood}"/>`).join('')}</g>`);
    o.push(`<g transform="translate(0 ${n(headY)})">${head(s, p.expr)}</g>`);
    o.push(`</g>`);
    const armF = limb(s.shW * 0.28, shY + s.armW * 0.5, p.fSh, s.arm1, p.fEl, s.arm2);
    o.push(holdItem(p.holdF, armF, p));
    o.push(arm(armF, false, s.hideHand));
    if (!s.hideHand) o.push(hand(armF, false));
    if (s.bandage && !s.hideHand) {
      // gauze wrap on the forearm just above the wrist, with blood seeping through
      const bx = armF.x1 + (armF.x2 - armF.x1) * 0.72, by = armF.y1 + (armF.y2 - armF.y1) * 0.72;
      const ex = armF.x1 + (armF.x2 - armF.x1) * 0.92, ey = armF.y1 + (armF.y2 - armF.y1) * 0.92;
      o.push(`<path d="M${n(bx)} ${n(by)}L${n(ex)} ${n(ey)}" stroke="#e8e4da" stroke-width="${n(s.armW * 0.95)}" stroke-linecap="butt"/>`);
      o.push(`<circle cx="${n((bx + ex) / 2)}" cy="${n((by + ey) / 2)}" r="${n(s.armW * 0.24)}" fill="${PAL.blood}" opacity=".85"/>`);
    }
    o.push(`</g>`);
    return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(sc * p.facing)} ${n(sc)})">${o.join('')}</g>`;
  }

  function height(s) { return s.leg1 + s.leg2 + s.torso + s.neck + s.headR * 1.9; }

  // ---------------------------------------------------------------- cast
  const CHAR = {
    ksyusha: {
      name: 'Ksyusha', leg1: 80, leg2: 78, legW: 24, torso: 108, hipW: 44, shW: 60, arm1: 62, arm2: 58, armW: 17,
      headR: 34, neck: 10, neckW: 16, skin: '#d9b49b', hair: 'ksyusha', hairC: '#2b1c19', top: '#2e4a50', topStyle: 'hoodie',
      pants: '#232a3a', shoe: '#b9b2a4', sleeve: 'long',
    },
    tyoma: {
      name: 'Tyoma', leg1: 48, leg2: 46, legW: 19, torso: 70, hipW: 34, shW: 44, arm1: 40, arm2: 38, armW: 14,
      headR: 32, neck: 6, neckW: 13, skin: '#e2bea4', hair: 'boy', hairC: '#6e4a2c', top: '#d4a02c', topStyle: 'tee',
      pants: '#3a4560', shorts: true, sleeve: 'short', shoe: '#a33a2e', eyeK: 1.35, blush: true, backpack: '#4c6a8a',
    },
    tall: {
      name: 'Tall', leg1: 90, leg2: 88, legW: 27, torso: 124, hipW: 52, shW: 74, arm1: 72, arm2: 66, armW: 20,
      headR: 32, neck: 12, neckW: 20, skin: '#c99d84', hair: 'cap', hairC: '#1d1f22', capC: '#2b2f27', top: '#3e4534',
      topStyle: 'jacket', pants: '#2c3027', shoe: '#1a1a1a', sleeve: 'long', stubble: true, hideHand: true, slung: true,
    },
    stocky: {
      name: 'Stocky', leg1: 82, leg2: 80, legW: 30, torso: 118, hipW: 62, shW: 82, arm1: 68, arm2: 62, armW: 22,
      headR: 34, neck: 10, neckW: 24, skin: '#b88a70', hair: 'short', hairC: '#141414', top: '#2f3540', topStyle: 'vest',
      pants: '#3b3a33', shoe: '#141414', sleeve: 'long', stubble: true,
    },
    guard: {
      name: 'Guard', leg1: 86, leg2: 84, legW: 28, torso: 120, hipW: 56, shW: 76, arm1: 70, arm2: 64, armW: 21,
      headR: 33, neck: 10, neckW: 20, skin: '#c9a58e', hair: 'hazmat', top: '#9aa3ad', topStyle: 'hazmat',
      pants: '#8d96a0', shoe: '#2a2d31', sleeve: 'long',
    },
    inf1: {
      name: 'Infected', leg1: 82, leg2: 80, legW: 24, torso: 112, hipW: 48, shW: 64, arm1: 66, arm2: 62, armW: 18,
      headR: 32, neck: 11, neckW: 17, skin: PAL.infSkin, hair: 'patchy', hairC: '#2a2a24', top: '#5a4a52', topStyle: 'torn',
      pants: '#2f3340', shoe: '#222222', sleeve: 'short', forceExpr: 'infected',
    },
    inf2: {
      name: 'Infected', leg1: 78, leg2: 76, legW: 22, torso: 104, hipW: 44, shW: 58, arm1: 62, arm2: 58, armW: 16,
      headR: 31, neck: 10, neckW: 15, skin: '#76836a', hair: 'patchy', hairC: '#3a3328', top: '#4a5a6a', topStyle: 'torn',
      pants: '#4a4036', shoe: '#2a2420', sleeve: 'long', forceExpr: 'infected',
    },
    inf3: {
      name: 'Infected', leg1: 86, leg2: 84, legW: 26, torso: 118, hipW: 54, shW: 70, arm1: 70, arm2: 64, armW: 19,
      headR: 33, neck: 12, neckW: 19, skin: '#88927a', hair: 'patchy', hairC: '#1e1e1e', top: '#6a5a3a', topStyle: 'torn',
      pants: '#25282f', shoe: '#1b1b1b', sleeve: 'short', forceExpr: 'infected',
    },
    stranger: {
      name: '???', leg1: 82, leg2: 80, legW: 24, torso: 110, hipW: 46, shW: 62, arm1: 64, arm2: 60, armW: 18,
      headR: 32, neck: 10, neckW: 17, skin: '#0a0d14', hair: 'hood', hoodC: '#07090e', hairC: '#07090e', top: '#07090e',
      topStyle: 'plain', pants: '#06080c', shoe: '#05060a', sleeve: 'long', forceExpr: 'glint',
    },
  };

  // Distant silhouette version of any character (for the bridge, the crowd, the stands).
  function silhouette(s, tint) {
    tint = tint || '#121826';
    return Object.assign({}, s, { skin: shade(tint, 0.08), top: tint, pants: shade(tint, -0.2), shoe: shade(tint, -0.4), hairC: shade(tint, -0.3), capC: shade(tint, -0.3), backpack: s.backpack ? shade(tint, -0.1) : null });
  }

  // ---------------------------------------------------------------- shared defs
  function defs() {
    return `<defs>
      <radialGradient id="glowS"><stop offset="0" stop-color="#f0a94b" stop-opacity=".55"/><stop offset=".35" stop-color="#f0a94b" stop-opacity=".16"/><stop offset="1" stop-color="#f0a94b" stop-opacity="0"/></radialGradient>
      <radialGradient id="poolS"><stop offset="0" stop-color="#f0a94b" stop-opacity=".32"/><stop offset="1" stop-color="#f0a94b" stop-opacity="0"/></radialGradient>
      <radialGradient id="glowW"><stop offset="0" stop-color="#eef4ff" stop-opacity=".8"/><stop offset=".3" stop-color="#cfdcf5" stop-opacity=".22"/><stop offset="1" stop-color="#cfdcf5" stop-opacity="0"/></radialGradient>
      <radialGradient id="glowL"><stop offset="0" stop-color="#b9b0e6" stop-opacity=".9"/><stop offset="1" stop-color="#6b5fa8" stop-opacity="0"/></radialGradient>
      <radialGradient id="glowR"><stop offset="0" stop-color="#ff3b30" stop-opacity=".35"/><stop offset="1" stop-color="#ff3b30" stop-opacity="0"/></radialGradient>
      <radialGradient id="vig" cx=".5" cy=".45" r=".75"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".82"/></radialGradient>
      <linearGradient id="skyN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070d"/><stop offset=".65" stop-color="#141a29"/><stop offset="1" stop-color="#2b2830"/></linearGradient>
      <linearGradient id="skyD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#262c3a"/><stop offset=".6" stop-color="#4f5563"/><stop offset="1" stop-color="#857b75"/></linearGradient>
      <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121826"/><stop offset="1" stop-color="#05070c"/></linearGradient>
      <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3036" stop-opacity="0"/><stop offset=".5" stop-color="#3a3036" stop-opacity=".35"/><stop offset="1" stop-color="#3a3036" stop-opacity="0"/></linearGradient>
      <linearGradient id="beamW" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fffbe8" stop-opacity=".55"/><stop offset="1" stop-color="#fffbe8" stop-opacity="0"/></linearGradient>
      <linearGradient id="beamF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef4ff" stop-opacity=".3"/><stop offset="1" stop-color="#eef4ff" stop-opacity="0"/></linearGradient>
      <linearGradient id="shadeDown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></linearGradient>
      <filter id="ledGlow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="soft"><feGaussianBlur stdDeviation="10"/></filter>
      <pattern id="mesh" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M0 0L22 22M22 0L0 22" stroke="#8a93a3" stroke-width="1.6" opacity=".45"/></pattern>
      <pattern id="brick" width="80" height="64" patternUnits="userSpaceOnUse"><rect width="80" height="64" fill="#2a1f1c"/><rect x="2" y="2" width="76" height="28" fill="#33251f"/><rect x="-38" y="34" width="76" height="28" fill="#2f231e"/><rect x="42" y="34" width="76" height="28" fill="#36281f"/></pattern>
      <pattern id="cobble" width="60" height="34" patternUnits="userSpaceOnUse"><rect width="60" height="34" fill="#151a24"/><rect x="2" y="2" width="56" height="13" rx="6" fill="#1a2030"/><rect x="-28" y="19" width="56" height="13" rx="6" fill="#192030"/><rect x="32" y="19" width="56" height="13" rx="6" fill="#1b2131"/></pattern>
      <clipPath id="kwin"><rect x="160" y="300" width="560" height="720"/></clipPath>
    </defs>`;
  }

  // ---------------------------------------------------------------- scenery pieces
  function building(o) {
    const R = rng(o.seed || 7), top = o.base - o.h, c = o.color, out = [];
    out.push(`<rect x="${o.x}" y="${top}" width="${o.w}" height="${o.h}" fill="${c}"/>`);
    if (o.roof === 'attic') out.push(`<path d="M${o.x + o.w * 0.3} ${top}L${o.x + o.w * 0.5} ${top - 80}L${o.x + o.w * 0.7} ${top}Z" fill="${c}"/><circle cx="${o.x + o.w * 0.5}" cy="${top - 30}" r="16" fill="${shade(c, -0.4)}"/>`);
    if (o.roof === 'dome') out.push(`<path d="M${o.x + o.w * 0.38} ${top}Q${o.x + o.w * 0.38} ${top - 110} ${o.x + o.w * 0.5} ${top - 150}Q${o.x + o.w * 0.62} ${top - 110} ${o.x + o.w * 0.62} ${top}Z" fill="${c}"/><rect x="${o.x + o.w * 0.5 - 3}" y="${top - 200}" width="6" height="55" fill="${c}"/>`);
    out.push(`<rect x="${o.x - 10}" y="${top - 8}" width="${o.w + 20}" height="18" fill="${shade(c, 0.07)}"/>`);
    const fh = (o.h - 60) / o.floors, cw = o.w / o.cols;
    for (let i = 0; i < o.floors; i++) {
      const fy = top + 34 + i * fh;
      out.push(`<rect x="${o.x}" y="${n(fy + fh - 6)}" width="${o.w}" height="5" fill="${shade(c, 0.05)}"/>`);
      for (let j = 0; j < o.cols; j++) {
        const ww = cw * 0.46, wh = fh * 0.6, wx = o.x + (j + 0.5) * cw - ww / 2, wy = fy + fh * 0.14;
        const lit = R() < (o.lit || 0);
        const fill = lit ? (R() < 0.5 ? '#e9a24a' : '#a86f36') : shade(c, -0.4);
        if (lit) out.push(`<circle cx="${n(wx + ww / 2)}" cy="${n(wy + wh / 2)}" r="${n(wh)}" fill="url(#glowS)" opacity=".7"/>`);
        out.push(`<path d="M${n(wx)} ${n(wy + wh)}L${n(wx)} ${n(wy + ww / 2)}A${n(ww / 2)} ${n(ww / 2)} 0 0 1 ${n(wx + ww)} ${n(wy + ww / 2)}L${n(wx + ww)} ${n(wy + wh)}Z" fill="${fill}"/>`);
        out.push(`<rect x="${n(wx - 5)}" y="${n(wy + wh)}" width="${n(ww + 10)}" height="6" fill="${shade(c, 0.1)}"/>`);
        if (o.balcony && i === 1 && j % 2 === 1) out.push(`<rect x="${n(wx - 20)}" y="${n(wy + wh)}" width="${n(ww + 40)}" height="8" fill="${shade(c, 0.12)}"/><path d="M${n(wx - 18)} ${n(wy + wh)}v-30h${n(ww + 36)}v30" stroke="${shade(c, 0.12)}" stroke-width="3" fill="none"/>`);
      }
    }
    return out.join('');
  }

  function lamp(x, base, h, on, dir) {
    dir = dir || 1;
    const top = base - h, hx = x + dir * 46, c = '#0c0f16';
    return `<g>
      ${on > 0 ? `<circle cx="${hx}" cy="${top + 18}" r="270" fill="url(#glowS)" opacity="${n(on)}"/><ellipse cx="${hx}" cy="${base + 8}" rx="230" ry="50" fill="url(#poolS)" opacity="${n(on)}"/>` : ''}
      <rect x="${x - 5}" y="${top}" width="10" height="${h}" fill="${c}"/>
      <rect x="${x - 11}" y="${base - 40}" width="22" height="40" fill="${c}"/>
      <path d="M${x} ${top + 4}Q${x} ${top - 14} ${x + dir * 20} ${top - 12}L${hx} ${top + 2}" stroke="${c}" stroke-width="8" fill="none"/>
      <path d="M${hx - 22} ${top + 4}L${hx + 22} ${top + 4}L${hx + 12} ${top + 20}L${hx - 12} ${top + 20}Z" fill="${c}"/>
      <ellipse cx="${hx}" cy="${top + 20}" rx="12" ry="5" fill="${on > 0.15 ? '#ffd28a' : '#3a3226'}"/>
    </g>`;
  }

  function car(x, base, sc, c, facing) {
    sc = sc || 1; c = c || '#252b35'; facing = facing || 1;
    return `<g transform="translate(${x} ${base}) scale(${sc * facing} ${sc})">
      <path d="M-230 -40L-230 -95Q-228 -110 -205 -112L-120 -118L-80 -175Q-72 -186 -55 -186L95 -186Q112 -186 122 -172L165 -118L215 -112Q238 -108 238 -88L238 -40Z" fill="${c}"/>
      <path d="M-68 -122L-38 -172L20 -172L20 -122Z" fill="#0d1119"/>
      <path d="M32 -122L32 -172L100 -172L140 -122Z" fill="#0d1119"/>
      <rect x="-232" y="-62" width="472" height="8" fill="${shade(c, 0.12)}"/>
      <circle cx="-140" cy="-38" r="40" fill="#0b0d12"/><circle cx="-140" cy="-38" r="16" fill="#2a2f38"/>
      <circle cx="150" cy="-38" r="40" fill="#0b0d12"/><circle cx="150" cy="-38" r="16" fill="#2a2f38"/>
      <rect x="226" y="-102" width="12" height="16" fill="#3a2a20"/>
    </g>`;
  }

  function rain(seed, count, t, op) {
    const R = rng(seed), o = [];
    for (let i = 0; i < count; i++) {
      const x = R() * 1200 - 60, sp = 900 + R() * 600, y = ((R() * 2100 + (t || 0) * sp) % 2100) - 100, l = 40 + R() * 50;
      o.push(`<path d="M${n(x)} ${n(y)}l${n(-l * 0.18)} ${n(l)}" stroke="#a9b6cc" stroke-width="2" opacity="${n((op || 0.3) * (0.5 + R() * 0.5))}"/>`);
    }
    return o.join('');
  }

  const vignette = () => `<rect width="1080" height="1920" fill="url(#vig)"/>`;

  // ---------------------------------------------------------------- locations (1080×1920)
  const SCENES = {
    kitchen(o) {
      o = Object.assign({ lightning: 0.45, clock: '04:10', radioGlow: 1 }, o || {});
      const out = [];
      out.push(`<rect width="1080" height="1920" fill="#161b27"/>`);
      for (let x = 20; x < 1080; x += 54) out.push(`<rect x="${x}" y="0" width="3" height="1300" fill="#1b2130"/>`);
      out.push(`<rect x="140" y="280" width="600" height="760" fill="#2a2f3a"/>`);
      out.push(`<g clip-path="url(#kwin)"><rect x="160" y="300" width="560" height="720" fill="url(#skyN)"/>
        <ellipse cx="520" cy="430" rx="320" ry="170" fill="url(#glowL)" opacity="${n(o.lightning)}"/>
        <path d="M160 1020V820h70v-60h50v40h90v-90h40v-40h20v40h40v90h80v-50h60v60h70v230Z" fill="#0b0f19"/>
        <rect x="300" y="830" width="14" height="20" fill="#1a1f2a"/><rect x="560" y="880" width="14" height="20" fill="#1a1f2a"/></g>`);
      out.push(`<rect x="433" y="300" width="14" height="720" fill="#2a2f3a"/><rect x="160" y="600" width="560" height="14" fill="#2a2f3a"/>`);
      out.push(`<rect x="120" y="1036" width="640" height="26" fill="#30364a"/>`);
      out.push(`<path d="M60 240h140c-20 200 30 420 -10 640c-10 80 10 150 -10 220H60Z" fill="#3b2329"/><path d="M680 240h150v1060H700c20-90-10-160 10-240c30-260-40-520-30-820Z" fill="#3b2329"/>`);
      out.push(`<path d="M60 240h140M680 240h150" stroke="#14171f" stroke-width="16"/>`);
      out.push(`<rect x="880" y="420" width="220" height="1000" rx="14" fill="#232a36"/><rect x="900" y="640" width="10" height="160" rx="5" fill="#3b4354"/><rect x="880" y="840" width="220" height="6" fill="#1a2029"/>`);
      out.push(`<polygon points="160,1020 720,1020 1080,1600 -200,1600" fill="#9fb3d6" opacity=".035"/>`);
      out.push(`<path d="M0 1250H1080V1920H0Z" fill="#241e1b"/><rect y="1250" width="1080" height="16" fill="#3a302a"/>`);
      out.push(`<rect y="1266" width="1080" height="654" fill="url(#shadeDown)"/>`);
      // old radio
      out.push(`<g><rect x="560" y="1000" width="400" height="250" rx="18" fill="#3a2c22"/><rect x="560" y="1000" width="400" height="10" rx="5" fill="#4d3b2e"/>
        <rect x="585" y="1030" width="190" height="190" rx="10" fill="#2a2019"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<rect x="595" y="${1045 + i * 19}" width="170" height="6" fill="#1d1612"/>`).join('')}
        <circle cx="870" cy="1070" r="80" fill="url(#glowS)" opacity="${n(o.radioGlow * 0.8)}"/>
        <rect x="795" y="1035" width="145" height="70" rx="6" fill="#c08a3a" opacity="${n(0.35 + 0.55 * o.radioGlow)}"/>
        ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${808 + i * 19}" y="1045" width="2" height="${i % 2 ? 12 : 20}" fill="#3a2a16"/>`).join('')}
        <rect x="860" y="1040" width="3" height="60" fill="#b3241c"/>
        <circle cx="830" cy="1170" r="24" fill="#1d1612"/><circle cx="905" cy="1170" r="24" fill="#1d1612"/><rect x="828" y="1150" width="4" height="14" fill="#5b4a3c"/>
        <path d="M935 1000L1050 720" stroke="#6b6f78" stroke-width="5"/></g>`);
      // clock radio
      out.push(`<g><rect x="160" y="1110" width="320" height="140" rx="16" fill="#0f1015"/><rect x="180" y="1130" width="280" height="96" rx="6" fill="#190a0a"/>
        <ellipse cx="320" cy="1178" rx="200" ry="110" fill="url(#glowR)"/>
        <text x="320" y="1206" text-anchor="middle" font-family="DejaVu Sans Mono" font-weight="bold" font-size="84" fill="${PAL.ledRed}" filter="url(#ledGlow)">${o.clock}</text></g>`);
      out.push(`<rect x="500" y="1150" width="46" height="100" rx="4" fill="#9fb3c8" opacity=".18"/><rect x="500" y="1200" width="46" height="50" fill="#9fb3c8" opacity=".12"/>`);
      if (!o.noVig) out.push(vignette());
      return out.join('');
    },

    street(o) {
      o = Object.assign({ flicker: 1 }, o || {});
      const out = [];
      out.push(`<rect width="1080" height="1920" fill="url(#skyN)"/>`);
      out.push(`<circle cx="830" cy="250" r="190" fill="url(#glowS)" opacity=".25"/><circle cx="830" cy="250" r="54" fill="#cdb98e" opacity=".55"/>`);
      out.push(`<path d="M0 520Q540 600 1080 500M0 560Q540 650 1080 560" stroke="#0a0d14" stroke-width="3" fill="none"/>`);
      out.push(`<path d="M0 1000V720h90v-60h60v60h80V640h40l30-80l30 80h40v120h120V680h70v-50h20v50h60V760h100V600h20v-60q30-60 60 0v60h20v160h80v300Z" fill="#0f1420"/>`);
      out.push(building({ x: -20, w: 400, h: 860, base: 1330, color: '#1a2131', floors: 4, cols: 3, lit: 0.05, seed: 3, roof: 'attic', balcony: true }));
      out.push(building({ x: 380, w: 380, h: 960, base: 1330, color: '#1e2638', floors: 5, cols: 3, lit: 0.08, seed: 11, balcony: true }));
      out.push(building({ x: 760, w: 340, h: 820, base: 1330, color: '#192030', floors: 4, cols: 3, lit: 0.0, seed: 5, roof: 'dome' }));
      out.push(`<rect x="510" y="1170" width="120" height="160" fill="#0c1018"/><path d="M510 1170q60-70 120 0" fill="#0c1018"/>`);
      out.push(`<g transform="translate(70 0) rotate(-2 200 1160)"><rect x="125" y="1100" width="170" height="110" fill="${PAL.paper}" opacity=".75"/><text x="210" y="1135" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="17" fill="#7a1a1a">EVACUATION</text><text x="210" y="1172" text-anchor="middle" font-family="DejaVu Sans Mono" font-weight="bold" font-size="30" fill="#222">06:00</text><text x="210" y="1198" text-anchor="middle" font-family="DejaVu Sans" font-size="15" fill="#333">STADIUM</text></g>`);
      out.push(`<rect y="1330" width="1080" height="70" fill="#272c38"/><rect y="1396" width="1080" height="10" fill="#3a404c"/>`);
      out.push(`<rect y="1406" width="1080" height="514" fill="url(#cobble)"/>`);
      out.push(lamp(150, 1340, 520, 1));
      out.push(lamp(960, 1340, 520, o.flicker, -1));
      if (!o.noCar) out.push(car(640, 1600, 0.95, '#262c36'));
      out.push(`<rect width="1080" height="1920" fill="url(#haze)" opacity=".6"/>`);
      if (!o.noVig) out.push(vignette());
      return out.join('');
    },

    bridge(o) {
      o = Object.assign({ flicker: 1, turn: 0 }, o || {});
      const out = [];
      out.push(`<rect width="1080" height="1920" fill="url(#skyN)"/>`);
      out.push(`<path d="M0 860V800h120v-40h100v50h80v-30h90v50h610v30Z" fill="#0d121c"/>`);
      out.push(`<path d="M560 860Q560 760 780 750Q1000 760 1000 860Z" fill="#0b0f18"/>`);
      [600, 700, 860, 960].forEach((x, i) => {
        const h = 250 + (i % 2) * 40;
        out.push(`<circle cx="${x}" cy="${860 - h}" r="200" fill="url(#glowW)" opacity=".55"/><path d="M${x} 860V${860 - h}" stroke="#0b0f18" stroke-width="6"/><rect x="${x - 22}" y="${860 - h - 14}" width="44" height="18" fill="#eef4ff"/>`);
      });
      out.push(`<rect y="940" width="1080" height="980" fill="url(#water)"/>`);
      [150, 520, 880].forEach((x, i) => {
        const op = i === 1 ? 0.3 * o.flicker : 0.3;
        for (let k = 0; k < 9; k++) out.push(`<rect x="${n(x + 46 - (40 - k * 3) + Math.sin(k * 1.7 + (o.t || 0) * 2) * 10)}" y="${1200 + k * 48}" width="${80 - k * 6}" height="6" rx="3" fill="#f0a94b" opacity="${n(op * (1 - k / 10))}"/>`);
      });
      out.push(`<path d="M0 940H1080V990H0Z" fill="#232b3a"/>`);
      out.push(`<path d="M0 990H1080V1180H0Z" fill="#1b2230"/>`);
      [180, 540, 900].forEach((x) => out.push(`<path d="M${x - 150} 1180V1100Q${x} 980 ${x + 150} 1100V1180Z" fill="#070a11"/>`));
      out.push(`<path d="M0 935H1080" stroke="#2e3848" stroke-width="8"/>`);
      for (let x = 0; x < 1080; x += 22) out.push(`<rect x="${x}" y="880" width="6" height="56" fill="#141a26"/>`);
      out.push(`<rect y="874" width="1080" height="10" fill="#2a3242"/>`);
      out.push(lamp(150, 940, 230, 1));
      out.push(lamp(520, 940, 230, o.flicker));
      out.push(lamp(880, 940, 230, 1, -1));
      const crowd = [[80, 'inf1', 18], [250, 'inf2', -12], [330, 'inf3', 22], [470, 'inf1', 8], [610, 'inf2', 26], [700, 'inf3', -18], [820, 'inf1', 14], [1000, 'inf2', -20]];
      crowd.forEach(([x, k, tilt], i) => {
        const facing = o.turn > 0.5 ? -1 : (i % 2 ? 1 : -1);
        out.push(person(silhouette(CHAR[k], '#151b28'), { head: o.turn > 0.5 ? -6 : tilt, lean: 6, expr: 'infected', facing }, x, 936, 0.36));
      });
      out.push(`<path d="M0 1460L1080 1420V1920H0Z" fill="#232731"/><path d="M0 1460L1080 1420" stroke="#363b47" stroke-width="18"/>`);
      out.push(car(250, 1560, 1.15, '#20252e', -1));
      if (!o.noVig) out.push(vignette());
      return out.join('');
    },

    courtyard(o) {
      o = Object.assign({ sway: 0 }, o || {});
      const out = [];
      out.push(`<rect width="1080" height="1920" fill="#0b0f18"/>`);
      out.push(`<rect x="0" y="0" width="1080" height="260" fill="url(#skyN)"/>`);
      out.push(building({ x: 160, w: 760, h: 1300, base: 1520, color: '#1a2030', floors: 6, cols: 4, lit: 0.03, seed: 21 }));
      out.push(`<path d="M380 1520V1060Q540 900 700 1060V1520Z" fill="#06080d"/><path d="M470 1520V1180Q540 1110 610 1180V1520Z" fill="#2b2622"/><circle cx="540" cy="1300" r="160" fill="url(#glowS)" opacity=".35"/>`);
      out.push(`<path d="M0 0L200 230V1580L0 1760Z" fill="#131826"/><path d="M1080 0L880 230V1580L1080 1760Z" fill="#131826"/>`);
      out.push(`<rect x="930" y="1160" width="110" height="250" fill="#0a0d14"/>`);
      out.push(`<circle cx="985" cy="1110" r="200" fill="url(#glowS)" opacity=".8"/><circle cx="985" cy="1112" r="10" fill="#ffd28a"/><path d="M985 1080v20" stroke="#0a0d14" stroke-width="4"/>`);
      const sw = o.sway;
      out.push(`<path d="M200 700Q540 780 880 700" stroke="#5b6170" stroke-width="2" fill="none"/><path d="M200 860Q540 930 880 860" stroke="#5b6170" stroke-width="2" fill="none"/>`);
      [[280, 718, 120, 190, '#8d93a0'], [430, 742, 90, 140, '#7a6f74'], [610, 742, 150, 220, '#9aa0aa'], [330, 886, 70, 110, '#6d7a8c'], [700, 880, 100, 150, '#857f72']].forEach(([x, y, w, h, c], i) => {
        const k = (i % 2 ? 1 : -1) * sw * 8;
        out.push(`<path d="M${x} ${y}L${x + w} ${y}L${x + w + k} ${y + h}Q${x + w / 2 + k} ${y + h - 14} ${x + k} ${y + h}Z" fill="${c}" opacity=".55"/>`);
      });
      out.push(`<rect y="1520" width="1080" height="400" fill="#141822"/>`);
      out.push(`<ellipse cx="560" cy="1680" rx="180" ry="26" fill="#2a3448" opacity=".7"/><ellipse cx="860" cy="1800" rx="120" ry="18" fill="#2a3448" opacity=".6"/>`);
      out.push(`<rect x="70" y="1400" width="300" height="200" rx="8" fill="#26352f"/><rect x="60" y="1390" width="320" height="22" rx="6" fill="#2f4139"/>`);
      out.push(`<path d="M230 1390q-6-60 14-80l-8-26l18 16q14-6 26 0l18-16l-8 26q20 20 14 80z" fill="#07090d"/><path d="M302 1388q40 0 44 -40" stroke="#07090d" stroke-width="8" fill="none"/>`);
      out.push(`<circle cx="248" cy="1318" r="4" fill="#d9e36b"/><circle cx="266" cy="1318" r="4" fill="#d9e36b"/>`);
      if (!o.noVig) out.push(vignette());
      return out.join('');
    },

    passage(o) {
      o = Object.assign({ boardOff: 0 }, o || {});
      const out = [];
      out.push(`<rect width="1080" height="1920" fill="url(#brick)"/>`);
      out.push(`<rect width="1080" height="1920" fill="#000" opacity=".35"/>`);
      out.push(`<rect x="290" y="680" width="500" height="890" fill="#14100e"/><rect x="320" y="710" width="440" height="860" fill="#2e2620"/>`);
      for (let x = 320; x < 760; x += 55) out.push(`<rect x="${x}" y="710" width="3" height="860" fill="#221b16"/>`);
      out.push(`<circle cx="540" cy="560" r="300" fill="url(#glowS)" opacity=".7"/><rect x="520" y="520" width="40" height="40" rx="8" fill="none" stroke="#14100e" stroke-width="5"/><circle cx="540" cy="545" r="9" fill="#ffd28a"/>`);
      const board = (x, y, w, a, i) => `<g transform="rotate(${a} ${x + w / 2} ${y})"><rect x="${x}" y="${y - 26}" width="${w}" height="52" rx="4" fill="#6b5640"/><path d="M${x + 10} ${y - 8}H${x + w - 20}M${x + 30} ${y + 10}H${x + w - 50}" stroke="#57452f" stroke-width="3"/><circle cx="${x + 24}" cy="${y}" r="6" fill="#1a1a1a"/><circle cx="${x + w - 24}" cy="${y}" r="6" fill="#1a1a1a"/>${i === 1 && o.boardOff ? '' : ''}</g>`;
      out.push(board(250, 930, 580, -12, 0));
      if (!o.boardOff) out.push(board(250, 1170, 580, 9, 1));
      out.push(board(270, 1400, 540, -2, 2));
      out.push(`<g transform="rotate(-6 160 640)" opacity=".5"><text x="60" y="660" font-family="DejaVu Sans" font-weight="bold" font-size="54" fill="#d8d2c4">→ STADIUM</text></g>`);
      out.push(`<rect y="1570" width="1080" height="350" fill="#120f0e"/><path d="M120 1640l40-12l30 18zM820 1700l60-20l20 26z" fill="#2a2320"/>`);
      if (!o.noVig) out.push(vignette());
      return out.join('');
    },

    stadium(o) {
      o = Object.assign({ rain: 0.25, t: 0 }, o || {});
      const out = [];
      out.push(`<rect width="1080" height="1920" fill="url(#skyD)"/>`);
      out.push(`<path d="M0 520Q300 470 540 500Q800 530 1080 600V1080H0Z" fill="#0d1018"/>`);
      for (let i = 1; i < 9; i++) out.push(`<path d="M0 ${520 + i * 62}Q300 ${470 + i * 64} 540 ${500 + i * 62}Q800 ${530 + i * 60} 1080 ${600 + i * 54}" stroke="#151a25" stroke-width="5" fill="none"/>`);
      out.push(`<path d="M520 500V1080M260 488V1080M800 530V1080" stroke="#090b11" stroke-width="18"/>`);
      [[110, 300], [970, 330]].forEach(([x, y]) => {
        out.push(`<polygon points="${x - 70},${y + 40} ${x + 70},${y + 40} ${x + 340 * (x < 540 ? 1 : -1)},1400 ${x + 60 * (x < 540 ? 1 : -1)},1400" fill="url(#beamF)" opacity=".6"/>`);
        out.push(`<circle cx="${x}" cy="${y}" r="260" fill="url(#glowW)"/><path d="M${x} ${y}V1080" stroke="#0a0c12" stroke-width="14"/><path d="M${x - 30} ${y + 60}L${x + 30} ${y + 140}M${x + 30} ${y + 60}L${x - 30} ${y + 140}" stroke="#0a0c12" stroke-width="4"/>`);
        out.push(`<rect x="${x - 80}" y="${y - 40}" width="160" height="80" fill="#1a1d24"/>`);
        for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) out.push(`<rect x="${x - 72 + c * 25}" y="${y - 33 + r * 24}" width="19" height="19" fill="#f4f8ff"/>`);
      });
      out.push(`<g><path d="M690 1080V930h230l50 70h60v80Z" fill="#20262a"/><path d="M690 940q110-70 230 0" fill="#2c3431"/><circle cx="760" cy="1082" r="34" fill="#0a0c10"/><circle cx="960" cy="1082" r="34" fill="#0a0c10"/></g>`);
      out.push(`<rect y="1080" width="1080" height="840" fill="#1c212b"/>`);
      [[120, '#eef4ff'], [540, '#eef4ff'], [970, '#eef4ff']].forEach(([x]) => out.push(`<rect x="${x - 20}" y="1120" width="40" height="700" fill="#eef4ff" opacity=".05"/>`));
      out.push(`<rect y="1010" width="1080" height="300" fill="url(#mesh)"/>`);
      for (let x = 0; x <= 1080; x += 135) out.push(`<rect x="${x - 5}" y="990" width="10" height="330" fill="#3a404c"/>`);
      out.push(`<rect y="1000" width="1080" height="8" fill="#4a505c"/>`);
      for (let x = 10; x < 1080; x += 34) out.push(`<circle cx="${x}" cy="985" r="14" fill="none" stroke="#5a606c" stroke-width="2"/>`);
      out.push(`<polygon points="530,1300 550,1300 600,1920 480,1920" fill="#2f3540"/><polygon points="535,1300 545,1300 580,1920 500,1920" fill="url(#mesh)"/>`);
      out.push(`<g><rect x="70" y="1150" width="420" height="96" rx="6" fill="#7a1a1a"/><text x="280" y="1213" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="40" fill="#f2e6e0">← LEFT · BITTEN</text></g>`);
      out.push(`<g><rect x="590" y="1150" width="420" height="96" rx="6" fill="#d8dfd6"/><text x="800" y="1213" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="40" fill="#1e3a26">RIGHT · CLEAR →</text></g>`);
      out.push(rain(9, 140, o.t, o.rain));
      if (!o.noVig) out.push(vignette());
      return out.join('');
    },
  };

  // ---------------------------------------------------------------- props for the sheet
  const PROPS = {
    wristband(x, y, num, a) {
      return `<g transform="translate(${x} ${y}) rotate(${a || 0})"><rect x="0" y="0" width="320" height="52" rx="8" fill="${PAL.paper}"/><rect x="0" y="0" width="34" height="52" rx="8" fill="${PAL.crowbar}"/><circle cx="296" cy="26" r="7" fill="#9a9384"/>
        <text x="50" y="22" font-family="DejaVu Sans" font-weight="bold" font-size="15" fill="#2a2a2a">STADIUM · CONVOY</text><text x="50" y="43" font-family="DejaVu Sans Mono" font-weight="bold" font-size="17" fill="#7a1a1a">06:00  № ${num}</text></g>`;
    },
    clock(x, y, text) {
      return `<g transform="translate(${x} ${y})"><rect width="300" height="130" rx="16" fill="#0f1015"/><rect x="18" y="18" width="264" height="94" rx="6" fill="#190a0a"/><ellipse cx="150" cy="65" rx="170" ry="90" fill="url(#glowR)"/><text x="150" y="96" text-anchor="middle" font-family="DejaVu Sans Mono" font-weight="bold" font-size="80" fill="${PAL.ledRed}" filter="url(#ledGlow)">${text}</text></g>`;
    },
    bite(x, y) {
      return `<g transform="translate(${x} ${y})"><rect x="0" y="40" width="330" height="90" rx="40" fill="#c99d84"/><rect x="200" y="22" width="150" height="126" rx="20" fill="#3e4534"/><path d="M200 22v126" stroke="#2c3126" stroke-width="8"/>
        <ellipse cx="110" cy="85" rx="56" ry="30" fill="#8e4a4a" opacity=".45"/>${[[72, 70], [90, 62], [110, 60], [130, 62], [148, 70], [76, 102], [94, 110], [114, 112], [134, 108], [150, 100]].map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx="6" ry="4" fill="${PAL.blood}"/>`).join('')}</g>`;
    },
    palm(x, y) {
      return `<g transform="translate(${x} ${y})"><path d="M30 150Q0 60 40 20Q80 0 120 20Q160 50 140 150Z" fill="#d9b49b"/><rect x="38" y="140" width="98" height="60" fill="#2e4a50"/><path d="M52 60Q90 90 128 70" stroke="${PAL.blood}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M60 70q4 20 -2 34M90 82q2 16 -4 26" stroke="${PAL.blood}" stroke-width="3" opacity=".7" fill="none"/></g>`;
    },
  };

  root.ART = { PAL, shade, rng, person, head, height, CHAR, silhouette, defs, SCENES, PROPS, crowbar, rifle, flashlight, car, lamp, building, rain, vignette };
})(typeof window !== 'undefined' ? window : globalThis);
