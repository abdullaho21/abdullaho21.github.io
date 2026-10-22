/* Gravity Rush panel: a procedural floating-island wireframe. An illustration, not game data. */
(() => {
  const canvas = document.getElementById("mesh");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = name => getComputedStyle(root).getPropertyValue(name).trim();

  const R = 11, top = [], bot = [], key = (i, j) => `${i},${j}`, idxTop = new Map(), idxBot = new Map();
  for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) {
    const r = Math.hypot(i, j) / R; if (r > 1) continue;
    const fall = 1 - r * r;
    const hgt = (Math.sin(i * .55) * Math.cos(j * .48) * .7 + Math.sin((i + j) * .31) * .45) * fall * 1.7 + fall * 1.4;
    idxTop.set(key(i, j), top.push([i, hgt, j]) - 1);
    const depth = -(Math.pow(1 - r, 1.3) * 8.5) - Math.abs(Math.sin(i * 1.7 + j * 2.3)) * (1 - r) * 1.6;
    idxBot.set(key(i, j), bot.push([i, depth, j]) - 1);
  }
  const edges = [];
  for (const [k, a] of idxTop) {
    const [i, j] = k.split(",").map(Number);
    const b = idxTop.get(key(i + 1, j)), c = idxTop.get(key(i, j + 1));
    if (b !== undefined) edges.push([0, a, b]); if (c !== undefined) edges.push([0, a, c]);
  }
  for (const [k, a] of idxBot) {
    const [i, j] = k.split(",").map(Number); if ((i + j) % 2) continue;
    const b = idxBot.get(key(i + 2, j)), c = idxBot.get(key(i, j + 2));
    if (b !== undefined) edges.push([1, a, b]); if (c !== undefined) edges.push([1, a, c]);
  }
  const motes = Array.from({ length: 24 }, (_, n) => [Math.sin(n * 12.9) * 14, Math.cos(n * 7.3) * 9, Math.sin(n * 3.1) * 14, (n * .37) % 1]);

  let w = 0, h = 0, visible = true, raf = 0;
  const t0 = performance.now();
  const centerY = parseFloat(canvas.dataset.center || ".3");
  const size = () => {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const draw = t => {
    ctx.clearRect(0, 0, w, h);
    const fg = css("--fg"), accent = css("--accent");
    const a = t * .16 + .6, tilt = .42, ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(tilt), st = Math.sin(tilt);
    const scale = Math.min(w / 30, h / 30), cx = w / 2, cy = h * centerY + Math.sin(t * .8) * 5;
    const proj = ([x, y, z]) => {
      const x1 = x * ca - z * sa, z1 = x * sa + z * ca;
      const y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
      const p = 34 / (34 + z2);
      return [cx + x1 * scale * p, cy - y2 * scale * p, z2];
    };
    const P = [top.map(proj), bot.map(proj)];
    ctx.lineWidth = 1;
    for (const [s, ia, ib] of edges) {
      const p = P[s][ia], q = P[s][ib];
      const depth = Math.max(0, Math.min(1, .55 - (p[2] + q[2]) / 40));
      ctx.strokeStyle = s === 0 ? accent : fg;
      ctx.globalAlpha = (s === 0 ? .16 : .06) + depth * (s === 0 ? .45 : .14);
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
    }
    ctx.fillStyle = fg;
    motes.forEach(([x, y, z, ph]) => {
      const yy = ((y + (t * .9 + ph * 20)) % 20) - 8;
      const [sx, sy, sz] = proj([x, yy, z]);
      ctx.globalAlpha = .2 + Math.max(0, .3 - sz / 60);
      ctx.beginPath(); ctx.arc(sx, sy, 1.2, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  };
  const frame = now => { draw((now - t0) / 1000); if (!reduce && visible) raf = requestAnimationFrame(frame); };
  const redraw = () => { cancelAnimationFrame(raf); frame(performance.now()); };
  size();
  if ("ResizeObserver" in window) new ResizeObserver(() => { size(); redraw(); }).observe(canvas);
  if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) redraw(); else cancelAnimationFrame(raf); }).observe(canvas);
  window.siteTheme?.onChange(redraw);
  redraw();
})();
