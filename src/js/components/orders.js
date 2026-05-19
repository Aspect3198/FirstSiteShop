// =============================================================
// components/orders.js — "My Orders" modal for logged-in users
// =============================================================
import { state }             from '../state/state.js';
import { getOrders }         from '../utils/storage.js';
import { ORDER_STATUS_MAP }  from '../utils/constants.js';
import { showToast }         from './ui.js';
import { openAuthModal }     from './auth.js';

export function openMyOrders() {
  if (!state.user) {
    showToast('Потрібен вхід', '', 'warning');
    openAuthModal();
    return;
  }

  const modal = document.getElementById('ordersModal');
  const body  = document.getElementById('ordersModalBody');
  if (!modal || !body) return;

  const orders = getOrders().filter(o => o.userId === state.user.id);

  if (orders.length === 0) {
    body.innerHTML = `
      <div class="orders-empty">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none"
             stroke="var(--text-muted)" stroke-width="1.5">
          <polyline points="9 11 12 14 22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <p>Замовлень ще немає</p>
        <small>Зробіть перше замовлення</small>
      </div>`;
  } else {
    body.innerHTML = orders.map(o => `
      <div class="order-card">
        <div class="order-card-head">
          <span class="order-id">№ ${o.id}</span>
          <span class="order-date">${o.date}</span>
          <span class="order-status-badge ${ORDER_STATUS_MAP[o.status]?.cls || ''}">
            ${ORDER_STATUS_MAP[o.status]?.label || o.status}
          </span>
        </div>
        <div class="order-items-preview">
          ${o.items.slice(0, 3).map(it => `
            <img src="${it.image}" alt="${it.name}"
                 onerror="this.src='https://picsum.photos/seed/${it.id}/60/60'">`).join('')}
          ${o.items.length > 3 ? `<span class="order-items-more">+${o.items.length - 3}</span>` : ''}
        </div>
        <div class="order-card-foot">
          <span>${o.items.reduce((a, i) => a + i.qty, 0)} товарів</span>
          <strong>${o.total.toLocaleString('uk')} ₴</strong>
        </div>
      </div>`).join('');
  }

  document.getElementById('ordersModalBackdrop')?.classList.add('active');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
window.openMyOrders = openMyOrders;

export function closeMyOrders() {
  document.getElementById('ordersModal')?.classList.remove('open');
  document.getElementById('ordersModalBackdrop')?.classList.remove('active');
  document.body.style.overflow = '';
}