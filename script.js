// 🌙 Karwa Chauth Special — Moonrise Tracker v2 · Made by @hack.n.code
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const P = new URLSearchParams(location.search);
  const REC = P.has('rec');
  const TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const easeInOut = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const rnd = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const pad = (n) => String(n).padStart(2, '0');
  const now = () => performance.now() / 1000;
  const graphemes = (s) => (window.Intl && Intl.Segmenter) ? [...new Intl.Segmenter().segment(s)].map(x => x.segment) : Array.from(s);
  const BANNED = ['riya', 'dhruvi', 'bhumi', 'shravni', 'smruti'];
  const cleanName = (s) => { s = (s || '').replace(/[<>]/g, '').trim().slice(0, 18); return s; };

  // ---------- data ----------
  // approx. moonrise & sunrise (IST) for Karwa Chauth, 29 Oct 2026
  const CITIES = [["Ahmedabad","20:46","06:42"],["Surat","20:50","06:39"],["Vadodara","20:46","06:39"],["Rajkot","20:56","06:49"],["Mumbai","20:55","06:37"],["Pune","20:53","06:32"],["Delhi","20:11","06:30"],["Jaipur","20:22","06:34"],["Chandigarh","20:07","06:34"],["Amritsar","20:12","06:43"],["Lucknow","20:01","06:13"],["Indore","20:34","06:29"],["Bhopal","20:26","06:23"],["Patna","19:47","05:55"],["Kolkata","19:42","05:39"],["Hyderabad","20:36","06:13"],["Bengaluru","20:50","06:12"],["Chennai","20:39","06:01"]];
  const SHAYARI = [
    ['Chaand ka intezaar sab karte hain,', 'mera chaand toh <em>mere saamne</em> hai 🌙'],
    ['Bhookh bhi haari, pyaas bhi haari,', 'tere pyaar ke aage <em>sab haar</em> gaye ❤️'],
    ['Chhalni se dekha chaand, phir dekha tumhe,', 'chaand bhi <em>sharma</em> gaya 😌'],
    ['Tum ho toh har din Karwa Chauth hai,', 'har raat <em>poonam</em> si ✨'],
    ['Saat pheron ka vaada, saat janam ka saath,', 'har chaand raat <em>bas tumhare</em> saath 💫'],
    ['Duniya kahe chaand nikla,', 'main kahun — <em>mera pyaar</em> nikla 💖']
  ];
  const PROMISES = [
    ['☕', 'Morning chai meri taraf se, forever'],
    ['🌙', 'Har Karwa Chauth, tumhara chaand main'],
    ['😅', 'Har ladai ke baad, sorry pehle main'],
    ['🍽️', 'Fast tumhara, dinner treat meri'],
    ['💞', 'Saat janam? Ye toh bas start hai'],
    ['🫶', 'Hamesha tumhari side, har din']
  ];
  const FRONT = ['💛', '🌙', '🪔', '🌸', '💫', '❤️'];

  const S = { phase: 'idle', t0: 0, name: '', photo: null, city: 0, typed: '' };
  const urlName = cleanName(P.get('name'));

  // ---------- toast ----------
  let toastT = 0;
  function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2200); }

  // ---------- real moonrise maths ----------
  function cityTimes(i) {
    const c = CITIES[i];
    return { name: c[0], moon: new Date(`2026-10-29T${c[1]}:00+05:30`), sun: new Date(`2026-10-29T${c[2]}:00+05:30`), mr: c[1] };
  }
  const fmt12 = (hhmm) => { let [h, m] = hhmm.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${pad(m)} ${ap}`; };
  function fmtLeft(ms) {
    if (ms < 0) ms = 0;
    const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60;
    return (d > 0 ? `${d}d ` : '') + `${pad(h)}:${pad(m)}:${pad(ss)}`;
  }
  function fastInfo() {
    const c = cityTimes(S.city), t = Date.now();
    const total = c.moon - c.sun;
    let pct = clamp((t - c.sun) / total) * 100;
    const fasted = clamp(t - c.sun, 0, total), left = Math.max(0, c.moon - t);
    return { c, pct, fasted, left, before: t < c.sun, after: t >= c.moon };
  }
  const hm = (ms) => { const m = Math.floor(ms / 60000); return `${Math.floor(m / 60)}h ${m % 60}m`; };

  // ===================================================================
  // 🌸 SPLASH — mehendi that draws itself
  // ===================================================================
  const sp = $('splash'), mc = $('mehendi'), mx = mc.getContext('2d');
  let MW = 0, MH = 0, MDPR = 1, mand = null, off = null, offX = null, drawnIdx = 0, spT0 = now(), spDone = false;
  function buildMandala() {
    const segs = [];
    const circ = (r, n = 140) => { const p = []; for (let i = 0; i <= n; i++) { const a = i / n * TAU; p.push([Math.cos(a) * r, Math.sin(a) * r]); } return p; };
    const petal = (th, r0, r1, wd, inner) => {
      const p = []; const N = 26;
      for (let i = 0; i <= N; i++) { const u = i / N; p.push([r0 + (r1 - r0) * u, wd * Math.sin(Math.PI * u) * (1 - .35 * u)]); }
      for (let i = N; i >= 0; i--) { const u = i / N; p.push([r0 + (r1 - r0) * u, -wd * Math.sin(Math.PI * u) * (1 - .35 * u)]); }
      return p.map(([a, l]) => [Math.cos(th) * a - Math.sin(th) * l, Math.sin(th) * a + Math.cos(th) * l]);
    };
    const line = (th, r0, r1) => [[Math.cos(th) * r0, Math.sin(th) * r0], [Math.cos(th) * r1, Math.sin(th) * r1]];
    const dot = (th, r, s) => ({ dot: true, x: Math.cos(th) * r, y: Math.sin(th) * r, s });
    segs.push({ pts: circ(.03, 40), w: 2 }); segs.push(dot(0, 0, .018));
    for (let i = 0; i < 8; i++) segs.push({ pts: petal(i / 8 * TAU, .04, .15, .045), w: 1.6 });
    segs.push({ pts: circ(.165), w: 1.6 });
    for (let i = 0; i < 12; i++) { const a = (i + .5) / 12 * TAU; segs.push({ pts: petal(a, .175, .33, .07), w: 1.5 }); segs.push({ pts: line(a, .2, .3), w: 1 }); }
    segs.push({ pts: circ(.345), w: 1.8 }); segs.push({ pts: circ(.365), w: 1 });
    for (let i = 0; i < 24; i++) segs.push(dot(i / 24 * TAU, .395, .011));
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; segs.push({ pts: petal(a, .42, .63, .1), w: 1.6 }); segs.push({ pts: petal(a, .45, .58, .055), w: 1 }); segs.push(dot(a, .66, .012)); }
    segs.push({ pts: circ(.69), w: 1.8 });
    for (let i = 0; i < 24; i++) { const a0 = i / 24 * TAU, a1 = (i + 1) / 24 * TAU, p = []; for (let k = 0; k <= 16; k++) { const a = lerp(a0, a1, k / 16); const r = .69 + .07 * Math.sin(Math.PI * k / 16); p.push([Math.cos(a) * r, Math.sin(a) * r]); } segs.push({ pts: p, w: 1.4 }); }
    for (let i = 0; i < 24; i++) { const a = (i + .5) / 24 * TAU; segs.push({ pts: petal(a, .77, .9, .035), w: 1.3 }); segs.push(dot(a, .94, .012)); }
    for (let i = 0; i < 48; i++) segs.push(dot((i + .25) / 48 * TAU, .985, .006));
    // lengths
    let total = 0;
    for (const s of segs) { if (s.dot) { s.len = .05; } else { let L = 0; for (let i = 1; i < s.pts.length; i++) L += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]); s.len = L; } s.start = total; total += s.len; }
    return { segs, total };
  }
  function spResize() {
    MDPR = Math.min(window.devicePixelRatio || 1, 2); MW = innerWidth; MH = innerHeight;
    mc.width = MW * MDPR; mc.height = MH * MDPR;
    const R = Math.min(MW * .43, MH * .25);
    off = document.createElement('canvas'); off.width = off.height = Math.ceil(R * 2.2 * MDPR); offX = off.getContext('2d');
    offX.setTransform(MDPR, 0, 0, MDPR, 0, 0); offX.translate(R * 1.1, R * 1.1);
    mand.R = R; drawnIdx = 0; mand.partial = 0;
  }
  function spStroke(s, upto, R) {
    const g = offX;
    g.strokeStyle = '#f2c66d'; g.fillStyle = '#f7d48a'; g.lineCap = 'round'; g.lineJoin = 'round';
    g.shadowColor = 'rgba(255,190,90,.8)'; g.shadowBlur = 4;
    if (s.dot) { g.beginPath(); g.arc(s.x * R, s.y * R, s.s * R, 0, TAU); g.fill(); return; }
    g.lineWidth = s.w * Math.max(1, R / 170);
    let L = 0; g.beginPath(); g.moveTo(s.pts[0][0] * R, s.pts[0][1] * R);
    for (let i = 1; i < s.pts.length; i++) {
      const d = Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]);
      if (L + d > upto) { const k = (upto - L) / d; g.lineTo(lerp(s.pts[i - 1][0], s.pts[i][0], k) * R, lerp(s.pts[i - 1][1], s.pts[i][1], k) * R); break; }
      L += d; g.lineTo(s.pts[i][0] * R, s.pts[i][1] * R);
    }
    g.stroke();
  }
  const SP_DRAW = 2.7;
  function spFrame() {
    if (spDone) return;
    const T = now() - spT0, R = mand.R;
    const target = mand.total * easeInOut(prog(T, .15, SP_DRAW));
    // commit whole segments onto the offscreen layer
    while (drawnIdx < mand.segs.length && mand.segs[drawnIdx].start + mand.segs[drawnIdx].len <= target) { spStroke(mand.segs[drawnIdx], 1e9, R); drawnIdx++; }
    const ctx = mx; ctx.setTransform(MDPR, 0, 0, MDPR, 0, 0); ctx.clearRect(0, 0, MW, MH);
    const cx = MW / 2, cy = MH * .31;
    // glow behind
    const gl = ctx.createRadialGradient(cx, cy, R * .1, cx, cy, R * 1.5);
    gl.addColorStop(0, `rgba(255,190,100,${.10 + .08 * Math.sin(T * 2)})`); gl.addColorStop(1, 'rgba(255,190,100,0)');
    ctx.fillStyle = gl; ctx.fillRect(0, 0, MW, MH);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.max(0, T - SP_DRAW) * .06);
    ctx.drawImage(off, -R * 1.1, -R * 1.1, R * 2.2, R * 2.2);
    // the segment being drawn right now + its pen tip
    const cur = mand.segs[drawnIdx];
    if (cur && target > cur.start) {
      ctx.save(); ctx.strokeStyle = '#ffe2a0'; ctx.fillStyle = '#ffe2a0'; ctx.lineCap = 'round'; ctx.shadowColor = '#ffcf7a'; ctx.shadowBlur = 8;
      if (cur.dot) { ctx.beginPath(); ctx.arc(cur.x * R, cur.y * R, cur.s * R, 0, TAU); ctx.fill(); }
      else {
        ctx.lineWidth = cur.w * Math.max(1, R / 170); const upto = target - cur.start; let L = 0, tip = cur.pts[0];
        ctx.beginPath(); ctx.moveTo(cur.pts[0][0] * R, cur.pts[0][1] * R);
        for (let i = 1; i < cur.pts.length; i++) { const d = Math.hypot(cur.pts[i][0] - cur.pts[i - 1][0], cur.pts[i][1] - cur.pts[i - 1][1]); if (L + d > upto) { const k = (upto - L) / d; tip = [lerp(cur.pts[i - 1][0], cur.pts[i][0], k), lerp(cur.pts[i - 1][1], cur.pts[i][1], k)]; ctx.lineTo(tip[0] * R, tip[1] * R); break; } L += d; tip = cur.pts[i]; ctx.lineTo(tip[0] * R, tip[1] * R); }
        ctx.stroke(); ctx.beginPath(); ctx.arc(tip[0] * R, tip[1] * R, 3, 0, TAU); ctx.fillStyle = '#fff6d8'; ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
    // golden particles
    for (let i = 0; i < 46; i++) {
      const sp_ = 18 + rnd(i + 3) * 40, x = rnd(i) * MW + Math.sin(T * .8 + i) * 12;
      const y = MH + 10 - ((rnd(i + 11) * MH + T * sp_) % (MH + 20));
      const tw = .5 + .5 * Math.sin(T * (2 + rnd(i) * 3) + i);
      ctx.globalAlpha = .25 + .6 * tw; ctx.fillStyle = i % 4 ? '#ffd877' : '#fff1c9';
      ctx.beginPath(); ctx.arc(x, y, .8 + rnd(i + 7) * 2.2, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (T > 1.5) sp.classList.add('ready');
    if (T > SP_DRAW + .15) sp.classList.add('go');
    requestAnimationFrame(spFrame);
  }

  // ===================================================================
  // 🌙 HERO — sky, moon, chhalni, couple, fireworks
  // ===================================================================
  const hero = $('hero'), cv = $('sky'), ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1, L = null;
  // demo timeline (seconds after Start)
  const T = { CD: 3.6, RISE0: 3.3, RISE1: 5.4, FULL: 4.4, CH0: 5.3, CH1: 6.4, M0: 6.5, M1: 7.5, CO0: 7.6, CO1: 8.4, CP0: 7.6, CP1: 8.7, FW0: 7.4, PET0: 7.2, LAN0: 5.6, L1: [5.5, 6.5], L2: [7.1, 8.2], NM: [8.2, 8.9], L3: [8.9, 9.5], DONE: 9.6 };
  const LINE1 = 'Chaand nikal aaya 🌙', LINE2 = 'Tum mera chaand ho,', LINE3 = 'HAPPY KARWA CHAUTH 🪔';

  function heroResize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    layout();
  }
  function layout() {
    const hr = hero.getBoundingClientRect();
    const c = $('card').getBoundingClientRect(), m = $('msg').getBoundingClientRect();
    const cb = c.bottom - hr.top, mt = m.top - hr.top;
    const yP = mt - 16;                      // terrace parapet top
    const space = Math.max(120, yP - cb);
    const cy = cb + space * .33;
    const r = Math.max(26, Math.min(W * .15, space * .18, 80));
    const heartBottom = cy + r * 1.2;
    const ch = clamp((yP - heartBottom) * .92, 50, 175);
    const far = [], near = [];
    let x = -10, i = 0;
    while (x < W + 10) { const w = 28 + rnd(i + 50) * 44; far.push({ x, w, top: yP - space * (.14 + rnd(i + 70) * .2), i }); x += w; i++; }
    x = -6; i = 0;
    while (x < W + 10) { const w = 24 + rnd(i + 150) * 38; near.push({ x, w, top: yP - space * (.03 + rnd(i + 170) * .12), i }); x += w + 1; i++; }
    const b = $('fill').parentElement.getBoundingClientRect();
    L = { cx: W / 2, cy, r, yP, space, cb, ch, far, near, bar: { x: b.left - hr.left, y: b.top - hr.top, w: b.width, h: b.height } };
  }

  function sparkle(x, y, s, a, col) {
    ctx.globalAlpha = clamp(a); ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s);
    ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s); ctx.fill(); ctx.globalAlpha = 1;
  }
  function drawSky(G, glow) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#04061a'); g.addColorStop(.45, '#0e0f38'); g.addColorStop(.7, '#2a1650'); g.addColorStop(1, '#3a1b48');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const hg = ctx.createRadialGradient(W / 2, L.yP, 10, W / 2, L.yP, H * .6);
    hg.addColorStop(0, `rgba(255,180,110,${.12 + .3 * glow})`); hg.addColorStop(1, 'rgba(255,170,90,0)');
    ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);
    const n = Math.round(W * H / 2300);
    for (let i = 0; i < n; i++) {
      const x = rnd(i) * W, y = rnd(i + 500) * L.yP * .95;
      const tw = .45 + .55 * Math.sin(G * (1.1 + rnd(i + 900) * 2.4) + i);
      ctx.globalAlpha = clamp(.2 + .6 * tw); ctx.fillStyle = rnd(i + 77) > .86 ? '#ffe7b0' : '#fff';
      ctx.beginPath(); ctx.arc(x, y, .5 + rnd(i + 1300) * 1.3, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function shapePath(c, x, y, r, k) {
    const s = r * 1.2 / 16; c.beginPath();
    for (let i = 0; i <= 140; i++) {
      const t = i / 140 * TAU;
      const px = r * Math.sin(t), py = -r * Math.cos(t);
      const hx = 16 * Math.pow(Math.sin(t), 3) * s, hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s - 2.5 * s;
      const X = x + lerp(px, hx, k), Y = y + lerp(py, hy, k);
      i ? c.lineTo(X, Y) : c.moveTo(X, Y);
    }
    c.closePath();
  }
  const mix = (a, b, k) => { const p = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`; };
  function drawPhoto(c, img, x, y, r) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, sc = Math.max(2.5 * r / iw, 2.5 * r / ih);
    c.drawImage(img, x - iw * sc / 2, y - ih * sc / 2 - r * .1, iw * sc, ih * sc);
  }
  function drawMoon(x, y, r, G, up, k) {
    ctx.save();
    const pulse = 1 + (.05 + .05 * k) * Math.sin(G * (1.8 + 2.2 * k)) * up;
    const R2 = r * (2.4 + .9 * up) * pulse;
    const halo = ctx.createRadialGradient(x, y, r * .8, x, y, R2);
    halo.addColorStop(0, k > .5 ? 'rgba(255,170,200,0.5)' : 'rgba(255,232,170,0.55)'); halo.addColorStop(.45, 'rgba(255,200,150,0.16)'); halo.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, R2, 0, TAU); ctx.fill();
    const rr = r * pulse;
    const mg = ctx.createRadialGradient(x - rr * .3, y - rr * .3, rr * .1, x, y, rr * 1.2);
    mg.addColorStop(0, mix('#fffdf3', '#ffe8ef', k)); mg.addColorStop(.65, mix('#fbedc6', '#ff9fbf', k)); mg.addColorStop(1, mix('#e8cd8e', '#e2507e', k));
    ctx.fillStyle = mg; ctx.shadowColor = k > .5 ? 'rgba(255,120,170,.9)' : 'rgba(255,220,150,.9)'; ctx.shadowBlur = r * .6;
    shapePath(ctx, x, y, rr, k); ctx.fill(); ctx.shadowBlur = 0;
    if (S.photo) {
      ctx.save(); shapePath(ctx, x, y, rr * .97, k); ctx.clip(); ctx.globalAlpha = .93; drawPhoto(ctx, S.photo, x, y, rr);
      const ov = ctx.createRadialGradient(x, y, rr * .5, x, y, rr * 1.2); ov.addColorStop(0, 'rgba(255,230,180,0)'); ov.addColorStop(1, 'rgba(255,200,150,.55)');
      ctx.globalAlpha = 1; ctx.fillStyle = ov; ctx.fillRect(x - rr * 1.5, y - rr * 1.5, rr * 3, rr * 3); ctx.restore();
    } else if (k < 1) {
      ctx.fillStyle = `rgba(185,150,95,${.2 * (1 - k)})`;
      [[-.3, -.2, .18], [.25, .1, .24], [-.1, .4, .12], [.36, -.36, .1], [-.44, .18, .09], [.05, -.5, .07]].forEach(([dx, dy, q]) => { ctx.beginPath(); ctx.arc(x + dx * rr, y + dy * rr, q * rr, 0, TAU); ctx.fill(); });
    }
    if (k > 0) { // shine on the heart
      ctx.globalAlpha = .5 * k; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x - rr * .45, y - rr * .45, rr * .16, rr * .09, -.7, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  function drawChhalni(c, x, y, R, a, rot, G) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(rot);
    c.save(); c.beginPath(); c.arc(0, 0, R * .88, 0, TAU); c.clip();
    c.fillStyle = 'rgba(255,215,140,.07)'; c.fill();
    c.strokeStyle = 'rgba(255,222,160,.5)'; c.lineWidth = Math.max(.7, R / 110);
    const st = R / 8.5;
    for (let d = -R * 1.3; d <= R * 1.3; d += st) {
      c.beginPath(); c.moveTo(d - R, -R); c.lineTo(d + R, R); c.stroke();
      c.beginPath(); c.moveTo(d + R, -R); c.lineTo(d - R, R); c.stroke();
    }
    c.restore();
    const g = c.createLinearGradient(-R, -R, R, R); g.addColorStop(0, '#fff0b8'); g.addColorStop(.35, '#f2b84b'); g.addColorStop(.7, '#c27c1f'); g.addColorStop(1, '#ffd77a');
    c.lineWidth = R * .14; c.strokeStyle = g; c.shadowColor = 'rgba(255,190,80,.8)'; c.shadowBlur = R * .25;
    c.beginPath(); c.arc(0, 0, R * .94, 0, TAU); c.stroke(); c.shadowBlur = 0;
    c.lineWidth = Math.max(1, R * .025); c.strokeStyle = '#8e1b2c'; c.beginPath(); c.arc(0, 0, R * .94, 0, TAU); c.stroke();
    for (let i = 0; i < 20; i++) {
      const an = i / 20 * TAU, bx = Math.cos(an) * R * .94, by = Math.sin(an) * R * .94;
      c.fillStyle = i % 2 ? '#e8334f' : '#fff3c4'; c.beginPath(); c.arc(bx, by, R * (i % 2 ? .045 : .032), 0, TAU); c.fill();
    }
    for (let i = 0; i < 28; i++) { // hanging gota beads
      const an = i / 28 * TAU, rr = R * 1.06; c.fillStyle = i % 2 ? '#ffd36e' : '#ff7fa3';
      c.globalAlpha = a * (.6 + .4 * Math.sin(G * 4 + i)); c.beginPath(); c.arc(Math.cos(an) * rr, Math.sin(an) * rr, R * .022, 0, TAU); c.fill();
    }
    c.restore();
  }
  function drawSkyline(G, glow) {
    const yP = L.yP;
    for (const b of L.far) {
      const g = ctx.createLinearGradient(0, b.top, 0, yP); g.addColorStop(0, '#2a2156'); g.addColorStop(1, '#1a1440');
      ctx.fillStyle = g; ctx.fillRect(b.x, b.top, b.w + 1, yP - b.top + 2);
      if (rnd(b.i + 400) > .6) ctx.fillRect(b.x + b.w * .45, b.top - 12, 2, 12);
      for (let wy = b.top + 9; wy < yP; wy += 12) for (let wx = b.x + 6; wx < b.x + b.w - 6; wx += 10) {
        const k = rnd(wx * .37 + wy * 1.31 + b.i); if (k > .78) { ctx.fillStyle = `rgba(255,214,140,${.25 + .15 * Math.sin(G * .7 + k * 40)})`; ctx.fillRect(wx, wy, 4, 5); }
      }
    }
    for (const b of L.near) {
      const g = ctx.createLinearGradient(0, b.top, 0, yP); g.addColorStop(0, '#15113a'); g.addColorStop(1, '#0a0822');
      ctx.fillStyle = g; ctx.fillRect(b.x, b.top, b.w, yP - b.top + 2);
      ctx.fillStyle = `rgba(255,215,150,${.18 + .4 * glow})`; ctx.fillRect(b.x, b.top, b.w, 1.2);
      const kind = rnd(b.i + 610); ctx.fillStyle = '#15113a';
      if (kind > .8) { ctx.fillRect(b.x + b.w * .2, b.top - 9, b.w * .3, 9); }
      else if (kind < .16) { ctx.beginPath(); ctx.arc(b.x + b.w / 2, b.top, b.w * .26, Math.PI, 0); ctx.fill(); ctx.fillRect(b.x + b.w / 2 - 1, b.top - b.w * .26 - 7, 2, 7); }
      for (let wy = b.top + 10; wy < yP - 4; wy += 13) for (let wx = b.x + 5; wx < b.x + b.w - 7; wx += 11) {
        const k = rnd(wx * .71 + wy * .53 + b.i * 3.1);
        if (k > .62) { const f = .55 + .25 * Math.sin(G * (.6 + k) + k * 30); ctx.fillStyle = k > .93 ? `rgba(255,150,170,${f})` : `rgba(255,205,120,${f})`; ctx.fillRect(wx, wy, 5, 6); }
      }
      if (rnd(b.i + 820) > .55) {
        const nB = Math.max(3, Math.floor(b.w / 7));
        for (let j = 0; j <= nB; j++) {
          const u = j / nB, px = b.x + 2 + u * (b.w - 4), py = b.top + 5 + Math.sin(u * Math.PI) * 5;
          const on = .5 + .5 * Math.sin(G * 4 + j * 1.7 + b.i), col = ['#ffd36e', '#ff7fa3', '#9fe8ff', '#ffb36b'][(j + b.i) % 4];
          ctx.globalAlpha = .45 + .55 * on; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px, py, 1.6, 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
  }
  function diya(c, x, y, s, G, i) {
    // clay bowl
    const g = c.createLinearGradient(0, y - s * .3, 0, y + s * .5); g.addColorStop(0, '#e2793a'); g.addColorStop(1, '#7a2c12');
    c.fillStyle = g; c.beginPath(); c.moveTo(x - s, y - s * .15); c.quadraticCurveTo(x, y + s * .9, x + s, y - s * .15); c.quadraticCurveTo(x + s * 1.25, y - s * .35, x + s * 1.2, y - s * .3); c.closePath(); c.fill();
    c.fillStyle = '#f6b45e'; c.beginPath(); c.ellipse(x, y - s * .15, s, s * .2, 0, 0, TAU); c.fill();
    // flame
    const fl = 1 + .12 * Math.sin(G * 13 + i * 2.1) + .08 * Math.sin(G * 21 + i);
    const fx = x + s * .9, fy = y - s * .35;
    const glow = c.createRadialGradient(fx, fy - s * .5, 1, fx, fy - s * .5, s * 3.2);
    glow.addColorStop(0, 'rgba(255,190,90,.55)'); glow.addColorStop(1, 'rgba(255,160,60,0)');
    c.fillStyle = glow; c.beginPath(); c.arc(fx, fy - s * .5, s * 3.2, 0, TAU); c.fill();
    const fg = c.createLinearGradient(0, fy - s * 1.4 * fl, 0, fy); fg.addColorStop(0, '#fff7c2'); fg.addColorStop(.5, '#ffc23d'); fg.addColorStop(1, '#ff6a1a');
    c.fillStyle = fg; c.beginPath(); c.moveTo(fx, fy - s * 1.35 * fl); c.quadraticCurveTo(fx + s * .42, fy - s * .3, fx, fy); c.quadraticCurveTo(fx - s * .42, fy - s * .3, fx, fy - s * 1.35 * fl); c.fill();
  }
  function drawTerrace(G, glow) {
    const yP = L.yP;
    const g = ctx.createLinearGradient(0, yP, 0, H); g.addColorStop(0, '#120c2c'); g.addColorStop(.25, '#0b0820'); g.addColorStop(1, '#060514');
    ctx.fillStyle = g; ctx.fillRect(0, yP, W, H - yP);
    ctx.fillStyle = `rgba(255,205,130,${.35 + .35 * glow})`; ctx.fillRect(0, yP, W, 1.5);
    // jaali pattern on the wall (subtle)
    ctx.strokeStyle = 'rgba(255,200,120,.06)'; ctx.lineWidth = 1;
    for (let x = 12; x < W; x += 24) { ctx.beginPath(); ctx.arc(x, yP + 22, 7, 0, TAU); ctx.stroke(); }
    const n = Math.max(5, Math.round(W / 62));
    for (let i = 0; i < n; i++) diya(ctx, (i + .5) * W / n - 4, yP - 1, 7, G, i);
  }
  function figure(c, x, fy, h, dir, woman) {
    // simple elegant silhouettes; dir = +1 faces right, -1 faces left
    const X = (u) => x + u * h * dir, Y = (v) => fy - v * h;
    c.beginPath();
    if (woman) {
      c.arc(X(0), Y(.84), h * .062, 0, TAU);                         // head
      c.moveTo(X(-.05), Y(.86)); c.arc(X(-.065), Y(.85), h * .036, 0, TAU); // bun
      // pallu over head and down the back
      c.moveTo(X(.04), Y(.91)); c.quadraticCurveTo(X(-.09), Y(.95), X(-.11), Y(.78)); c.quadraticCurveTo(X(-.17), Y(.5), X(-.2), Y(.3)); c.lineTo(X(-.08), Y(.5)); c.lineTo(X(-.02), Y(.8)); c.closePath();
      // body + saree flare
      c.moveTo(X(-.03), Y(.79)); c.lineTo(X(.04), Y(.79)); c.quadraticCurveTo(X(.11), Y(.74), X(.1), Y(.6)); c.lineTo(X(.09), Y(.46)); c.quadraticCurveTo(X(.17), Y(.2), X(.2), Y(0)); c.lineTo(X(-.19), Y(0)); c.quadraticCurveTo(X(-.15), Y(.25), X(-.1), Y(.46)); c.lineTo(X(-.11), Y(.66)); c.quadraticCurveTo(X(-.1), Y(.77), X(-.03), Y(.79)); c.closePath();
      // arms raised, holding the chhalni
      c.moveTo(X(.05), Y(.74)); c.quadraticCurveTo(X(.16), Y(.66), X(.2), Y(.78)); c.lineTo(X(.18), Y(.8)); c.quadraticCurveTo(X(.13), Y(.71), X(.04), Y(.69)); c.closePath();
    } else {
      c.arc(X(0), Y(.93), h * .066, 0, TAU);
      c.moveTo(X(-.03), Y(.87)); c.lineTo(X(.035), Y(.87)); c.lineTo(X(.03), Y(.84));
      c.quadraticCurveTo(X(.14), Y(.83), X(.15), Y(.72)); c.lineTo(X(.14), Y(.4)); c.lineTo(X(.09), Y(.38)); c.lineTo(X(.08), Y(0)); c.lineTo(X(.01), Y(0)); c.lineTo(X(0), Y(.3)); c.lineTo(X(-.03), Y(0)); c.lineTo(X(-.1), Y(0)); c.lineTo(X(-.1), Y(.38)); c.lineTo(X(-.15), Y(.4)); c.lineTo(X(-.15), Y(.72)); c.quadraticCurveTo(X(-.14), Y(.83), X(-.03), Y(.84)); c.closePath();
      // arm reaching to her
      c.moveTo(X(.1), Y(.78)); c.quadraticCurveTo(X(.22), Y(.62), X(.26), Y(.56)); c.lineTo(X(.24), Y(.53)); c.quadraticCurveTo(X(.17), Y(.6), X(.1), Y(.68)); c.closePath();
    }
    c.fill();
  }
  function drawCouple(G, a) {
    if (a <= 0) return;
    const h = L.ch, fy = L.yP + h * .02, cx = L.cx;
    const rise = (1 - easeOut(a)) * h * .12;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = '#0b0718'; ctx.shadowColor = 'rgba(255,190,120,.85)'; ctx.shadowBlur = 14;
    figure(ctx, cx - h * .2, fy + rise, h * .9, 1, true);
    figure(ctx, cx + h * .19, fy + rise, h, -1, false);
    ctx.shadowBlur = 0;
    // her little chhalni
    drawChhalni(ctx, cx - h * .2 + h * .9 * .225, fy + rise - h * .9 * .8, h * .075, a, 0, G);
    // tiny heart between them
    const hb = 1 + .15 * Math.sin(G * 5);
    ctx.fillStyle = '#ff6f91'; ctx.shadowColor = '#ff6f91'; ctx.shadowBlur = 10;
    shapePath(ctx, cx, fy + rise - h * 1.02, h * .04 * hb, 1); ctx.fill();
    ctx.restore();
  }
  function drawLanterns(t, k) {
    if (k <= 0) return;
    const yP = L.yP;
    for (let i = 0; i < 10; i++) {
      const sp_ = 16 + rnd(i + 31) * 18, s = 7 + rnd(i + 41) * 7;
      const y = yP - 10 - ((rnd(i + 51) * yP * .3 + t * sp_) % (yP + 40));
      const x = rnd(i + 61) * W + Math.sin(t * .7 + i) * 14;
      ctx.globalAlpha = k * clamp(y / 80) * .95;
      const gl = ctx.createRadialGradient(x, y, 1, x, y, s * 3); gl.addColorStop(0, 'rgba(255,170,80,.45)'); gl.addColorStop(1, 'rgba(255,140,60,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, s * 3, 0, TAU); ctx.fill();
      const g = ctx.createLinearGradient(0, y - s, 0, y + s); g.addColorStop(0, '#ffd27a'); g.addColorStop(1, '#ff7a2a');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - s * .55, y - s); ctx.lineTo(x + s * .55, y - s); ctx.lineTo(x + s * .75, y + s * .8); ctx.lineTo(x - s * .75, y + s * .8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.arc(x, y + s * .75, s * .18, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function drawPetals(t, k) {
    if (k <= 0) return;
    for (let i = 0; i < 34; i++) {
      const sp_ = 40 + rnd(i + 81) * 50, s = 5 + rnd(i + 91) * 5;
      const y = -20 + ((rnd(i + 101) * H + t * sp_) % (H + 40));
      const x = rnd(i + 111) * W + Math.sin(t * 1.3 + i * 1.7) * 26;
      const rot = t * (1 + rnd(i) * 2) + i, fl = Math.abs(Math.sin(t * 3 + i));
      ctx.save(); ctx.globalAlpha = k * .9; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(.35 + .65 * fl, 1);
      const g = ctx.createRadialGradient(-s * .3, -s * .3, 1, 0, 0, s * 1.3); g.addColorStop(0, i % 3 ? '#ff6b8b' : '#ffb0c4'); g.addColorStop(1, i % 3 ? '#b3123a' : '#e24e78');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -s); ctx.bezierCurveTo(s, -s * .8, s * .9, s * .6, 0, s); ctx.bezierCurveTo(-s * .9, s * .6, -s, -s * .8, 0, -s); ctx.fill();
      ctx.restore();
    }
  }
  function drawFireworks(t, k) {
    if (k <= 0) return;
    const period = .9;
    const n = Math.floor(t / period);
    for (let j = Math.max(0, n - 2); j <= n; j++) {
      const age = t - j * period; if (age < 0 || age > 2.1) continue;
      const side = j % 2 ? 1 : -1;
      const bx = W / 2 + side * W * (.25 + .14 * rnd(j * 7 + 1));
      const by = L.cb + L.space * (.03 + .24 * rnd(j * 7 + 2));
      const cols = [['#ffd36e', '#fff1b8'], ['#ff7fa3', '#ffd0dc'], ['#9fe8ff', '#e8fbff'], ['#ffb36b', '#ffe0b8']][j % 4];
      if (age < .45) { // rocket
        const q = easeOut(age / .45), y = lerp(L.yP, by, q);
        ctx.globalAlpha = k; ctx.strokeStyle = cols[0]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx, y + 18); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx, y, 2, 0, TAU); ctx.fill();
        continue;
      }
      const a = age - .45, q = easeOut(clamp(a / 1.2)), fade = 1 - clamp(a / 1.6);
      const R = (44 + rnd(j * 7 + 3) * 30) * Math.min(1.35, W / 380);
      for (let i = 0; i < 48; i++) {
        const an = i / 48 * TAU + rnd(j + i) * .1, d = R * q * (.85 + .3 * rnd(i + j * 3));
        const px = bx + Math.cos(an) * d, py = by + Math.sin(an) * d + a * a * 22;
        ctx.globalAlpha = k * fade; ctx.fillStyle = i % 3 ? cols[0] : cols[1];
        ctx.beginPath(); ctx.arc(px, py, 2.3 * (1 - .35 * q) + .5, 0, TAU); ctx.fill();
        ctx.globalAlpha = k * fade * .35; ctx.beginPath(); ctx.arc(bx + Math.cos(an) * d * .8, by + Math.sin(an) * d * .8 + a * a * 18, 1.2, 0, TAU); ctx.fill();
      }
      if (a < .25) { ctx.globalAlpha = k * (1 - a / .25) * .6; const fg = ctx.createRadialGradient(bx, by, 1, bx, by, R); fg.addColorStop(0, cols[1]); fg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(bx, by, R, 0, TAU); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }
  function drawFloaters(G, k) {
    for (let i = 0; i < 26; i++) {
      const sp_ = 12 + rnd(i + 40) * 20, x = rnd(i + 3) * W + Math.sin(G * .6 + i) * 10;
      const y = L.yP - ((rnd(i + 9) * L.yP + G * sp_) % L.yP);
      const tw = .5 + .5 * Math.sin(G * (2 + rnd(i) * 3) + i * 1.7);
      sparkle(x, y, 1.4 + rnd(i + 21) * 3, (.1 + .45 * tw) * k, i % 3 ? '#ffd877' : '#fff1c9');
    }
  }
  function drawBurst(x, y, k, scale, n, seed) {
    if (k <= 0 || k >= 1) return;
    for (let i = 0; i < n; i++) {
      const a = rnd(i + seed) * TAU, d = scale * (.2 + 1.4 * easeOut(k) * (.4 + rnd(i + seed + 100)));
      sparkle(x + Math.cos(a) * d, y + Math.sin(a) * d * .8, 2.5 + rnd(i + seed + 200) * 4.5, (1 - k) * .95, ['#ffd877', '#ff9fb6', '#fff3c9'][i % 3]);
    }
  }

  // ---------- DOM helpers ----------
  const cache = {};
  const setText = (id, v) => { if (cache[id] !== v) { cache[id] = v; $(id).textContent = v; } };
  const setCls = (id, c, on) => { const k = id + '.' + c; if (cache[k] !== on) { cache[k] = on; $(id).classList.toggle(c, on); } };
  const setStyle = (id, p, v) => { const k = id + ':' + p; if (cache[k] !== v) { cache[k] = v; $(id).style[p] = v; } };
  const typed = (s, k) => { const g = graphemes(s); return g.slice(0, Math.round(g.length * clamp(k))).join(''); };

  let p0 = 0; // fasting % when demo started
  function heroFrame() {
    if (!L) layout();
    const G = now();
    const run = S.phase !== 'idle';
    const t = run ? G - S.t0 : 0;
    const fi = fastInfo();
    // ---- card ----
    if (!run) {
      if (fi.after) { setText('cdLbl', '🌙 CHAAND NIKAL AAYA'); setText('cd', '00:00:00'); setCls('cd', 'up', true); }
      else { setText('cdLbl', '🌙 MOONRISE IN'); setText('cd', fmtLeft(fi.c.moon - Date.now())); setCls('cd', 'up', false); }
      setText('cdSub', `${fi.c.name} · moonrise ~${fmt12(fi.c.mr)} · 29 Oct`);
      setStyle('fill', 'width', fi.pct.toFixed(2) + '%'); setText('barPct', Math.floor(fi.pct) + '%');
      setText('barTxt', fi.before ? 'Sargi time 🪔 fast starts at sunrise' : 'Fasting for you since sunrise ❤️');
      setCls('card', 'burst', false);
    } else {
      const left = Math.max(0, 5 * (1 - t / T.CD));
      if (t < T.CD) { const s = Math.floor(left), cs = Math.floor((left - s) * 100); setText('cd', `00:00:0${s}.${pad(cs)}`); setText('cdLbl', '🌙 MOONRISE IN'); setCls('cd', 'up', false); }
      else { setText('cd', '00:00:00'); setText('cdLbl', '🌙 MOON IS UP'); setCls('cd', 'up', true); }
      setText('cdSub', `${S.name === 'my love' ? 'For you' : 'For ' + S.name} · demo moonrise ⚡`);
      const pct = t < T.CD ? lerp(p0, 99, easeInOut(prog(t, 0, T.CD))) : (t < T.FULL ? 99 : 100);
      setStyle('fill', 'width', pct.toFixed(2) + '%'); setText('barPct', Math.floor(pct) + '%');
      setText('barTxt', t >= T.FULL ? 'Fast complete, only for you ❤️' : 'Fasting for you since sunrise ❤️');
      setCls('card', 'burst', t >= T.FULL && t < T.FULL + 1.2);
    }
    // ---- text ----
    setText('l1', run ? typed(LINE1, prog(t, ...T.L1)) : '');
    setText('l2', run ? typed(LINE2, prog(t, ...T.L2)) : '');
    setText('nm', run ? typed(S.name + ' ❤️', prog(t, ...T.NM)) : '');
    setText('l3', run ? typed(LINE3, prog(t, ...T.L3)) : '');
    const done = run && t >= T.DONE;
    setCls('row1', 'hide', run); setCls('row2', 'hide', !done);
    setText('hint', run ? (done ? 'Scroll down for shayari, promises & your wish card ↓' : '🌙 Chaand aa raha hai…') : '⚡ Start = demo moonrise in 5 sec · scroll for more ↓');
    // ---- canvas ----
    if (window.scrollY > H + 50 && !REC) return; // off-screen: skip painting
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const up = run ? easeInOut(prog(t, T.RISE0, T.RISE1)) : 0;
    const glow = up;
    drawSky(G, glow);
    drawLanterns(t - T.LAN0 + 30, run ? prog(t, T.LAN0, T.LAN0 + 1.2) : 0);
    drawFireworks(t - T.FW0, run ? prog(t, T.FW0, T.FW0 + .3) : 0);
    const y0 = L.yP + L.r * 1.3, my = lerp(y0, L.cy, up);
    const k = run ? easeInOut(prog(t, T.M0, T.M1)) : 0;
    if (!run) { // idle: soft glow behind the skyline
      const gl = ctx.createRadialGradient(L.cx, L.yP, 4, L.cx, L.yP, L.r * 2.6); gl.addColorStop(0, `rgba(255,220,150,${.22 + .06 * Math.sin(G * 2)})`); gl.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    } else drawMoon(L.cx, my, L.r, G, up, k);
    drawSkyline(G, glow);
    drawFloaters(G, run ? .4 + .6 * up : .35);
    // chhalni sweep
    if (run && t > T.CH0) {
      const a1 = easeInOut(prog(t, T.CH0, T.CH1));
      const out = easeInOut(prog(t, T.CO0, T.CO1));
      const R = L.r * 1.55;
      const sx = lerp(W + R * 1.3, L.cx, a1), sy = lerp(L.cy + L.space * .25, L.cy, a1) - Math.sin(a1 * Math.PI) * L.r * .8;
      drawChhalni(ctx, sx, sy + out * L.r * .6, R * (1 + .25 * out), (1 - out) * clamp(a1 * 3), (1 - a1) * 1.4 + G * .1, G);
      if (a1 > .98 && t < T.M1 + .3) drawBurst(L.cx, L.cy, prog(t, T.CH1, T.CH1 + .8), L.r * 1.4, 18, 21);
    }
    drawBurst(L.cx, L.cy, run ? prog(t, T.M1 - .1, T.M1 + .9) : 0, L.r * 1.8, 26, 77);
    drawCouple(G, run ? easeOut(prog(t, T.CP0, T.CP1)) : 0);
    drawPetals(t - T.PET0 + 20, run ? prog(t, T.PET0, T.PET0 + 1) : 0);
    drawTerrace(G, glow);
    if (run) { const b = L.bar; drawBurst(b.x + b.w, b.y + b.h / 2, prog(t, T.FULL, T.FULL + .9), 34, 16, 5); }
  }

  function startDemo(name) {
    name = cleanName(name) || 'my love';
    if (BANNED.includes(name.toLowerCase())) name = 'my love';
    S.name = name; $('name').value = name === 'my love' ? '' : name;
    p0 = Math.min(fastInfo().pct, 96);
    S.phase = 'run'; S.t0 = now();
    layout(); updateNameEverywhere(); Music.chime();
  }

  // ===================================================================
  // ⏳ Fasting ring
  // ===================================================================
  let ringShown = 0, ringT0 = -1;
  function ringFrame() {
    if (ringT0 < 0) return;
    const fi = fastInfo(), k = easeOut(prog(now() - ringT0, 0, 1.4));
    const pct = fi.pct * k;
    $('ringArc').style.strokeDashoffset = (527.8 * (1 - pct / 100)).toFixed(1);
    setText('ringPct', Math.round(pct) + '%');
    setText('ringTime', `${hm(fi.fasted * k)} fasted`);
    setText('ringLeft', fi.after ? `Chaand nikal aaya in ${fi.c.name} 🌙` : fi.before ? `Fast starts at sunrise in ${fi.c.name}` : `${hm(fi.left)} to moonrise · ${fi.c.name}`);
    const hv = fi.pct < 30 ? 'Thodi si 🙂' : fi.pct < 70 ? 'Badh rahi 😬' : fi.pct < 100 ? 'Bahut! 😅' : 'Dinner time 🥳';
    setText('hungerV', hv); setStyle('hungerBar', 'width', Math.max(8, fi.pct * k).toFixed(1) + '%');
  }

  // ===================================================================
  // 🪔 Sargi thali (canvas)
  // ===================================================================
  const tc = $('thaliCv'), tx = tc.getContext('2d');
  let TS = 0;
  function thaliResize() { const r = tc.getBoundingClientRect(); const d = Math.min(window.devicePixelRatio || 1, 2); TS = r.width; tc.width = Math.round(r.width * d); tc.height = Math.round(r.width * d); tx.setTransform(d, 0, 0, d, 0, 0); }
  function laddoo(c, x, y, s) {
    const g = c.createRadialGradient(x - s * .35, y - s * .35, 1, x, y, s); g.addColorStop(0, '#ffd27a'); g.addColorStop(.6, '#f39a2b'); g.addColorStop(1, '#b8600f');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,240,200,.55)'; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(x + (rnd(i + x) - .5) * s * 1.2, y + (rnd(i + y) - .5) * s * 1.2, s * .07, 0, TAU); c.fill(); }
  }
  function marigold(c, x, y, s, G) {
    for (let ring = 0; ring < 3; ring++) {
      const rr = s * (1 - ring * .28); c.fillStyle = ['#e8771a', '#f59a1f', '#ffc23d'][ring];
      c.beginPath();
      for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU + ring * .3 + G * .2; const q = rr * (.82 + .18 * (i % 2)); i ? c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q) : c.moveTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
      c.fill();
    }
    c.fillStyle = '#c4570c'; c.beginPath(); c.arc(x, y, s * .16, 0, TAU); c.fill();
  }
  function karwa(c, x, y, s) {
    const g = c.createRadialGradient(x - s * .3, y - s * .1, 2, x, y + s * .1, s * 1.1); g.addColorStop(0, '#e98a4c'); g.addColorStop(1, '#8a3414');
    c.fillStyle = '#7a2c12'; c.beginPath(); c.moveTo(x + s * .6, y - s * .1); c.quadraticCurveTo(x + s * 1.2, y - s * .25, x + s * 1.3, y - s * .7); c.lineTo(x + s * 1.18, y - s * .72); c.quadraticCurveTo(x + s * 1.05, y - s * .4, x + s * .5, y + s * .05); c.fill(); // spout
    c.fillStyle = g; c.beginPath(); c.ellipse(x, y + s * .15, s * .82, s * .72, 0, 0, TAU); c.fill();
    c.fillStyle = '#b5532a'; c.fillRect(x - s * .32, y - s * .75, s * .64, s * .3);
    c.fillStyle = '#d96b35'; c.beginPath(); c.ellipse(x, y - s * .75, s * .42, s * .1, 0, 0, TAU); c.fill();
    c.strokeStyle = '#c4122f'; c.lineWidth = s * .12; c.beginPath(); c.ellipse(x, y + s * .05, s * .8, s * .2, 0, .15, Math.PI - .15); c.stroke();
    c.fillStyle = '#fff3d0'; for (let i = 0; i < 7; i++) { const a = .3 + i * .4; c.beginPath(); c.arc(x + Math.cos(a) * s * .62 - s * .05, y + s * .38 + Math.sin(a) * s * .1, s * .045, 0, TAU); c.fill(); }
    c.fillStyle = '#ffd36e'; c.beginPath(); c.arc(x, y + s * .4, s * .08, 0, TAU); c.fill();
  }
  function sindoor(c, x, y, s) {
    c.fillStyle = '#7a0f1e'; c.beginPath(); c.ellipse(x, y + s * .2, s, s * .55, 0, 0, TAU); c.fill();
    c.fillStyle = '#e01b2f'; c.beginPath(); c.ellipse(x, y, s * .92, s * .48, 0, 0, TAU); c.fill();
    c.fillStyle = '#ff5468'; c.beginPath(); c.ellipse(x - s * .2, y - s * .1, s * .4, s * .16, 0, 0, TAU); c.fill();
    c.strokeStyle = '#ffd36e'; c.lineWidth = s * .12; c.beginPath(); c.ellipse(x, y, s * .95, s * .5, 0, 0, TAU); c.stroke();
  }
  function katli(c, x, y, s) {
    for (let i = 0; i < 3; i++) {
      const ox = x + (i - 1) * s * .9, oy = y + (i % 2) * s * .25;
      c.fillStyle = '#efe3c8'; c.beginPath(); c.moveTo(ox, oy - s * .5); c.lineTo(ox + s * .55, oy); c.lineTo(ox, oy + s * .5); c.lineTo(ox - s * .55, oy); c.closePath(); c.fill();
      c.fillStyle = 'rgba(220,220,235,.9)'; c.beginPath(); c.moveTo(ox, oy - s * .38); c.lineTo(ox + s * .4, oy); c.lineTo(ox, oy + s * .38); c.lineTo(ox - s * .4, oy); c.closePath(); c.fill();
    }
  }
  function coconut(c, x, y, s) {
    const g = c.createRadialGradient(x - s * .3, y - s * .3, 1, x, y, s); g.addColorStop(0, '#9c6a3c'); g.addColorStop(1, '#4a2a12');
    c.fillStyle = g; c.beginPath(); c.ellipse(x, y, s, s * .85, 0, 0, TAU); c.fill();
    c.fillStyle = '#c4122f'; c.fillRect(x - s, y - s * .12, s * 2, s * .24);
    c.fillStyle = '#ffd36e'; c.fillRect(x - s, y - s * .04, s * 2, s * .08);
    c.fillStyle = '#5d3a1a'; c.beginPath(); c.moveTo(x - s * .2, y - s * .8); c.quadraticCurveTo(x, y - s * 1.3, x + s * .3, y - s * 1.2); c.quadraticCurveTo(x + s * .05, y - s * .95, x + s * .15, y - s * .8); c.fill();
  }
  function thaliFrame() {
    if (!TS) return;
    const r = tc.getBoundingClientRect(); if (r.bottom < -40 || r.top > innerHeight + 40) return;
    const G = now(), c = tx, s = TS, cx = s / 2 + Math.cos(G * .9) * s * .012, cy = s / 2 + Math.sin(G * .9) * s * .012;
    c.clearRect(0, 0, s, s);
    const R = s * .44, rot = G * .18;
    // glow
    const gl = c.createRadialGradient(cx, cy, R * .5, cx, cy, s * .5); gl.addColorStop(0, 'rgba(255,190,100,.18)'); gl.addColorStop(1, 'rgba(255,190,100,0)'); c.fillStyle = gl; c.fillRect(0, 0, s, s);
    // plate
    const pg = c.createRadialGradient(cx - R * .3, cy - R * .35, R * .1, cx, cy, R); pg.addColorStop(0, '#fff1bf'); pg.addColorStop(.45, '#f0c35a'); pg.addColorStop(.85, '#b9801f'); pg.addColorStop(1, '#ffd77a');
    c.fillStyle = pg; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
    c.strokeStyle = '#8c5a12'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R * .86, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(255,248,215,.8)'; c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, R * .84, 0, TAU); c.stroke();
    // engraved rim pattern (rotates)
    for (let i = 0; i < 36; i++) { const a = i / 36 * TAU + rot; c.fillStyle = i % 2 ? '#a86d16' : '#fff3c4'; c.beginPath(); c.arc(cx + Math.cos(a) * R * .93, cy + Math.sin(a) * R * .93, R * .025, 0, TAU); c.fill(); }
    // red cloth with gota
    c.fillStyle = '#b3122f'; c.beginPath(); c.arc(cx, cy, R * .78, 0, TAU); c.fill();
    c.strokeStyle = '#ffd36e'; c.lineWidth = R * .03; c.setLineDash([R * .04, R * .03]); c.lineDashOffset = -G * 8; c.beginPath(); c.arc(cx, cy, R * .74, 0, TAU); c.stroke(); c.setLineDash([]);
    // rangoli on cloth
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - rot * .6; c.fillStyle = 'rgba(255,220,150,.35)'; c.beginPath(); c.ellipse(cx + Math.cos(a) * R * .2, cy + Math.sin(a) * R * .2, R * .07, R * .025, a, 0, TAU); c.fill(); }
    // items around (positions rotate, items stay upright)
    const items = [[karwa, .5, .17], [laddoo, .5, .07, 3], [marigold, .52, .075], [sindoor, .5, .07], [katli, .5, .07], [marigold, .52, .07], [coconut, .5, .075], [marigold, .5, .065]];
    items.forEach((it, i) => {
      const a = i / items.length * TAU + rot, x = cx + Math.cos(a) * R * it[1], y = cy + Math.sin(a) * R * it[1];
      c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 6; c.shadowOffsetY = 3;
      if (it[0] === laddoo) { laddoo(c, x - s * .03, y + s * .01, s * it[2] * .55); laddoo(c, x + s * .03, y + s * .01, s * it[2] * .55); laddoo(c, x, y - s * .028, s * it[2] * .55); }
      else if (it[0] === marigold) it[0](c, x, y, s * it[2] * .6, G);
      else it[0](c, x, y, s * it[2] * (it[0] === karwa ? .55 : .6));
      c.restore();
    });
    // rose petals scattered
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + rot + .3, d = R * (.28 + .1 * rnd(i)); c.fillStyle = '#e22d5a'; c.beginPath(); c.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s * .012, s * .02, a + G, 0, TAU); c.fill(); }
    // centre diya (rotating slowly, flame upright)
    c.save(); c.translate(cx, cy); c.rotate(Math.sin(G * .8) * .12); diya(c, -s * .045, s * .02, s * .05, G, 3); c.restore();
    // sparkles
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + G * .4, d = R * (1.02 + .06 * Math.sin(G * 2 + i)); const tw = .5 + .5 * Math.sin(G * 3 + i * 1.3); tx.globalAlpha = tw; tx.fillStyle = '#ffe9a8'; tx.beginPath(); tx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.6, 0, TAU); tx.fill(); }
    tx.globalAlpha = 1;
  }

  // ===================================================================
  // 💫 Shayari carousel
  // ===================================================================
  let carI = 0, carTimer = 0;
  function buildCarousel() {
    $('track').innerHTML = SHAYARI.map((s) => `<div class="slide"><div class="sh"><p>${s[0]}<br>${s[1]}</p><small class="shfor">— for my love</small></div></div>`).join('');
    $('dots').innerHTML = SHAYARI.map((_, i) => `<i data-i="${i}"></i>`).join('');
    $('dots').addEventListener('click', (e) => { const i = e.target.dataset.i; if (i !== undefined) { carGo(+i); carAuto(); } });
    let sx = 0;
    $('car').addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; clearInterval(carTimer); }, { passive: true });
    $('car').addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) carGo(carI + (dx < 0 ? 1 : -1)); carAuto(); });
    carGo(0);
  }
  function carGo(i) { carI = (i + SHAYARI.length) % SHAYARI.length; $('track').style.transform = `translateX(${-carI * 100}%)`; [...$('dots').children].forEach((d, j) => d.classList.toggle('on', j === carI)); }
  function carAuto() { clearInterval(carTimer); if (!REC) carTimer = setInterval(() => carGo(carI + 1), 3400); }

  // ===================================================================
  // 💞 Promise wall
  // ===================================================================
  function buildPromises() {
    $('pgrid').innerHTML = PROMISES.map((p, i) => `<div class="pc reveal" data-i="${i}"><div class="fr"><b>${FRONT[i]}</b><span>PROMISE ${i + 1}</span></div><div class="bk"><i>${p[0]}</i><p>${p[1]}</p></div></div>`).join('');
    [...document.querySelectorAll('.pc')].forEach((el, i) => { el.style.transitionDelay = '0s'; el.addEventListener('click', () => flip(i)); });
    $('revealAll').addEventListener('click', () => { const all = [...document.querySelectorAll('.pc')]; const anyClosed = all.some(e => !e.classList.contains('flip')); all.forEach((e, i) => setTimeout(() => e.classList.toggle('flip', anyClosed), i * 110)); $('revealAll').textContent = anyClosed ? 'Hide all ↺' : 'Reveal all ✨'; if (anyClosed) Music.chime(); });
  }
  function flip(i) { const el = document.querySelectorAll('.pc')[i]; el.classList.toggle('flip'); if (el.classList.contains('flip')) Music.chime(); }

  // ===================================================================
  // 💌 Wish card (canvas → PNG)
  // ===================================================================
  const wc = $('wishCv'), wx = wc.getContext('2d');
  function drawWish() {
    const c = wx, Wc = 1080, Hc = 1350, name = S.name || urlName || 'my love';
    const g = c.createLinearGradient(0, 0, 0, Hc); g.addColorStop(0, '#0f0b33'); g.addColorStop(.55, '#2a0f3e'); g.addColorStop(1, '#4a1532');
    c.fillStyle = g; c.fillRect(0, 0, Wc, Hc);
    for (let i = 0; i < 160; i++) { c.globalAlpha = .25 + .6 * rnd(i + 5); c.fillStyle = rnd(i + 9) > .85 ? '#ffe7b0' : '#fff'; c.beginPath(); c.arc(rnd(i) * Wc, rnd(i + 300) * Hc * .7, 1 + rnd(i + 600) * 2.4, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    // mehendi frame
    c.strokeStyle = '#e9b85f'; c.lineWidth = 5; c.strokeRect(38, 38, Wc - 76, Hc - 76);
    c.lineWidth = 2; c.strokeRect(58, 58, Wc - 116, Hc - 116);
    c.fillStyle = '#e9b85f'; for (let x = 90; x < Wc - 70; x += 34) { c.beginPath(); c.arc(x, 48, 3.2, 0, TAU); c.arc(x, Hc - 48, 3.2, 0, TAU); c.fill(); }
    for (let y = 90; y < Hc - 70; y += 34) { c.beginPath(); c.arc(48, y, 3.2, 0, TAU); c.arc(Wc - 48, y, 3.2, 0, TAU); c.fill(); }
    [[58, 58], [Wc - 58, 58], [58, Hc - 58], [Wc - 58, Hc - 58]].forEach(([x, y]) => {
      c.save(); c.translate(x, y); c.fillStyle = '#2a0f3e'; c.beginPath(); c.arc(0, 0, 44, 0, TAU); c.fill(); c.strokeStyle = '#ffd27a'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 40, 0, TAU); c.stroke();
      for (let i = 0; i < 8; i++) { c.rotate(TAU / 8); c.beginPath(); c.ellipse(0, -22, 7, 15, 0, 0, TAU); c.stroke(); }
      c.fillStyle = '#ffd27a'; c.beginPath(); c.arc(0, 0, 7, 0, TAU); c.fill(); c.restore();
    });
    // chhalni + moon
    const mx_ = 540, my_ = 430, mr = 190;
    const halo = c.createRadialGradient(mx_, my_, mr * .8, mx_, my_, mr * 2.2); halo.addColorStop(0, 'rgba(255,225,160,.5)'); halo.addColorStop(1, 'rgba(255,200,140,0)');
    c.fillStyle = halo; c.beginPath(); c.arc(mx_, my_, mr * 2.2, 0, TAU); c.fill();
    drawChhalni(c, mx_, my_, mr * 1.36, 1, .2, 0);
    const mg = c.createRadialGradient(mx_ - 60, my_ - 60, 20, mx_, my_, mr); mg.addColorStop(0, '#fffdf3'); mg.addColorStop(.7, '#fbedc6'); mg.addColorStop(1, '#e8cd8e');
    c.save(); c.shadowColor = 'rgba(255,220,150,.9)'; c.shadowBlur = 60; c.fillStyle = mg; c.beginPath(); c.arc(mx_, my_, mr, 0, TAU); c.fill(); c.restore();
    if (S.photo) { c.save(); c.beginPath(); c.arc(mx_, my_, mr - 6, 0, TAU); c.clip(); drawPhoto(c, S.photo, mx_, my_, mr); c.restore(); c.strokeStyle = 'rgba(255,240,200,.9)'; c.lineWidth = 6; c.beginPath(); c.arc(mx_, my_, mr - 3, 0, TAU); c.stroke(); }
    else { c.fillStyle = 'rgba(185,150,95,.2)'; [[-.3, -.2, .18], [.25, .1, .24], [-.1, .4, .12], [.36, -.36, .1]].forEach(([dx, dy, q]) => { c.beginPath(); c.arc(mx_ + dx * mr, my_ + dy * mr, q * mr, 0, TAU); c.fill(); }); }
    // text
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    const tg = c.createLinearGradient(0, 720, 0, 850); tg.addColorStop(0, '#fff2c9'); tg.addColorStop(1, '#ffb347');
    let hf = 124; c.font = `${hf}px "Great Vibes", cursive`; while (c.measureText('Happy Karwa Chauth').width > 880) { hf -= 4; c.font = `${hf}px "Great Vibes", cursive`; } c.fillStyle = tg; c.shadowColor = 'rgba(255,170,60,.6)'; c.shadowBlur = 24; c.fillText('Happy Karwa Chauth', 540, 830); c.shadowBlur = 0;
    c.font = '600 46px Poppins, sans-serif'; c.fillStyle = '#ffe9f0'; c.fillText('Tum mera chaand ho,', 540, 935);
    let fs = 104; c.font = `${fs}px "Great Vibes", cursive`; while (c.measureText(name + ' ❤️').width > 880 && fs > 50) { fs -= 4; c.font = `${fs}px "Great Vibes", cursive`; }
    c.fillStyle = '#ffb3c9'; c.shadowColor = 'rgba(255,100,150,.6)'; c.shadowBlur = 20; c.fillText(name + ' ❤️', 540, 1050); c.shadowBlur = 0;
    for (let i = 0; i < 5; i++) diya(c, 300 + i * 120 - 14, 1175, 26, 1.3 + i, i);
    c.font = '600 28px Poppins, sans-serif'; c.fillStyle = 'rgba(255,210,122,.85)'; c.fillText('🌙 29 · 10 · 2026  ·  Made by @hack.n.code', 540, 1272);
  }
  function downloadWish() {
    drawWish();
    const name = (S.name || urlName || 'my-love').replace(/\s+/g, '-');
    wc.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `karwa-chauth-${name}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, 'image/png');
    toast('Wish card saved ✨'); Music.chime();
  }
  function shareURL() { const n = S.name && S.name !== 'my love' ? S.name : ''; return location.origin + location.pathname + (n ? '?name=' + encodeURIComponent(n) : ''); }
  function updateNameEverywhere() {
    const n = S.name || urlName || 'my love';
    document.querySelectorAll('.shfor').forEach(e => e.textContent = `— for ${n} 💛`);
    $('wa').href = 'https://wa.me/?text=' + encodeURIComponent(`🌙 Happy Karwa Chauth, ${n}! Tum mera chaand ho ❤️\nI coded a moonrise for you 👉 ${shareURL()}`);
    drawWish();
  }

  // ===================================================================
  // 🎵 Music — WebAudio synth (tanpura drone + bansuri + soft tabla)
  // ===================================================================
  const Music = {
    ac: null, on: false, timer: 0, nextT: 0, step: 0,
    init() {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      const ac = this.ac = new AC();
      this.master = ac.createGain(); this.master.gain.value = 0; this.master.connect(ac.destination);
      this.bus = ac.createGain(); this.bus.connect(this.master);
      const conv = ac.createConvolver(), len = ac.sampleRate * 2.4, buf = ac.createBuffer(2, len, ac.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
      conv.buffer = buf; const wet = ac.createGain(); wet.gain.value = .35; this.bus.connect(conv); conv.connect(wet); wet.connect(this.master);
      // tanpura-like drone
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 850; lp.connect(this.bus);
      [[146.83, .02], [220, .014], [293.66, .012], [73.42, .02]].forEach(([f, gv], i) => {
        const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = (i - 1.5) * 3; g.gain.value = gv;
        const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = .15 + i * .07; lg.gain.value = gv * .5; lfo.connect(lg); lg.connect(g.gain); lfo.start();
        o.connect(g); g.connect(lp); o.start();
      });
      return true;
    },
    mel: 'A4 - B4 A4 F#4 - E4 - D4 - E4 F#4 A4 - - - B4 - D5 B4 A4 - F#4 - E4 F#4 E4 D4 - - - - F#4 - A4 B4 D5 - B4 A4 B4 - A4 F#4 E4 - - - D4 E4 F#4 A4 B4 A4 F#4 E4 D4 - - - - - - -'.split(' '),
    F: { 'D4': 293.66, 'E4': 329.63, 'F#4': 369.99, 'A4': 440, 'B4': 493.88, 'D5': 587.33, 'E5': 659.25 },
    note(f, t, dur) {
      const ac = this.ac, o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain();
      o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f; g2.gain.value = .25;
      const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 5.2; vg.gain.value = f * .006; vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09, t + .07); g.gain.setValueAtTime(.08, t + Math.max(.08, dur - .12)); g.gain.exponentialRampToValueAtTime(.0005, t + dur + .35);
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(this.bus);
      [o, o2, vib].forEach(x => { x.start(t); x.stop(t + dur + .4); });
    },
    hit(t, low) {
      const ac = this.ac, o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(low ? 120 : 420, t); o.frequency.exponentialRampToValueAtTime(low ? 65 : 300, t + (low ? .18 : .06));
      g.gain.setValueAtTime(low ? .22 : .06, t); g.gain.exponentialRampToValueAtTime(.0005, t + (low ? .35 : .12));
      o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + .4);
    },
    bell(t, f = 2093, v = .03) {
      const ac = this.ac; [f, f * 1.5].forEach((ff, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = ff; g.gain.setValueAtTime(v / (i + 1), t); g.gain.exponentialRampToValueAtTime(.0003, t + 1.2); o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 1.3); });
    },
    sched() {
      const ac = this.ac, e = 60 / 84 / 2;
      while (this.nextT < ac.currentTime + .4) {
        const i = this.step % this.mel.length, n = this.mel[i];
        if (n !== '-') { let d = 1; while (this.mel[(i + d) % this.mel.length] === '-' && d < 8) d++; this.note(this.F[n], this.nextT, d * e); }
        const b = this.step % 8; if (b === 0) this.hit(this.nextT, true); if (b === 3 || b === 6) this.hit(this.nextT, false); if (b === 4) this.hit(this.nextT, true);
        if (this.step % 16 === 0) this.bell(this.nextT);
        this.nextT += e; this.step++;
      }
    },
    start() {
      if (REC) { $('music').textContent = '🔊'; $('music').classList.add('on'); return; }
      if (!this.ac && !this.init()) return;
      this.ac.resume(); const t = this.ac.currentTime;
      this.master.gain.cancelScheduledValues(t); this.master.gain.setTargetAtTime(.6, t, .5);
      this.nextT = Math.max(this.nextT, t + .1); clearInterval(this.timer); this.timer = setInterval(() => this.sched(), 120); this.on = true;
      $('music').textContent = '🔊'; $('music').classList.add('on');
    },
    stop() {
      if (!this.ac) return; const t = this.ac.currentTime; this.master.gain.cancelScheduledValues(t); this.master.gain.setTargetAtTime(0, t, .2);
      clearInterval(this.timer); this.on = false; $('music').textContent = '🔇'; $('music').classList.remove('on');
    },
    chime() { if (this.on && this.ac) { const t = this.ac.currentTime; this.bell(t, 2349, .04); this.bell(t + .12, 2793, .03); } }
  };

  // ===================================================================
  // init + wiring
  // ===================================================================
  function enter() {
    if (sp.classList.contains('out')) return;
    Music.start();
    sp.classList.add('out'); document.body.classList.remove('locked'); window.scrollTo(0, 0);
    setTimeout(() => { spDone = true; }, 900);
    setTimeout(() => { heroResize(); }, 50);
    if (urlName) setTimeout(() => startDemo(urlName), 700);
  }
  function setPhoto(file) {
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => { const img = new Image(); img.onload = () => { S.photo = img; drawWish(); toast('Photo added inside the moon 🌙'); }; img.src = fr.result; };
    fr.readAsDataURL(file);
  }
  async function share() {
    const url = shareURL(), text = `🌙 Happy Karwa Chauth! Tum mera chaand ho ❤️`;
    try { if (navigator.share) { await navigator.share({ title: 'Karwa Chauth Special 🌙', text, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(url); toast('Link copied 💌'); } catch (e) { prompt('Copy this link 💌', url); }
  }
  function replay() { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => startDemo(S.name || $('name').value), 450); }

  function loop() { try { heroFrame(); ringFrame(); thaliFrame(); } catch (e) { console.warn(e); } requestAnimationFrame(loop); }

  function init() {
    // cities
    $('city').innerHTML = CITIES.map((c, i) => `<option value="${i}">${c[0]}</option>`).join('');
    const saved = +(localStorage.getItem('kc_city') || 0); S.city = CITIES[saved] ? saved : 0; $('city').value = S.city;
    $('city').addEventListener('change', (e) => { S.city = +e.target.value; try { localStorage.setItem('kc_city', S.city); } catch (_) {} toast(`Moonrise for ${CITIES[S.city][0]} 🌙`); });
    if (urlName) { $('spFor').textContent = `For ${urlName} ❤️ · a moonrise, coded with love`; $('name').value = urlName; }
    buildCarousel(); buildPromises();
    $('enter').addEventListener('click', enter);
    $('go').addEventListener('click', () => { startDemo($('name').value); });
    $('name').addEventListener('keydown', (e) => { if (e.key === 'Enter') { $('name').blur(); startDemo($('name').value); } });
    $('replay').addEventListener('click', replay); $('replay2').addEventListener('click', replay);
    $('share').addEventListener('click', share);
    $('photoBtn').addEventListener('click', () => $('file').click()); $('photo2').addEventListener('click', () => $('file').click());
    $('file').addEventListener('change', (e) => setPhoto(e.target.files[0]));
    $('dl').addEventListener('click', downloadWish);
    $('music').addEventListener('click', () => { Music.on ? Music.stop() : Music.start(); });
    // reveal on scroll
    const io = new IntersectionObserver((es) => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .2 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    const io2 = new IntersectionObserver((es) => es.forEach(en => { if (en.isIntersecting && ringT0 < 0) { ringT0 = now(); } }), { threshold: .35 });
    io2.observe(document.querySelector('.ringwrap'));
    mand = buildMandala(); spResize();
    heroResize(); thaliResize(); updateNameEverywhere();
    addEventListener('resize', () => { spResize(); heroResize(); thaliResize(); });
    document.fonts && document.fonts.ready.then(() => { layout(); drawWish(); });
    spT0 = now(); requestAnimationFrame(spFrame); requestAnimationFrame(loop);
    carAuto();
    // hooks for the reel recorder
    window.__api = { spRestart: () => { spResize(); spT0 = now(); sp.classList.remove('ready', 'go'); }, enter, startDemo, flip, carGo, ringReset: () => { ringT0 = -1; }, ringStart: () => { ringT0 = now(); }, revealAll: () => $('revealAll').click(), download: () => { drawWish(); toast('Wish card saved ✨'); }, layout, rect: (id) => { const r = $(id).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; } };
    window.__ready = true;
  }
  init();
})();
