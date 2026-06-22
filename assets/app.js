/* Shared helpers for the InternX activity-registration handoff mockup.
   Pure vanilla JS, no build step. Each page wires its own mockup on top. */

/* ---- formatting ---- */
const NT = (n) => n === 0 ? '免費' : 'NT$ ' + Number(n).toLocaleString('en-US');
const pad = (n) => String(n).padStart(2, '0');
function fmtDate(d) {
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ---- ticket sale-status engine (the core fix) ----
   Given saleStart / saleEnd (Date | null) and quantity / sold,
   returns one of: soon | live | ended | soldout, with a label + badge class. */
function ticketStatus(t, now) {
  now = now || HANDOFF_NOW;
  if (t.quantity != null && t.sold >= t.quantity) {
    return { key: 'soldout', label: '已售完', cls: 'badge-soldout', icon: 'ri-close-circle-line' };
  }
  if (t.saleStart && now < t.saleStart) {
    return { key: 'soon', label: '尚未開賣', cls: 'badge-soon', icon: 'ri-time-line' };
  }
  if (t.saleEnd && now > t.saleEnd) {
    return { key: 'ended', label: '販售已截止', cls: 'badge-ended', icon: 'ri-lock-line' };
  }
  return { key: 'live', label: '販售中', cls: 'badge-live', icon: 'ri-checkbox-circle-line' };
}

/* "Demo current time" so the mockup behaves deterministically for reviewers.
   Set to 2026-06-22 so the early-bird (ends 6/18) is correctly shown as 已截止. */
const HANDOFF_NOW = new Date(2026, 5, 22, 14, 30); // months are 0-indexed: 5 = June

/* ---- tiny toast ---- */
function toast(msg) {
  let el = document.getElementById('__toast');
  if (!el) {
    el = document.createElement('div');
    el.id = '__toast';
    el.style.cssText = 'position:fixed;left:50%;bottom:34px;transform:translateX(-50%);background:#16202e;color:#fff;padding:11px 18px;border-radius:10px;font-size:14px;z-index:999;box-shadow:0 10px 30px rgba(0,0,0,.25);opacity:0;transition:opacity .2s,transform .2s;font-family:var(--font-family)';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  el.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(-50%) translateY(8px)'; }, 1800);
}

/* ---- array move helper for reorder ---- */
function arrMove(arr, from, to) {
  if (to < 0 || to >= arr.length) return arr;
  const c = arr.slice();
  const [m] = c.splice(from, 1);
  c.splice(to, 0, m);
  return c;
}

/* ---- drag-to-reorder (HTML5 DnD, handle-initiated) ----
   Demonstrates the production behaviour. Drag starts only from an element
   carrying [data-grip]; rows without one (e.g. locked system fields) can't
   be dragged. `minIndex` keeps draggable items below any leading locked rows.
   Production should use @dnd-kit/sortable (pointer + touch + keyboard a11y) —
   see INTEGRATION.md. Re-run after every render to rebind fresh nodes. */
function clearDropHints(list) {
  Array.from(list.children).forEach(r => r.classList.remove('drop-before', 'drop-after'));
}
function attachDnD(list, arr, render, minIndex = 0) {
  let from = -1;
  Array.from(list.children).forEach((row, i) => {
    const grip = row.querySelector('[data-grip]');
    if (!grip) return; // not draggable (locked)
    const arm = () => { row.draggable = true; };
    grip.addEventListener('mousedown', arm);
    grip.addEventListener('touchstart', arm, { passive: true });
    row.addEventListener('mouseup', () => { row.draggable = false; });
    row.addEventListener('dragstart', (e) => {
      from = i; row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', String(i)); } catch (_) {}
    });
    row.addEventListener('dragend', () => { row.classList.remove('dragging'); row.draggable = false; clearDropHints(list); });
    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      const r = row.getBoundingClientRect();
      const after = (e.clientY - r.top) > r.height / 2;
      clearDropHints(list);
      row.classList.add(after ? 'drop-after' : 'drop-before');
    });
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      const r = row.getBoundingClientRect();
      const after = (e.clientY - r.top) > r.height / 2;
      let to = i + (after ? 1 : 0);
      if (from < to) to--;
      to = Math.max(minIndex, to);
      if (from >= 0 && from !== to) {
        const [m] = arr.splice(from, 1);
        arr.splice(to, 0, m);
      }
      clearDropHints(list);
      render();
    });
  });
}

/* ---- editor → attendee data bridge ----
   The editor saves the activity it's editing to localStorage; the attendee
   page reads it so "what the organiser typed" actually flows into the final
   registration page. Falls back to a default sample when nothing is saved. */
const HANDOFF_KEY = 'internx_handoff_activity';
function saveHandoffActivity(a) { try { localStorage.setItem(HANDOFF_KEY, JSON.stringify(a)); } catch (_) {} }
function loadHandoffActivity() {
  try {
    const s = localStorage.getItem(HANDOFF_KEY);
    if (!s) return null;
    const a = JSON.parse(s);
    (a.tickets || []).forEach(t => {           // revive dates for ticketStatus()
      t.saleStart = t.saleStart ? new Date(t.saleStart) : null;
      t.saleEnd = t.saleEnd ? new Date(t.saleEnd) : null;
    });
    return a;
  } catch (_) { return null; }
}

/* ---- field-type metadata shared by editor + attendee form renderer ---- */
const FIELD_META = {
  text: { icon: 'ri-text', label: '單行文字' }, textarea: { icon: 'ri-align-left', label: '多行文字' },
  email: { icon: 'ri-mail-line', label: 'Email' }, phone: { icon: 'ri-phone-line', label: '電話' },
  number: { icon: 'ri-hashtag', label: '數字' },
  select: { icon: 'ri-list-check', label: '下拉選單' }, radio: { icon: 'ri-radio-button-line', label: '單選題' },
  checkbox: { icon: 'ri-checkbox-multiple-line', label: '複選題' }, date: { icon: 'ri-calendar-line', label: '日期' },
  file: { icon: 'ri-attachment-2', label: '檔案上傳' }, agreement: { icon: 'ri-checkbox-circle-line', label: '同意條款' },
};

/* ---- mark active top-nav link (handles clean URLs /editor and /editor.html) ---- */
document.addEventListener('DOMContentLoaded', () => {
  const norm = s => (s || '').replace(/\.html$/, '').replace(/^\//, '').replace(/\/+$/, '').replace(/^index$/, '');
  const here = norm(location.pathname);
  document.querySelectorAll('.topnav a').forEach(a => {
    if (norm(a.getAttribute('href')) === here) a.classList.add('active');
  });
});

/* ---- Embed a page inside reconstructed internx.me chrome ----
   Opt in with <body data-embed="主辦"> (or "活動"). Hides the docs top nav,
   wraps <main> inside the real-style top bar + left SideNav, and adds a thin
   "交接示意" strip so the handoff pages are still navigable. Makes the mockup
   read as "inside internx.me", not a standalone site. */
function embedInPlatform() {
  const key = document.body.dataset.embed;                       // product pages → full chrome
  const stripOnly = !key && document.body.dataset.strip !== undefined; // docs pages → thin strip only
  if (!key && !stripOnly) return;

  const PAGES = [
    ['/', '總覽'], ['/backstage', '後臺'], ['/editor', '建立活動'], ['/attendee', '報名頁'],
    ['/creator', '創作者主頁'], ['/blog', '部落格'], ['/integration', '整合動線'], ['/spec', '工程規格'],
  ];
  const cur = (location.pathname.replace(/\.html$/, '').replace(/\/+$/, '')) || '/';
  const links = PAGES.map(([h, t]) => {
    const on = h === '/' ? cur === '/' : cur.startsWith(h);
    return `<a href="${h}" class="${on ? 'on' : ''}">${t}</a>`;
  }).join('');

  const strip = document.createElement('div');
  strip.className = 'handoff-strip';
  strip.innerHTML = `<span class="hl"><span class="dot"></span> 實習通 · 交接示意</span><nav>${links}</nav>`;

  const docbar = document.querySelector('.topbar');
  if (docbar) docbar.remove();
  document.body.insertBefore(strip, document.body.firstChild);

  if (!key) return; // docs page: strip only, leave content as-is

  const main = document.querySelector('main');
  if (!main) return;
  const SIDE = [
    ['ri-home-5-line', '實習通首頁', false],
    ['ri-team-line', '人脈與小夥伴們', false],
    ['ri-calendar-event-line', '職涯活動媒人婆', key === '活動'],
    ['ri-store-2-line', '主辦專區（官方帳號）', key === '主辦'],
    ['ri-cup-line', '人生飲料店', false],
    ['ri-coin-line', '賺取及使用點數', false],
  ];
  const side = SIDE.map(([i, t, on]) => `<div class="ix-nav ${on ? 'active' : ''}"><i class="${i}"></i> ${t}</div>`).join('');
  const ixpage = document.createElement('div');
  ixpage.className = 'ix ix-page';
  ixpage.innerHTML = `
    <div class="ix-top">
      <span class="l"><span class="lg">X</span> 實習通</span>
      <span class="ix-search"><i class="ri-search-line"></i> 搜尋公司、活動、夥伴</span>
      <span class="bell"><i class="ri-notification-3-line"></i></span>
      <span class="av"></span>
    </div>
    <div class="ix-main">
      <div class="ix-side">${side}</div>
      <div class="ix-content"></div>
    </div>`;
  strip.after(ixpage);
  ixpage.querySelector('.ix-content').appendChild(main); // move page content inside the chrome
}
document.addEventListener('DOMContentLoaded', embedInPlatform);
