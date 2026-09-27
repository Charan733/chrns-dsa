/* CHRNS-DSA unified motion system — replaces SplashCursor.js + rocket.js.
   One rAF loop max (hero graph), paused off-screen / tab hidden. Touch + reduced-motion aware. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const small = innerWidth < 768;

  /* L3/L2: scroll reveal (staggered) */
  const revealSel = '.summary-cards-grid > *, .stats-grid > *, .potd-container-card, .codecal-stats > *, .topics-accordion-list > *';
  const io = 'IntersectionObserver' in window && !reduce ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 }) : null;
  const applyReveal = () => document.querySelectorAll(revealSel).forEach((el, i) => {
    if (el.dataset.rv) return; el.dataset.rv = 1;
    if (!io) return; el.classList.add('reveal'); el.style.setProperty('--d', (i % 6) * 60 + 'ms'); io.observe(el); });
  applyReveal();
  new MutationObserver(() => applyReveal()).observe(document.body, { childList: true, subtree: true });

  if (reduce) return;

  /* L2: single cursor system = spotlight + card tilt + magnetic CTAs (desktop only) */
  if (fine) {
    const sp = document.createElement('div'); sp.className = 'spotlight'; sp.setAttribute('aria-hidden', 'true'); document.body.prepend(sp);
    let raf = 0, px = 0, py = 0;
    addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; sp.classList.add('on'); sp.style.setProperty('--mx', px + 'px'); sp.style.setProperty('--my', py + 'px'); }); }, { passive: true });
    document.addEventListener('pointerleave', () => sp.classList.remove('on'));
    const cardSel = '.summary-card, .stat-card, .potd-container-card, .topic-card, .orbital-item';
    document.addEventListener('pointermove', e => {
      const c = e.target.closest && e.target.closest(cardSel); if (!c) return;
      // An expanded .topic-card holds a full grid of problem rows; tilting the whole
      // panel would shift small controls (checkboxes, star buttons) enough to miss
      // clicks near its edges, so only tilt cards while they're compact/collapsed.
      if (c.classList.contains('topic-card') && c.classList.contains('open')) return;
      c.classList.add('tilt'); const r = c.getBoundingClientRect();
      c.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 5 + 'deg');
      c.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 5 + 'deg'); }, { passive: true });
    document.addEventListener('pointerout', e => { const c = e.target.closest && e.target.closest(cardSel);
      if (c && !c.contains(e.relatedTarget)) { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); } });

    // If a card is tilted and then expands into an open accordion panel, clear the
    // tilt immediately rather than waiting for the next pointermove to catch it.
    new MutationObserver(muts => muts.forEach(m => { const el = m.target;
      if (el.classList.contains('topic-card') && el.classList.contains('open') && el.classList.contains('tilt')) {
        el.classList.remove('tilt'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); }
    })).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
    document.querySelectorAll('.hero-btns-stack button, .hero-btns-stack a').forEach(b => { b.classList.add('magnetic');
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .12}px,${(e.clientY - r.top - r.height / 2) * .18}px)`; });
      b.addEventListener('pointerleave', () => b.style.transform = ''); });
  }

  /* L4: hero DSA knowledge graph (Canvas 2D, pseudo-3D depth). Replaces rocket + text streams. */
  const host = document.querySelector('.dsa-running-bg'); if (!host) return;
  const cv = document.createElement('canvas'); cv.id = 'hero-network'; cv.setAttribute('aria-hidden', 'true'); host.appendChild(cv);
  const ctx = cv.getContext('2d'), N = small ? 22 : 46, dpr = Math.min(devicePixelRatio || 1, 2);
  const labels = ['O(n)', 'O(log n)', 'BFS', 'DFS', 'DP', 'heap', 'trie', 'O(1)', 'graph', 'tree'];
  let W, H, mx = 0, my = 0, run = true, vis = true, nodes = [];
  const size = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener('resize', size);
  nodes = Array.from({ length: N }, (_, i) => ({ x: Math.random(), y: Math.random(), z: Math.random(), vx: (Math.random() - .5) * 1e-4, vy: (Math.random() - .5) * 1e-4, l: i % 6 === 0 ? labels[i % labels.length] : '' }));
  if (fine) addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  const light = () => document.body.classList.contains('light-theme');
  function frame() {
    if (!run || !vis) return;
    ctx.clearRect(0, 0, W, H);
    const rgb = light() ? '8,145,178' : '129,140,248', dot = light() ? '8,145,178' : '34,211,238';
    const P = nodes.map(n => { n.x = (n.x + n.vx + 1) % 1; n.y = (n.y + n.vy + 1) % 1;
      const d = .35 + n.z * .65; return { x: n.x * W - mx * 40 * n.z, y: n.y * H - my * 30 * n.z, d, l: n.l }; });
    ctx.lineWidth = 1;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const dx = P[i].x - P[j].x, dy = P[i].y - P[j].y, dist = dx * dx + dy * dy, max = (small ? 130 : 170) ** 2;
      if (dist < max) { ctx.strokeStyle = `rgba(${rgb},${(1 - dist / max) * .28 * Math.min(P[i].d, P[j].d)})`; ctx.beginPath(); ctx.moveTo(P[i].x, P[i].y); ctx.lineTo(P[j].x, P[j].y); ctx.stroke(); } }
    ctx.font = '11px "JetBrains Mono", monospace';
    P.forEach(p => { ctx.fillStyle = `rgba(${dot},${.25 + p.d * .45})`; ctx.beginPath(); ctx.arc(p.x, p.y, 1.5 + p.d * 2.2, 0, 6.283); ctx.fill();
      if (p.l) { ctx.fillStyle = `rgba(${rgb},${.35 * p.d})`; ctx.fillText(p.l, p.x + 8, p.y - 6); } });
    requestAnimationFrame(frame);
  }
  new IntersectionObserver(([e]) => { const was = vis; vis = e.isIntersecting; if (vis && !was) frame(); }).observe(cv);
  document.addEventListener('visibilitychange', () => { run = !document.hidden; if (run) frame(); });
  frame();
})();
