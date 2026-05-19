// =============================================================
// admin/orders.js — Admin orders table with status management
// =============================================================
import { getOrders, saveOrders } from '../utils/storage.js';
import { ORDER_STATUS_MAP }      from '../utils/constants.js';
import { trunc }                 from '../utils/helpers.js';
import { showToast }             from '../components/ui.js';
import { adminStatusBadge }      from './dashboard.js';

export function renderAdminOrders() {
  const orders   = getOrders();
  const statuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const sLabels  = {
    all: 'Всі', pending: 'Очікують', processing: 'Обробка',
    shipped: 'Відправлені', delivered: 'Доставлені', cancelled: 'Скасовані',
  };

  return `
  <div class="adm-toolbar">
    <div class="adm-filter-tabs">
      ${statuses.map((s, i) => `
        <button class="adm-filter-tab ${i === 0 ? 'active' : ''}"
                onclick="adminFilterOrders('${s}', this)">
          ${sLabels[s]} (${s === 'all' ? orders.length : orders.filter(o => o.status === s).length})
        </button>`).join('')}
    </div>
  </div>
  <div class="adm-section-box" style="padding:0;overflow:auto">
    <table class="adm-table">
      <thead>
        <tr>
          <th>ID</th><th>Клієнт</th><th>Email</th><th>Дата</th>
          <th>Товарів</th><th>Сума</th><th>Статус</th><th>Змінити</th>
        </tr>
      </thead>
      <tbody id="admOrdersTbody">${adminOrderRows(orders)}</tbody>
    </table>
  </div>
  ${orders.length === 0
    ? '<div style="text-align:center;padding:40px;color:var(--adm-text3)">Замовлень ще немає</div>'
    : ''}`;
}

export function adminOrderRows(orders) {
  return orders.map(o => `
    <tr id="admORow_${o.id}">
      <td><span class="adm-order-id">${o.id.slice(-10)}</span></td>
      <td>${trunc(o.userName || '', 20)}</td>
      <td style="color:var(--adm-text3);font-size:12px">${trunc(o.userEmail || '', 24)}</td>
      <td style="color:var(--adm-text3)">${o.date}</td>
      <td>${o.items?.length || 0} (${o.items?.reduce((a, i) => a + i.qty, 0) || 0} шт)</td>
      <td><strong>${o.total.toLocaleString('uk')} ₴</strong></td>
      <td>${adminStatusBadge(o.status)}</td>
      <td>
        <select class="adm-status-select"
                onchange="adminChangeOrderStatus('${o.id}', this.value)">
          ${Object.entries(ORDER_STATUS_MAP).map(([k, v]) =>
            `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v.label}</option>`
          ).join('')}
        </select>
      </td>
    </tr>`).join('');
}

export function adminFilterOrders(status, btn) {
  document.querySelectorAll('.adm-filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const orders   = getOrders();
  const filtered = status === 'all' ? orders : orders.filter(o => o.status === status);
  const el       = document.getElementById('admOrdersTbody');
  if (el) el.innerHTML = adminOrderRows(filtered);
}
window.adminFilterOrders = adminFilterOrders;

export function adminChangeOrderStatus(orderId, newStatus) {
  const orders = getOrders();
  const o      = orders.find(x => x.id === orderId);
  if (!o) return;
  o.status = newStatus;
  saveOrders(orders);
  showToast(
    'Статус оновлено',
    `${orderId.slice(-8)} → ${ORDER_STATUS_MAP[newStatus]?.label || newStatus}`,
    'success',
  );
  window.updateAdminOrdersBadge?.();
  window.renderAdminSection?.('orders');
}
window.adminChangeOrderStatus = adminChangeOrderStatus;