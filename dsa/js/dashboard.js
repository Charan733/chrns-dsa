/* CHRNS-DSA — Mastery dashboard + Roadmap renderers.
   Read-only consumers of PROBLEMS / StorageManager / AnalyticsEngine. Every number is derived from real data. */
const Dash = (() => {
  const $ = id => document.getElementById(id);
  const R = 52, C = 2 * Math.PI * R;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const done = () => new Set((StorageManager.getCurrentUser() || {}).completedProblems || []);
  const sections = () => {
    const m = new Map();
    PROBLEMS.forEach(p => { const k = p.a2zSection || p.topic; if (!m.has(k)) m.set(k, { name: k, order: p.a2zSectionOrder || 999, level: p.level, ids: [] }); m.get(k).ids.push(p.id); });
    return [...m.values()].sort((a, b) => a.order - b.order);
  };
  const clean = n => String(n).replace(/^\d+\s*[—-]\s*/, '');
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

  function ring(p, label, sub) {
    return `<div class="ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="ring-bg" cx="60" cy="60" r="${R}"/><circle class="ring-val" cx="60" cy="60" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-off="${C - p / 100 * C}"/></svg>
      <div class="ring-text"><b>${label}</b><span>${sub}</span></div></div>`;
  }

  function render() {
    const host = $('mastery-dashboard'); if (!host || typeof PROBLEMS === 'undefined') return;
    const d = done(), total = PROBLEMS.length, n = PROBLEMS.filter(p => d.has(p.id)).length;
    const diffs = ['Easy', 'Medium', 'Hard'].map(k => { const all = PROBLEMS.filter(p => p.difficulty === k); return { k, t: all.length, c: all.filter(p => d.has(p.id)).length }; });
    let streak = 0; try { streak = AnalyticsEngine.calculateStats(StorageManager.getCurrentUser(), PROBLEMS).currentStreak; } catch (e) {}
    const secs = sections().map(s => ({ ...s, t: s.ids.length, c: s.ids.filter(i => d.has(i)).length }));
    host.innerHTML = `
      <div class="dash-card dash-overall"><h3 class="dash-h">Overall progress</h3>
        ${ring(pct(n, total), pct(n, total) + '%', `${n} / ${total}`)}
        <dl class="dash-kv"><div><dt>Completed</dt><dd>${n}</dd></div><div><dt>Remaining</dt><dd>${total - n}</dd></div><div><dt>Current streak</dt><dd>${streak}<small> days</small></dd></div></dl></div>
      <div class="dash-card dash-diff"><h3 class="dash-h">Difficulty distribution</h3>
        ${diffs.map(x => `<div class="bar-row"><span class="bar-label d-${x.k.toLowerCase()}">${x.k}</span>
          <div class="bar"><i class="d-${x.k.toLowerCase()}" style="--w:${pct(x.c, x.t)}%"></i></div><span class="bar-num">${x.c}<em>/${x.t}</em></span></div>`).join('')}
        <div class="stack" role="img" aria-label="Problem mix by difficulty">${diffs.map(x => `<i class="d-${x.k.toLowerCase()}" style="flex:${x.t}" title="${x.k}: ${x.t}"></i>`).join('')}</div>
        <p class="dash-note">Share of the ${total} problems by difficulty</p></div>
      <div class="dash-card dash-cats"><h3 class="dash-h">Category progress</h3>
        <div class="cat-grid">${secs.map(s => `<button class="cat" data-sec="${esc(s.name)}" title="Open ${esc(clean(s.name))}">
          <span class="cat-top"><span class="cat-name">${esc(clean(s.name))}</span><span class="cat-pct mono">${pct(s.c, s.t)}%</span></span>
          <span class="bar thin"><i style="--w:${pct(s.c, s.t)}%"></i></span><span class="cat-frac mono">${s.c}/${s.t}</span></button>`).join('')}</div></div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => host.querySelectorAll('.ring-val').forEach(c => c.style.strokeDashoffset = c.dataset.off)));
    host.querySelectorAll('.cat').forEach(b => b.onclick = () => openSection(b.dataset.sec));
  }

  function openSection(name) {
    if (UIManager.expandedTopics) UIManager.expandedTopics.add(name);
    UIManager.switchTab('mastery'); UIManager.renderProblemLibrary();
    setTimeout(() => { const t = [...document.querySelectorAll('.topic-card')].find(e => e.dataset.topic === name); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
  }

  function renderRoadmap() {
    const host = $('roadmap-path'); if (!host) return;
    const d = done(); const secs = sections().map(s => ({ ...s, c: s.ids.filter(i => d.has(i)).length, t: s.ids.length }));
    const cur = secs.findIndex(s => s.c < s.t);
    host.innerHTML = secs.map((s, i) => {
      const st = s.c === s.t ? 'complete' : s.c > 0 ? 'active' : (i === cur ? 'next' : 'locked');
      const label = { complete: 'Completed', active: 'In progress', next: 'Up next', locked: 'Not started' }[st];
      return `<li class="rm-node ${st} ${i % 2 ? 'right' : 'left'}" style="--i:${i}">
        <span class="rm-dot mono">${String(i + 1).padStart(2, '0')}</span>
        <button class="rm-card" data-sec="${esc(s.name)}"><span class="rm-state">${label}</span>
          <h3>${esc(clean(s.name))}</h3><span class="rm-meta mono">${s.c}/${s.t} solved${s.level ? ' · ' + esc(s.level) : ''}</span>
          <span class="bar thin"><i style="--w:${pct(s.c, s.t)}%"></i></span></button></li>`; }).join('');
    host.querySelectorAll('.rm-card').forEach(b => b.onclick = () => openSection(b.dataset.sec));
    host.querySelectorAll('.rm-node').forEach(n => io && io.observe(n));
  }
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 }) : null;

  /* Hooks: refresh on progress changes + mark newly completed cards (Level 3 motion) */
  function hook() {
    const rs = UIManager.renderStats.bind(UIManager); UIManager.renderStats = function () { rs(); render(); renderRoadmap(); };
    const rp = UIManager.renderProblemLibrary.bind(UIManager);
    UIManager.renderProblemLibrary = function () {
      const before = done(); rp();
      const now = done();
      document.querySelectorAll('.problem-card.completed').forEach(c => { if (!before.has(c.dataset.id) && now.has(c.dataset.id)) { c.classList.add('just-completed'); setTimeout(() => c.classList.remove('just-completed'), 900); } });
    };
    const rc = UIManager.toggleProblemCompletion.bind(UIManager);
    UIManager.toggleProblemCompletion = function (id) { const before = done(); rc(id); const after = done();
      if (!before.has(id) && after.has(id)) requestAnimationFrame(() => { const c = document.querySelector(`.problem-card[data-id="${CSS.escape(id)}"]`); if (c) { c.classList.add('just-completed'); setTimeout(() => c.classList.remove('just-completed'), 900); } }); };
    render(); renderRoadmap();
  }
  return { hook, render, renderRoadmap };
})();
