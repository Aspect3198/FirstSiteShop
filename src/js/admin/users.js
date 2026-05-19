// =============================================================
// admin/users.js — Admin user table with search & delete
// =============================================================
import { getUsers, saveUsers, getOrders } from '../utils/storage.js';
import { showToast }                      from '../components/ui.js';
import { trunc }                          from '../utils/helpers.js';

export function renderAdminUsers() {
  const users = getUsers();
  return `
  <div class="adm-toolbar">
    <input type="text" class="adm-search-input"
           placeholder="Пошук за ім'ям або email…"
           oninput="adminFilterUsers(this.value)">
    <span style="font-size:13px;color:var(--adm-text3)">
      Всього: ${users.length} |
      Адміни: ${users.filter(u => u.role === 'admin').length} |
      Покупці: ${users.filter(u => u.role !== 'admin').length}
    </span>
  </div>
  <div class="adm-section-box" style="padding:0;overflow:auto">
    <table class="adm-table">
      <thead>
        <tr>
          <th>Аватар</th><th>Ім'я</th><th>Email</th><th>Роль</th>
          <th>Реєстрація</th><th>Замовлень</th><th>Витрачено</th><th>Дії</th>
        </tr>
      </thead>
      <tbody id="admUsersTbody">${adminUserRows(users)}</tbody>
    </table>
  </div>`;
}

export function adminUserRows(users) {
  const orders = getOrders();
  return users.map(u => {
    const spent = orders
      .filter(o => o.userId === u.id && o.status === 'delivered')
      .reduce((a, o) => a + o.total, 0);
    return `
    <tr>
      <td>
        <div class="adm-user-avatar-cell"
             style="background:${u.role === 'admin' ? 'var(--adm-purple)' : 'var(--adm-green)'}">
          ${u.avatar || u.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
        </div>
      </td>
      <td><strong>${u.name}</strong></td>
      <td style="color:var(--adm-text3);font-size:12px">${u.email}</td>
      <td>
        <span class="adm-status-badge ${u.role === 'admin' ? 'status-admin' : 'status-delivered'}">
          ${u.role === 'admin' ? 'Адмін' : 'Покупець'}
        </span>
      </td>
      <td style="color:var(--adm-text3)">${u.joined || '—'}</td>
      <td>${u.orders || 0}</td>
      <td><strong>${(u.totalSpent || 0).toLocaleString('uk')} ₴</strong></td>
      <td>
        ${u.role !== 'admin'
          ? `<button class="adm-icon-btn delete"
                     onclick="adminDeleteUser(${u.id})" title="Видалити">🗑️</button>`
          : '—'}
      </td>
    </tr>`;
  }).join('');
}

export function adminFilterUsers(q) {
  const filtered = getUsers().filter(u =>
    u.name.toLowerCase().includes(q.toLowerCase()) ||
    u.email.toLowerCase().includes(q.toLowerCase()),
  );
  const el = document.getElementById('admUsersTbody');
  if (el) el.innerHTML = adminUserRows(filtered);
}
window.adminFilterUsers = adminFilterUsers;

export function adminDeleteUser(id) {
  const users = getUsers();
  const u     = users.find(x => x.id === id);
  if (!u || u.role === 'admin') return;
  if (!confirm(`Видалити користувача "${u.name}"?`)) return;
  saveUsers(users.filter(x => x.id !== id));
  window.renderAdminSection?.('users');
  showToast('Видалено', trunc(u.name, 30), 'warning');
}
window.adminDeleteUser = adminDeleteUser;