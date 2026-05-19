// =============================================================
// admin/dashboard.js — Dashboard stats, recent orders, top products
// =============================================================
import { state }                    from '../state/state.js';
import { getOrders, getUsers }      from '../utils/storage.js';
import { trunc }                    from '../utils/helpers.js';
import { ORDER_STATUS_MAP }         from '../utils/constants.js';

export function adminStatusBadge(status) {
  const s = ORDER_STATUS_MAP[status] || { label: status, cls: '' };
  return `<span class="adm-status-badge ${s.cls}">${s.label}</span>`;
}

export function renderAdminDashboard() {
  const orders   = getOrders();
  const users    = getUsers();
  const products = state.allProducts;

  const revenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((a, o) => a + o.total, 0);
  const pending = orders.filter(o => o.status === 'pending').length;

  return `
  <div class="adm-stats-grid">
    <div class="adm-stat-card green">
      <div class="adm-stat-icon">₴</div>
      <div class="adm-stat-body">
        <div class="adm-stat-val">${revenue.toLocaleString('uk')} ₴</div>
        <div class="adm-stat-label">Дохід (доставлено)</div>
        <div class="adm-stat-sub">
          ${orders.filter(o => o.status === 'delivered').length} виконаних замовлень
        </div>
      </div>
    </div>
    <div class="adm-stat-card blue">
      <div class="adm-stat-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <polyline points="9 11 12 14 22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      </div>
      <div class="adm-stat-body">
        <div class="adm-stat-val">${orders.length}</div>
        <div class="adm-stat-label">Всього замовлень</div>
        <div class="adm-stat-sub" style="color:${pending > 0 ? 'var(--adm-orange)' : 'var(--adm-text3)'}">
          Очікує: ${pending}
        </div>
      </div>
    </div>
    <div class="adm-stat-card orange">
      <div class="adm-stat-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      </div>
      <div class="adm-stat-body">
        <div class="adm-stat-val">${products.length}</div>
        <div class="adm-stat-label">Товарів у каталозі</div>
        <div class="adm-stat-sub">В наявності: ${products.filter(p => p.inStock).length}</div>
      </div>
    </div>
    <div class="adm-stat-card purple">
      <div class="adm-stat-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <div class="adm-stat-body">
        <div class="adm-stat-val">${users.filter(u => u.role !== 'admin').length}</div>
        <div class="adm-stat-label">Покупці</div>
        <div class="adm-stat-sub">Адмінів: ${users.filter(u => u.role === 'admin').length}</div>
      </div>
    </div>
  </div>

  <div class="adm-two-col">
    <div class="adm-section-box">
      <div class="adm-section-head">
        <h3>Останні замовлення</h3>
        <button class="adm-link-btn" onclick="renderAdminSection('orders')">Всі →</button>
      </div>
      ${orders.length === 0
        ? '<p style="color:var(--adm-text3);text-align:center;padding:20px">Замовлень ще немає</p>'
        : `<table class="adm-table">
            <thead><tr><th>ID</th><th>Клієнт</th><th>Сума</th><th>Статус</th></tr></thead>
            <tbody>
              ${orders.slice(0, 5).map(o => `
                <tr>
                  <td><span class="adm-order-id">${o.id.slice(-8)}</span></td>
                  <td>${trunc(o.userName, 20)}</td>
                  <td><strong>${o.total.toLocaleString('uk')} ₴</strong></td>
                  <td>${adminStatusBadge(o.status)}</td>
                </tr>`).join('')}
            </tbody>
          </table>`}
    </div>

    <div class="adm-section-box">
      <div class="adm-section-head">
        <h3>Топ товарів</h3>
        <button class="adm-link-btn" onclick="renderAdminSection('products')">Всі →</button>
      </div>
      <div class="adm-top-products">
        ${[...products].sort((a, b) => b.popular - a.popular).slice(0, 5).map((p, i) => `
          <div class="adm-top-product">
            <span class="adm-top-rank">${i + 1}</span>
            <img src="${p.image}" alt="${p.name}"
                 onerror="this.src='https://picsum.photos/seed/${p.id}/60/60'">
            <div class="adm-top-info">
              <span class="adm-top-name">${trunc(p.name, 28)}</span>
              <span class="adm-top-price">${p.price.toLocaleString('uk')} ₴</span>
            </div>
            <div class="adm-top-bar-wrap">
              <div class="adm-top-bar" style="width:${p.popular}%"></div>
              <span>${p.popular}%</span>
            </div>
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}