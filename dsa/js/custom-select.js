/* CHRNS-DSA — custom animated dropdown.
   Wraps every <select class="select-dropdown"> with a styled button + animated
   option panel. The real <select> stays in the DOM and is the single source of
   truth: filters.js / ui.js keep reading `.value` and listening for "change" on
   it exactly as before — this file only mirrors it visually and forwards clicks
   back onto it, so no filter logic changes at all.
   Rebuilds a menu automatically if its <select> gets new <option>s at runtime
   (topic-select is regenerated from PROBLEMS after login). */
(() => {
  function enhance(select) {
    if (select.dataset.enhanced) return;
    select.dataset.enhanced = '1';

    const wrap = document.createElement('div');
    wrap.className = 'csel';
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'csel-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    const label = document.createElement('span');
    label.className = 'csel-label';
    btn.appendChild(label);
    btn.insertAdjacentHTML('beforeend', '<svg class="csel-arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>');

    const panel = document.createElement('div');
    panel.className = 'csel-panel';
    panel.setAttribute('role', 'listbox');

    wrap.appendChild(btn);
    wrap.appendChild(panel);

    function buildOptions() {
      panel.innerHTML = '';
      [...select.options].forEach(opt => {
        const row = document.createElement('div');
        row.className = 'csel-opt' + (opt.value === select.value ? ' active' : '');
        row.setAttribute('role', 'option');
        row.dataset.value = opt.value;
        row.textContent = opt.textContent;
        row.addEventListener('click', () => {
          if (select.value !== opt.value) {
            select.value = opt.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
          syncLabel();
          close();
        });
        panel.appendChild(row);
      });
    }

    function syncLabel() {
      const sel = select.options[select.selectedIndex];
      label.textContent = sel ? sel.textContent : '';
      panel.querySelectorAll('.csel-opt').forEach(r => r.classList.toggle('active', r.dataset.value === select.value));
    }

    function open() {
      document.querySelectorAll('.csel.open').forEach(o => { if (o !== wrap) o.classList.remove('open'); });
      wrap.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
    }
    function close() { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }

    btn.addEventListener('click', () => wrap.classList.contains('open') ? close() : open());
    btn.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const opts = [...select.options]; let i = select.selectedIndex;
        i = e.key === 'ArrowDown' ? Math.min(i + 1, opts.length - 1) : Math.max(i - 1, 0);
        select.value = opts[i].value; select.dispatchEvent(new Event('change', { bubbles: true })); syncLabel();
      }
    });
    document.addEventListener('pointerdown', e => { if (!wrap.contains(e.target)) close(); });

    new MutationObserver(() => { buildOptions(); syncLabel(); }).observe(select, { childList: true });
    buildOptions(); syncLabel();
  }

  function run() { document.querySelectorAll('select.select-dropdown').forEach(enhance); }
  run();
  new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
})();
