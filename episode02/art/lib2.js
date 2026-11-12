/* 06:00 — Episode 2 additions: Dad, the shivering man, convoy truck, and four new locations.
   Loads after ../../episode01/art/lib.js and extends window.ART. */
(function (root) {
  'use strict';
  const A = root.ART;
  const { PAL, shade, rng, building, rain, vignette, person, CHAR, silhouette } = A;
  const n = (v) => Math.round(v * 10) / 10;

  // ---------------------------------------------------------------- cast
  CHAR.dad = {
    name: 'Dad', leg1: 86, leg2: 84, legW: 27, torso: 118, hipW: 50, shW: 72, arm1: 68, arm2: 64, armW: 20,
    headR: 33, neck: 11, neckW: 20, skin: '#c9a58e', hair: 'short', hairC: '#5d5852', top: '#3b5068', topStyle: 'paramedic',
    pants: '#26303d', shoe: '#15171b', sleeve: 'long', stubble: true, tired: true, bandage: true,
  };
  CHAR.dadSweat = Object.assign({}, CHAR.dad, { sweat: true });
  CHAR.dadHidden = Object.assign({}, CHAR.dad, { sweat: true, hideHand: true });
  CHAR.feverMan = {
    name: 'Shivering man', leg1: 80, leg2: 78, legW: 24, torso: 112, hipW: 48, shW: 64, arm1: 64, arm2: 60, armW: 18,
    headR: 32, neck: 12, neckW: 18, skin: '#c8b4a0', hair: 'short', hairC: '#3a332c', top: '#6b6258', topStyle: 'sweater',
    pants: '#3a3f4a', shoe: '#222222', sleeve: 'long', sweat: true, tired: true, neckBite: true, stubble: true,
  };
  CHAR.feverTurned = Object.assign({}, CHAR.feverMan, { skin: PAL.infSkin, sweat: false, tired: false, forceExpr: 'infected', hairC: '#2a2622' });

  // ---------------------------------------------------------------- props
  function truck(x, base, sc, facing, lights) {
    sc = sc || 1; facing = facing || 1;
    const c = '#2c3328';
    return `<g transform="translate(${n(x)} ${n(base)}) scale(${n(sc * facing)} ${n(sc)})">
      ${lights ? `<circle cx="-262" cy="-70" r="60" fill="url(#glowR)" opacity="${lights}"/>` : ''}
      <path d="M-260 -60V-250Q-260 -270 -240 -270H90V-60Z" fill="#3b4234"/>
      ${[-200, -130, -60, 10].map((v) => `<path d="M${v} -268V-62" stroke="#2c3127" stroke-width="5"/>`).join('')}
      <path d="M100 -60V-210H200L260 -140V-60Z" fill="${c}"/><path d="M118 -150V-195H192L232 -150Z" fill="#0e1218"/>
      <rect x="-270" y="-70" width="540" height="22" fill="#1b1f1a"/>
      <circle cx="-180" cy="-40" r="38" fill="#0b0d0f"/><circle cx="-90" cy="-40" r="38" fill="#0b0d0f"/><circle cx="190" cy="-40" r="38" fill="#0b0d0f"/>
      <circle cx="-180" cy="-40" r="14" fill="#2a2f35"/><circle cx="-90" cy="-40" r="14" fill="#2a2f35"/><circle cx="190" cy="-40" r="14" fill="#2a2f35"/>
      <rect x="-268" y="-110" width="12" height="20" fill="${lights ? '#ff3b30' : '#4a1a18'}"/>
      <rect x="250" y="-120" width="12" height="18" fill="#f3e2a6"/>
    </g>`;
  }

  function grate(x, y, w, h, off) {
    const o = [`<g transform="translate(${n(x)} ${n(y)})${off ? ` rotate(${n(off)})` : ''}">`, `<rect width="${w}" height="${h}" rx="6" fill="#1e2226" stroke="#4a5058" stroke-width="8"/>`];
    for (let i = 1; i < 6; i++) o.push(`<rect x="10" y="${n((h / 6) * i - 6)}" width="${w - 20}" height="9" fill="#5a616b"/>`);
    [[10, 10], [w - 10, 10], [10, h - 10], [w - 10, h - 10]].forEach(([a, b]) => o.push(`<circle cx="${a}" cy="${b}" r="5" fill="#80878f"/>`));
    o.push('</g>');
    return o.join('');
  }

  function bandageClose(x, y) {
    return `<g transform="translate(${x} ${y})"><rect x="0" y="40" width="330" height="90" rx="40" fill="#c9a58e"/><rect x="210" y="22" width="150" height="126" rx="20" fill="#3b5068"/><rect x="210" y="70" width="150" height="14" fill="#c8ccc4"/>
      <rect x="70" y="34" width="120" height="102" rx="14" fill="#e8e4da"/>${[0, 1, 2, 3].map((i) => `<path d="M${78 + i * 30} 36l-14 98" stroke="#cfcac0" stroke-width="4"/>`).join('')}
      <ellipse cx="128" cy="86" rx="26" ry="20" fill="${PAL.blood}" opacity=".75"/><ellipse cx="122" cy="82" rx="12" ry="9" fill="#6e141a"/></g>`;
  }

  // ---------------------------------------------------------------- locations
  const S2 = {
    // Locker room / tunnel under the stands. o.lamp: 0..1, o.grateOff: 0..1, o.bang: door shake px
    tunnel(o) {
      o = Object.assign({ lamp: 1, grateOff: 0, bang: 0 }, o || {});
      const out = [];
      out.push(`<rect width="1080" height="1920" fill="#0d0f13"/>`);
      out.push(`<polygon points="0,0 1080,0 820,520 260,520" fill="#15181d"/>`);
      out.push(`<polygon points="0,0 260,520 260,1320 0,1920" fill="#191c21"/><polygon points="1080,0 820,520 820,1320 1080,1920" fill="#171a1f"/>`);
      out.push(`<rect x="260" y="520" width="560" height="800" fill="#22262c"/>`);
      out.push(`<polygon points="260,1320 820,1320 1080,1920 0,1920" fill="#121418"/>`);
      for (let i = 1; i < 7; i++) {
        const k = i / 7;
        out.push(`<path d="M${n(260 * (1 - k))} ${n(1320 + 600 * k)}H${n(820 + 260 * k)}" stroke="#1a1d22" stroke-width="3"/>`);
      }
      // pipes on the ceiling
      out.push(`<path d="M0 150L300 560H780L1080 150" stroke="#2c3138" stroke-width="22" fill="none"/><path d="M0 230L330 590H750L1080 230" stroke="#24282e" stroke-width="12" fill="none"/>`);
      // lockers on the left wall
      for (let i = 0; i < 5; i++) {
        const x0 = 20 + i * 46, x1 = x0 + 40, t0 = 300 + x0 * 0.95, t1 = 300 + x1 * 0.95, b0 = 1720 - x0 * 1.55, b1 = 1720 - x1 * 1.55;
        out.push(`<polygon points="${x0},${n(t0)} ${x1},${n(t1)} ${x1},${n(b1)} ${x0},${n(b0)}" fill="${i % 2 ? '#2b3a44' : '#283640'}" stroke="#11161b" stroke-width="3"/>`);
        out.push(`<path d="M${x0 + 8} ${n(t0 + 40)}l24 22M${x0 + 8} ${n(t0 + 60)}l24 22" stroke="#11161b" stroke-width="3"/>`);
      }
      // the heavy door + bolt
      out.push(`<g transform="translate(${n(o.bang)} 0)"><rect x="410" y="830" width="260" height="490" fill="#3a3f45"/><rect x="430" y="850" width="220" height="200" fill="#33383e"/><rect x="430" y="1080" width="220" height="220" fill="#33383e"/>
        <rect x="610" y="1050" width="80" height="24" rx="4" fill="#6a6f75"/><rect x="${n(560 + 50)}" y="1046" width="22" height="32" fill="#8a8f95"/>
        <text x="540" y="810" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="28" fill="#9aa0a6" opacity=".6">SECTOR B · LOCKER ROOM</text></g>`);
      out.push(`<rect x="400" y="820" width="280" height="10" fill="#4a4f55"/>`);
      // bench under the vent + vent grate
      out.push(`<rect x="660" y="1180" width="160" height="22" fill="#4a3a2c"/><rect x="672" y="1202" width="10" height="70" fill="#2a2018"/><rect x="800" y="1202" width="10" height="70" fill="#2a2018"/>`);
      out.push(`<rect x="680" y="580" width="130" height="100" fill="#07080a"/>`);
      if (o.grateOff < 1) out.push(grate(680 + o.grateOff * 60, 580 + o.grateOff * 500, 130, 100, o.grateOff * 70));
      // caged lamp
      const L = o.lamp;
      out.push(`<path d="M540 520V600" stroke="#0a0b0d" stroke-width="5"/>`);
      if (L > 0) out.push(`<circle cx="540" cy="640" r="430" fill="url(#glowS)" opacity="${n(L * 0.9 * 100) / 100}"/><ellipse cx="540" cy="1500" rx="420" ry="90" fill="url(#poolS)" opacity="${n(L * 100) / 100}"/>`);
      out.push(`<ellipse cx="540" cy="640" rx="26" ry="34" fill="${L > 0.2 ? '#ffd28a' : '#3a3226'}"/><path d="M514 620h52M514 645h52M514 668h52M540 606v70" stroke="#1a1b1e" stroke-width="5" fill="none"/><path d="M514 606h52" stroke="#0a0b0d" stroke-width="8"/>`);
      out.push(`<text x="140" y="1250" font-family="DejaVu Sans" font-weight="bold" font-size="30" fill="#7a1a1a" opacity=".55" transform="rotate(-8 140 1250)">QUARANTINE</text>`);
      if (!o.noVig) out.push(vignette());
      return out.join('');
    },

    // Vent shaft in one-point perspective; light at the far end. o.glow: 0..1
    shaft(o) {
      o = Object.assign({ glow: 1 }, o || {});
      const out = [`<rect width="1080" height="1920" fill="#0b0d10"/>`];
      const cx = 540, cy = 900, iw = 110, ih = 90;
      out.push(`<circle cx="${cx}" cy="${cy}" r="520" fill="url(#glowW)" opacity="${n(o.glow * 0.55 * 100) / 100}"/>`);
      for (let k = 0; k <= 10; k++) {
        const t = Math.pow(k / 10, 1.8), w = lerp(540, iw, t), h = lerp(960, ih, t), yy = lerp(960, cy, t);
        out.push(`<rect x="${n(cx - w)}" y="${n(yy - h)}" width="${n(w * 2)}" height="${n(h * 2)}" fill="none" stroke="${shade('#3a4048', -0.5 + t * 0.6)}" stroke-width="${n(18 - t * 15)}"/>`);
      }
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => out.push(`<path d="M${cx + a * 540} ${960 + b * 960}L${cx + a * iw} ${cy + b * ih}" stroke="#2a2f36" stroke-width="6"/>`));
      out.push(`<rect x="${cx - iw}" y="${cy - ih}" width="${iw * 2}" height="${ih * 2}" fill="#b9c3cf" opacity="${n((0.5 + 0.5 * o.glow) * 100) / 100}"/>`);
      for (let i = 0; i < 4; i++) out.push(`<rect x="${cx - iw + 10}" y="${cy - ih + 22 + i * 40}" width="${iw * 2 - 20}" height="12" fill="#2a2f36"/>`);
      out.push(`<polygon points="0,1920 1080,1920 ${cx + iw},${cy + ih} ${cx - iw},${cy + ih}" fill="#1c2026" opacity=".9"/>`);
      if (!o.noVig) out.push(vignette());
      return out.join('');
      function lerp(a, b, k) { return a + (b - a) * k; }
    },

    // From the top row of the stands at dawn. o.truck: 0..1 convoy progress, o.gate: 0 open..1 closed, o.flood: floodlights on 0..1
    standsTop(o) {
      o = Object.assign({ truck: 0.3, gate: 0, flood: 1, rain: 0.25, t: 0 }, o || {});
      const out = [];
      out.push(`<rect width="1080" height="1920" fill="url(#skyD)"/>`);
      out.push(`<ellipse cx="760" cy="560" rx="520" ry="160" fill="#c49a7a" opacity=".22"/>`);
      out.push(`<path d="M0 560V470h70v-40h60v50h90v-80h30v-30h20v30h40v60h120v-50h60v40h80v-90h50v70h90v-40h70v60h100v-30h100v70Z" fill="#20232b"/>`);
      // far stands with the exit gate
      out.push(`<path d="M0 560H1080V780H0Z" fill="#141820"/>`);
      for (let i = 1; i < 7; i++) out.push(`<path d="M0 ${560 + i * 32}H1080" stroke="#1c212b" stroke-width="5"/>`);
      const gw = 150 * (1 - o.gate);
      out.push(`<rect x="460" y="660" width="160" height="120" fill="#8d8a86"/><rect x="460" y="660" width="160" height="120" fill="url(#glowW)" opacity=".6"/>`);
      out.push(`<rect x="460" y="660" width="${n(80 - gw / 2)}" height="120" fill="#3a3f47"/><rect x="${n(540 + gw / 2)}" y="660" width="${n(80 - gw / 2)}" height="120" fill="#3a3f47"/>`);
      out.push(`<path d="M460 660h160" stroke="#0e1015" stroke-width="10"/>`);
      // field
      out.push(`<path d="M0 780H1080V1140H0Z" fill="#232c26"/><path d="M0 780H1080" stroke="#3a4a40" stroke-width="4"/>`);
      out.push(`<ellipse cx="540" cy="960" rx="180" ry="60" fill="none" stroke="#5f6e64" stroke-width="5" opacity=".7"/><path d="M540 780V1140" stroke="#5f6e64" stroke-width="5" opacity=".7"/>`);
      // convoy: trucks drive from the right toward the gate
      for (let i = 0; i < 3; i++) {
        const k = Math.min(1, Math.max(0, o.truck * 1.4 - i * 0.2));
        if (k >= 1) continue;
        const x = 1180 - k * 640 + i * 230, y = 1000 - k * 220, sc = 0.32 - k * 0.12;
        out.push(truck(x, y, sc, -1, 0.9));
      }
      // floodlight towers
      [[70, 1], [1010, -1]].forEach(([x]) => {
        out.push(`<path d="M${x} 160V1140" stroke="#0b0d12" stroke-width="16"/><rect x="${x - 70}" y="120" width="140" height="70" fill="#1a1d24"/>`);
        for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) out.push(`<rect x="${x - 62 + c * 26}" y="${128 + r * 28}" width="20" height="20" fill="${o.flood > 0.5 ? '#f4f8ff' : '#3a3f48'}"/>`);
        if (o.flood > 0.5) out.push(`<circle cx="${x}" cy="155" r="220" fill="url(#glowW)" opacity=".8"/>`);
      });
      // near seats, rows getting bigger toward the camera
      out.push(`<rect y="1140" width="1080" height="780" fill="#10141b"/>`);
      let y = 1150;
      for (let r = 0; r < 7; r++) {
        const h = 50 + r * 22, w = 70 + r * 26;
        out.push(`<rect y="${n(y + h * 0.7)}" width="1080" height="${n(h * 0.35)}" fill="#0b0e13"/>`);
        for (let x = -((r * 37) % w); x < 1080; x += w + 8) {
          out.push(`<path d="M${n(x)} ${n(y + h * 0.75)}V${n(y + h * 0.15)}Q${n(x)} ${n(y)} ${n(x + w * 0.15)} ${n(y)}H${n(x + w * 0.85)}Q${n(x + w)} ${n(y)} ${n(x + w)} ${n(y + h * 0.15)}V${n(y + h * 0.75)}Z" fill="${r % 2 ? '#2c4a6b' : '#294563'}"/>`);
          out.push(`<rect x="${n(x + 4)}" y="${n(y + h * 0.62)}" width="${n(w - 8)}" height="${n(h * 0.14)}" fill="#1d3550"/>`);
        }
        y += h * 0.95;
      }
      out.push(rain(31, 110, o.t, o.rain));
      if (!o.noVig) out.push(vignette());
      return out.join('');
    },

    // Flashback: apartment doorway, three days earlier. Warm light from inside.
    apartment(o) {
      o = Object.assign({}, o || {});
      const out = [];
      out.push(`<rect width="1080" height="1920" fill="#2a231e"/>`);
      for (let x = 0; x < 1080; x += 60) out.push(`<rect x="${x}" y="0" width="2" height="1500" fill="#30281f"/>`);
      out.push(`<rect x="250" y="440" width="560" height="1060" fill="#120e0b"/>`);
      out.push(`<rect x="290" y="480" width="480" height="1020" fill="#e2b77a"/><rect x="290" y="480" width="480" height="1020" fill="url(#glowS)" opacity=".9"/>`);
      out.push(`<rect x="290" y="480" width="480" height="1020" fill="#7a5638" opacity=".35"/>`);
      out.push(`<path d="M290 1500L560 1920H0V1500Z" fill="#e2b77a" opacity=".12"/>`);
      out.push(`<polygon points="770,480 960,410 960,1580 770,1500" fill="#5a4030"/><circle cx="930" cy="1000" r="12" fill="#c9a24a"/>`);
      out.push(`<rect x="230" y="420" width="600" height="30" fill="#3a2a1e"/><rect x="230" y="420" width="30" height="1090" fill="#3a2a1e"/><rect x="800" y="420" width="30" height="1090" fill="#3a2a1e"/>`);
      out.push(`<path d="M60 600h120" stroke="#4a3a2c" stroke-width="10"/>${[80, 120, 160].map((x) => `<circle cx="${x}" cy="612" r="9" fill="#6a5640"/>`).join('')}`);
      out.push(`<path d="M80 620q-10 120 20 260h70q20-140 0-260z" fill="#3b2329"/>`);
      out.push(`<rect y="1500" width="1080" height="420" fill="#1e1915"/><rect x="40" y="1540" width="200" height="40" rx="6" fill="#2e2620"/>`);
      if (!o.noVig) out.push(vignette());
      return out.join('');
    },
  };
  Object.assign(A.SCENES, S2);
  Object.assign(A.PROPS, { bandage: bandageClose, grate });
  A.truck = truck;
})(typeof window !== 'undefined' ? window : globalThis);
