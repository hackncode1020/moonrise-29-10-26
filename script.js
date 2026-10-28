// 🌙 Moonrise Tracker — Karwa Chauth Mode ON. Made by @hack.n.code
(() => {
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const CAPTURE = params.has('capture');
  const cv = $('sky'), ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1, L = null;

  // ---------- timeline (seconds after Start) ----------
  // the demo countdown runs "00:00:05" down fast, then the moon rises
  const T = { CD: 3.6, BAR0: 3.6, BAR1: 4.1, MOON0: 3.6, MOON1: 5.6, L1_0: 5.4, L1_1: 6.6, L2_0: 6.7, L2_1: 8.3, L3_0: 8.3, L3_1: 8.9, DONE: 9.0 };
  const LINE1 = 'Chaand nikal aaya 🌙';
  const LINE2 = 'Tum mera chaand ho,';

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const easeInOut = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const rnd = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const graphemes = (s) => (window.Intl && Intl.Segmenter) ? [...new Intl.Segmenter().segment(s)].map(x => x.segment) : Array.from(s);
  const pad = (n) => String(n).padStart(2, '0');

  const S = { phase: 'idle', t: 0, G: 0, name: '', start: 0 };

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    layout();
  }

  function layout() {
    const c = $('card').getBoundingClientRect(), m = $('msg').getBoundingClientRect();
    const b = $('fill').parentElement.getBoundingClientRect();
    const gap = Math.max(40, m.top - c.bottom);
    const cy = c.bottom + gap / 2;
    const r = Math.max(26, Math.min(W * 0.15, gap * 0.31, 82));
    // skyline: two contiguous layers of buildings
    const far = [], near = [];
    let x = -10, i = 0;
    while (x < W + 10) { const w = 30 + rnd(i + 50) * 46; far.push({ x, w, top: H * (0.66 + rnd(i + 70) * 0.12), i }); x += w; i++; }
    x = -6; i = 0;
    while (x < W + 10) { const w = 26 + rnd(i + 150) * 40; near.push({ x, w, top: H * (0.74 + rnd(i + 170) * 0.11), i }); x += w + 1; i++; }
    L = { cx: W / 2, cy, r, bar: { x: b.left, y: b.top, w: b.width, h: b.height }, card: c, far, near, lowest: H * 0.86 };
  }

  // ---------- painters ----------
  function drawSky(G, glow) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#04061a'); g.addColorStop(0.5, '#0d0f36'); g.addColorStop(0.78, '#231546'); g.addColorStop(1, '#3a1d4a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const hg = ctx.createRadialGradient(W / 2, H * 0.86, 10, W / 2, H * 0.86, H * 0.55);
    hg.addColorStop(0, `rgba(255,190,110,${0.10 + 0.32 * glow})`); hg.addColorStop(1, 'rgba(255,170,90,0)');
    ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);
    const n = Math.round(W * H / 2400);
    for (let i = 0; i < n; i++) {
      const x = rnd(i) * W, y = rnd(i + 500) * H * 0.75;
      const tw = 0.45 + 0.55 * Math.sin(G * (1.1 + rnd(i + 900) * 2.4) + i);
      ctx.globalAlpha = clamp(0.2 + 0.6 * tw); ctx.fillStyle = rnd(i + 77) > 0.86 ? '#ffe7b0' : '#ffffff';
      ctx.beginPath(); ctx.arc(x, y, 0.5 + rnd(i + 1300) * 1.3, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function sparkle(x, y, s, a, col) {
    ctx.globalAlpha = clamp(a); ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s);
    ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawMoon(x, y, r, G, up) {
    ctx.save();
    const pulse = 1 + 0.05 * Math.sin(G * 1.8) * up;
    const halo = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * (2.4 + 0.9 * up) * pulse);
    halo.addColorStop(0, 'rgba(255,232,170,0.55)'); halo.addColorStop(0.45, 'rgba(255,214,140,0.16)'); halo.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, r * (2.4 + 0.9 * up) * pulse, 0, 6.283); ctx.fill();
    const mg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    mg.addColorStop(0, '#fffdf3'); mg.addColorStop(0.68, '#fbedc6'); mg.addColorStop(1, '#e8cd8e');
    ctx.fillStyle = mg; ctx.shadowColor = 'rgba(255,220,150,0.9)'; ctx.shadowBlur = r * 0.6;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(185,150,95,0.20)';
    [[-0.3, -0.2, 0.18], [0.25, 0.1, 0.24], [-0.1, 0.4, 0.12], [0.36, -0.36, 0.1], [-0.44, 0.18, 0.09], [0.05, -0.5, 0.07]].forEach(([dx, dy, rr]) => {
      ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, rr * r, 0, 6.283); ctx.fill();
    });
    ctx.restore();
  }

  function drawSkyline(G, glow) {
    // far layer
    for (const b of L.far) {
      const g = ctx.createLinearGradient(0, b.top, 0, H);
      g.addColorStop(0, '#2a2156'); g.addColorStop(1, '#1a1440');
      ctx.fillStyle = g; ctx.fillRect(b.x, b.top, b.w + 1, H - b.top);
      if (rnd(b.i + 400) > 0.6) { ctx.fillRect(b.x + b.w * 0.45, b.top - 14, 2, 14); }
      for (let wy = b.top + 10; wy < H; wy += 13) for (let wx = b.x + 6; wx < b.x + b.w - 6; wx += 10) {
        const k = rnd(wx * 0.37 + wy * 1.31 + b.i);
        if (k > 0.78) { ctx.fillStyle = `rgba(255,214,140,${0.25 + 0.15 * Math.sin(G * 0.7 + k * 40)})`; ctx.fillRect(wx, wy, 4, 6); }
      }
    }
    // rim light from the moon
    const rl = ctx.createLinearGradient(0, H * 0.6, 0, H); rl.addColorStop(0, 'rgba(255,210,150,0)'); rl.addColorStop(1, `rgba(255,190,140,${0.06 + 0.1 * glow})`);
    ctx.fillStyle = rl; ctx.fillRect(0, H * 0.6, W, H * 0.4);
    // near layer
    for (const b of L.near) {
      const g = ctx.createLinearGradient(0, b.top, 0, H);
      g.addColorStop(0, '#120f2e'); g.addColorStop(1, '#07061a');
      ctx.fillStyle = g; ctx.fillRect(b.x, b.top, b.w, H - b.top);
      ctx.fillStyle = `rgba(255,215,150,${0.18 + 0.4 * glow})`; ctx.fillRect(b.x, b.top, b.w, 1.2);
      const kind = rnd(b.i + 610);
      ctx.fillStyle = '#120f2e';
      if (kind > 0.78) { // water tank
        ctx.fillRect(b.x + b.w * 0.2, b.top - 10, b.w * 0.32, 10); ctx.fillRect(b.x + b.w * 0.24, b.top - 13, b.w * 0.24, 3);
      } else if (kind < 0.16) { // little dome
        ctx.beginPath(); ctx.arc(b.x + b.w / 2, b.top, b.w * 0.26, Math.PI, 0); ctx.fill();
        ctx.fillRect(b.x + b.w / 2 - 1, b.top - b.w * 0.26 - 8, 2, 8);
      }
      for (let wy = b.top + 12; wy < H - 4; wy += 15) for (let wx = b.x + 5; wx < b.x + b.w - 7; wx += 11) {
        const k = rnd(wx * 0.71 + wy * 0.53 + b.i * 3.1);
        if (k > 0.62) {
          const f = 0.55 + 0.25 * Math.sin(G * (0.6 + k) + k * 30);
          ctx.fillStyle = k > 0.93 ? `rgba(255,150,170,${f})` : `rgba(255,205,120,${f})`;
          ctx.fillRect(wx, wy, 5, 7);
        }
      }
      // festive string lights on some roofs
      if (rnd(b.i + 820) > 0.55) {
        const nB = Math.max(3, Math.floor(b.w / 7));
        for (let j = 0; j <= nB; j++) {
          const u = j / nB, px = b.x + 2 + u * (b.w - 4), py = b.top + 5 + Math.sin(u * Math.PI) * 5;
          const on = 0.5 + 0.5 * Math.sin(G * 4 + j * 1.7 + b.i);
          const col = ['#ffd36e', '#ff7fa3', '#9fe8ff', '#ffb36b'][(j + b.i) % 4];
          ctx.globalAlpha = 0.45 + 0.55 * on; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 6;
          ctx.beginPath(); ctx.arc(px, py, 1.6, 0, 6.283); ctx.fill();
        }
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      }
    }
  }

  function drawBurst(x, y, k, scale, n, seed) {
    if (k <= 0 || k >= 1) return;
    for (let i = 0; i < n; i++) {
      const a = rnd(i + seed) * 6.283, d = scale * (0.2 + 1.4 * easeOut(k) * (0.4 + rnd(i + seed + 100)));
      sparkle(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, 2.5 + rnd(i + seed + 200) * 4.5, (1 - k) * 0.95, ['#ffd877', '#ff9fb6', '#fff3c9'][i % 3]);
    }
  }

  function drawFloaters(G, k) {
    if (k <= 0) return;
    for (let i = 0; i < 26; i++) {
      const sp = 12 + rnd(i + 40) * 20;
      const x = rnd(i + 3) * W + Math.sin(G * 0.6 + i) * 10;
      const y = H * 0.9 - ((rnd(i + 9) * H * 0.9 + G * sp) % (H * 0.9));
      const tw = 0.5 + 0.5 * Math.sin(G * (2 + rnd(i) * 3) + i * 1.7);
      sparkle(x, y, 1.5 + rnd(i + 21) * 3, (0.15 + 0.5 * tw) * k, i % 3 ? '#ffd877' : '#fff1c9');
    }
  }

  // ---------- one frame ----------
  const cache = {};
  function setText(id, v) { if (cache[id] !== v) { cache[id] = v; $(id).textContent = v; } }
  function setCls(id, c, on) { const k = id + '.' + c; if (cache[k] !== on) { cache[k] = on; $(id).classList.toggle(c, on); } }
  function setStyle(id, p, v) { const k = id + ':' + p; if (cache[k] !== v) { cache[k] = v; $(id).style[p] = v; } }

  function paint() {
    if (!L) layout();
    const { phase, G } = S;
    const started = phase !== 'idle';
    const t = started ? S.t : 0;
    const rise = easeInOut(prog(t, T.MOON0, T.MOON1));
    const glow = started ? clamp(0.25 * prog(t, 0, T.CD) + 0.75 * rise) : 0.1;
    drawSky(G, glow);
    drawFloaters(G, rise);
    if (started && t > T.MOON0) {
      const y0 = L.lowest + L.r * 1.25;
      drawMoon(L.cx, y0 + (L.cy - y0) * rise, L.r * (0.9 + 0.1 * rise), G, rise);
    }
    drawSkyline(G, glow);
    // glow burst when the fast hits 100%
    const bk = prog(t, T.BAR1, T.BAR1 + 1.1);
    if (started && bk > 0 && bk < 1) {
      const bx = L.bar.x + L.bar.w, by = L.bar.y + L.bar.h / 2;
      const fl = ctx.createRadialGradient(bx, by, 2, bx, by, 140);
      fl.addColorStop(0, `rgba(255,200,120,${0.55 * (1 - bk)})`); fl.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = fl; ctx.fillRect(bx - 150, by - 150, 300, 300);
      drawBurst(bx - 10, by, bk, 120, 30, 2000);
    }
    drawBurst(L.cx, L.cy, prog(t, T.MOON1 - 0.2, T.MOON1 + 1.2), L.r * 1.6, 34, 3000);

    // ---- tracker card ----
    const cdk = started ? prog(t, 0, T.CD) : 0;
    const rem = Math.max(0, 5 * (1 - cdk));
    const sec = Math.floor(rem + 1e-6), cs = Math.floor((rem - sec) * 100 + 1e-6);
    setText('cd', '00:00:' + pad(sec)); 
    if (!$('cd').firstElementChild || cache.cs !== cs) { cache.cs = cs; let sm = $('cd').querySelector('small'); if (!sm) { sm = document.createElement('small'); $('cd').appendChild(sm); } sm.textContent = '.' + pad(cs); }
    const up = started && t >= T.CD;
    setCls('cd', 'gold', up);
    setText('lbl', up ? '🌙 MOON IS UP' : '🌙 MOONRISE IN');
    const pct = started ? 99 + prog(t, T.BAR0, T.BAR1) : 99;
    setStyle('fill', 'width', pct.toFixed(2) + '%');
    const pk = started ? prog(t, T.BAR1 - 0.1, T.BAR1 + 0.5) * (1 - 0.5 * prog(t, T.BAR1 + 0.5, T.BAR1 + 1.8)) : 0;
    setStyle('fill', 'boxShadow', `0 0 ${12 + 26 * pk}px rgba(255,${150 + 60 * pk | 0},120,${0.6 + 0.4 * pk})`);
    setText('pct', Math.floor(pct + 1e-6) + '%');
    setText('fl', pct >= 100 ? 'Fast complete, only for you ❤️' : 'Fasting for you since sunrise ❤️');
    setStyle('card', 'boxShadow', up ? `0 10px 40px rgba(0,0,0,.45), 0 0 ${30 * pk + 18}px rgba(255,190,110,${0.15 + 0.35 * pk})` : '');

    // ---- text ----
    const nm = (S.name || '').trim() || 'my love';
    const g1 = graphemes(LINE1), n1 = Math.round(g1.length * prog(t, T.L1_0, T.L1_1));
    const full2 = graphemes(LINE2 + '\u0001' + nm + ' ❤️');
    const n2 = Math.round(full2.length * prog(t, T.L2_0, T.L2_1));
    const shown2 = full2.slice(0, n2).join('').split('\u0001');
    setText('l1', started ? g1.slice(0, n1).join('') : '');
    setText('l2a', started ? shown2[0] : '');
    setText('nm', started && shown2.length > 1 ? shown2[1] : '');
    setCls('l1', 'caret', started && t > T.L1_0 - 0.15 && t < T.L1_1 + 0.1);
    const onNm = shown2.length > 1;
    setCls('l2a', 'caret', started && !onNm && t > T.L2_0 - 0.1 && t < T.L2_1);
    setCls('nm', 'caret', started && onNm && t < T.L2_1 + 0.25);
    const l3 = started ? easeOut(prog(t, T.L3_0, T.L3_1)) : 0;
    setStyle('l3', 'opacity', l3.toFixed(3)); setStyle('l3', 'transform', `translateY(${(1 - l3) * 10}px)`);
    document.body.classList.toggle('running', phase === 'run');
    document.body.classList.toggle('done', phase === 'done');
  }

  // ---------- live loop ----------
  const t0 = performance.now();
  function loop(now) {
    S.G = (now - t0) / 1000;
    if (S.phase !== 'idle') { S.t = (now - S.start) / 1000; if (S.phase === 'run' && S.t >= T.DONE) S.phase = 'done'; }
    paint(); requestAnimationFrame(loop);
  }
  function run() { S.phase = 'run'; S.start = performance.now(); S.t = 0; }
  function start() {
    S.name = $('name').value.trim().slice(0, 18);
    const u = new URL(location.href); if (S.name) u.searchParams.set('name', S.name); else u.searchParams.delete('name');
    history.replaceState(null, '', u);
    $('name').blur(); run();
  }
  function toast(m) { const d = document.createElement('div'); d.id = 'toast'; d.textContent = m; document.body.appendChild(d); setTimeout(() => d.remove(), 2200); }
  async function share() {
    const u = new URL(location.origin + location.pathname); const n = (S.name || $('name').value).trim(); if (n) u.searchParams.set('name', n);
    const data = { title: 'Moonrise Tracker 🌙', text: 'Karwa Chauth Mode ON 🌙 Open this, the moon is coming 👇', url: u.toString() };
    try { if (navigator.share) { await navigator.share(data); return; } } catch (e) { return; }
    try { await navigator.clipboard.writeText(data.text + ' ' + data.url); toast('Link copied 💌'); } catch (e) { prompt('Copy this link', data.url); }
  }
  $('go').addEventListener('click', start);
  $('name').addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
  $('replay').addEventListener('click', run);
  $('share').addEventListener('click', share);
  window.addEventListener('resize', resize);

  // ---------- capture hooks (the reel is recorded frame by frame) ----------
  window.__render = (st) => {
    Object.assign(S, st);
    if ('typed' in st) $('name').value = st.typed;
    $('go').classList.toggle('press', !!st.press);
    $('name').classList.toggle('caret', !!st.caret);
    $('name').classList.toggle('focus', !!st.focus);
    paint();
  };
  window.__rect = (id) => { const r = $(id).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  window.__T = T;

  const pn = (params.get('name') || '').slice(0, 18);
  if (pn) $('name').value = pn;
  const boot = () => { resize(); paint(); };
  if (CAPTURE) { document.body.classList.add('cap'); document.fonts.ready.then(() => { boot(); setTimeout(() => { layout(); paint(); window.__ready = true; }, 300); }); }
  else {
    boot(); document.fonts && document.fonts.ready.then(layout);
    requestAnimationFrame(loop);
    if (pn) { S.name = pn; setTimeout(run, 800); }
  }
})();
