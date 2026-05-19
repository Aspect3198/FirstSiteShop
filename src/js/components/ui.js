// =============================================================
// components/ui.js — Toasts, count badges, load-error panel
// =============================================================
import { state } from '../state/state.js';

// ─── Toast ───────────────────────────────────────────────────
const TOAST_ICONS = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

export function showToast(title, msg, type = 'info', duration = 3500) {
  const c = document.getElementById('toastContainer');
  if (!c) return;

  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `
    <div class="toast-icon">${TOAST_ICONS[type] || 'ℹ'}</div>
    <div class="toast-text">
      <div class="toast-title">${title}</div>
      ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
    </div>
    <button class="toast-close" onclick="removeToast(this.parentElement)">✕</button>`;

  c.appendChild(t);
  t._timer = setTimeout(() => removeToast(t), duration);

  // Never show more than 5 at once
  const all = c.querySelectorAll('.toast');
  if (all.length > 5) removeToast(all[0]);
}

export function removeToast(el) {
  if (!el?.parentElement) return;
  clearTimeout(el._timer);
  el.classList.add('removing');
  setTimeout(() => el.remove(), 300);
}

// ─── Header badges (cart / favourites count) ─────────────────
export function updateCountBadges() {
  const cartTotal = state.cart.reduce((a, c) => a + c.qty, 0);
  const favTotal  = state.favorites.length;

  const cb = document.getElementById('cartCount');
  const fb = document.getElementById('favCount');
  if (cb) { cb.textContent = cartTotal; cb.classList.toggle('visible', cartTotal > 0); }
  if (fb) { fb.textContent = favTotal;  fb.classList.toggle('visible', favTotal  > 0); }
}

// ─── Admin orders badge ───────────────────────────────────────
export function updateAdminOrdersBadge() {
  const el = document.getElementById('adminOrdersBadge');
  if (!el) return;
  // Lazy import to avoid circular deps: admin reads orders from localStorage
  const orders  = JSON.parse(localStorage.getItem('mkt_orders') || '[]');
  const pending = orders.filter(o => o.status === 'pending').length;
  el.textContent   = pending;
  el.style.display = pending > 0 ? '' : 'none';
}

// ─── Full-grid error state ────────────────────────────────────
export function showLoadError(message) {
  const grid  = document.getElementById('productGrid');
  const empty = document.getElementById('emptyState');
  const info  = document.getElementById('resultsInfo');

  if (info)  info.innerHTML = '';
  if (empty) empty.classList.add('hidden');

  if (grid) {
    grid.innerHTML = `
      <div class="load-error-state">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
             stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <circle cx="12" cy="16" r="0.5" fill="var(--accent)"/>
        </svg>
        <h3>Не вдалося завантажити товари</h3>
        <p>${message}</p>
        <button class="btn-apply"
                onclick="location.reload()"
                style="width:auto;padding:10px 28px;margin-top:8px">
          Спробувати знову
        </button>
      </div>`;
  }

  console.error('[WONDERMARKET] loadProducts failed:', message);
}

// ─── Expose to window (called from inline onclick in toasts) ─
window.showToast   = showToast;
window.removeToast = removeToast;