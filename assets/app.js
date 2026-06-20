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

/* ---- mark active top-nav link by filename ---- */
document.addEventListener('DOMContentLoaded', () => {
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.topnav a').forEach(a => {
    if (a.getAttribute('href') === here) a.classList.add('active');
  });
});
