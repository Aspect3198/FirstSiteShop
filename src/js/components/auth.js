// =============================================================
// components/auth.js — Authentication UI & session management
// =============================================================
import { state }                         from '../state/state.js';
import { ADMIN_SECRET_CODE }             from '../utils/constants.js';
import { saveAll, getUsers, saveUsers, getOrders } from '../utils/storage.js';
import { lsDel }                         from '../utils/helpers.js';
import { showToast }                     from './ui.js';
import { updateAdminOrdersBadge }        from './ui.js';

// ─── Open / close ─────────────────────────────────────────────
export function openAuthModal() {
  const modal = document.getElementById('authModal');
  if (!modal) return;

  if (state.user) {
    document.querySelectorAll('.auth-panel, .auth-tabs').forEach(el => el.classList.remove('active'));
    document.getElementById('userMenuPanel')?.classList.add('active');
    const tabs = document.getElementById('authTabs');
    if (tabs) tabs.style.display = 'none';
    updateUserMenuStats();
  } else {
    document.querySelectorAll('.auth-panel').forEach(el => el.classList.remove('active'));
    document.getElementById('loginPanel')?.classList.add('active');
    const tabs = document.getElementById('authTabs');
    if (tabs) tabs.style.display = '';
    document.getElementById('loginTabBtn')?.classList.add('active');
    document.getElementById('registerTabBtn')?.classList.remove('active');
  }
  modal.classList.add('active');
}

export function closeAuthModal() {
  document.getElementById('authModal')?.classList.remove('active');
}
window.closeAuthModal = closeAuthModal;

export function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab')
    .forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('loginPanel')?.classList.toggle('active',    tab === 'login');
  document.getElementById('registerPanel')?.classList.toggle('active', tab === 'register');
}

// ─── Password visibility toggle ───────────────────────────────
export function togglePwd(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.type     = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁' : '🙈';
}
window.togglePwd = togglePwd;

// ─── Login ────────────────────────────────────────────────────
export function login() {
  const email = document.getElementById('loginEmail')?.value.trim();
  const pass  = document.getElementById('loginPassword')?.value;
  if (!email || !pass) { showToast('Помилка', 'Заповніть всі поля', 'error'); return; }

  const users = getUsers();
  const found = users.find(u => u.email === email && u.password === pass);
  if (!found) { showToast('Помилка входу', 'Невірний email або пароль', 'error'); return; }

  state.user = {
    id:     found.id,
    name:   found.name,
    email:  found.email,
    role:   found.role,
    avatar: found.avatar || found.name.split(' ').map(w => w[0]).join('').slice(0, 2),
  };
  saveAll();
  updateAuthUI();
  closeAuthModal();
  showToast(
    `Вітаємо, ${found.name.split(' ')[0]}!`,
    found.role === 'admin' ? 'Ви увійшли як адміністратор' : 'Ви успішно увійшли',
    'success',
  );
}

// ─── Register ─────────────────────────────────────────────────
export function register() {
  const name   = document.getElementById('regName')?.value.trim();
  const email  = document.getElementById('regEmail')?.value.trim();
  const pass   = document.getElementById('regPassword')?.value;
  const roleEl = document.querySelector('input[name="regRole"]:checked');
  const role   = roleEl?.value || 'user';
  const code   = document.getElementById('adminCode')?.value;

  if (!name || !email || !pass) { showToast('Помилка', 'Заповніть всі поля', 'error'); return; }
  if (pass.length < 6)          { showToast('Помилка', 'Пароль мінімум 6 символів', 'error'); return; }

  const users = getUsers();
  if (users.find(u => u.email === email)) { showToast('Помилка', 'Цей email вже зареєстровано', 'error'); return; }

  if (role === 'admin' && code !== ADMIN_SECRET_CODE) {
    showToast('Невірний код', 'Секретний код адміна неправильний', 'error');
    return;
  }

  const newUser = {
    id:         Date.now(),
    name, email, password: pass, role,
    avatar:     name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    joined:     new Date().toISOString().split('T')[0],
    orders:     0,
    totalSpent: 0,
  };
  users.push(newUser);
  saveUsers(users);

  state.user = { id: newUser.id, name, email, role, avatar: newUser.avatar };
  saveAll();
  updateAuthUI();
  closeAuthModal();
  showToast(
    `Вітаємо, ${name.split(' ')[0]}!`,
    role === 'admin' ? 'Ви зареєстровані як адмін' : 'Реєстрація успішна',
    'success',
  );
}

// ─── Logout ───────────────────────────────────────────────────
export function logout() {
  state.user = null;
  lsDel('mkt_user');
  updateAuthUI();
  showToast('До побачення!', 'Ви вийшли з акаунту', 'info');
  closeAuthModal();
}

// ─── Update all auth-dependent UI ────────────────────────────
export function updateAuthUI() {
  const label    = document.getElementById('authLabel');
  const adminBtn = document.getElementById('adminPanelBtn');
  const isAdmin  = state.user?.role === 'admin';
  const isLogged = !!state.user;

  if (label) label.textContent = isLogged ? state.user.name.split(' ')[0] : 'Увійти';

  if (adminBtn) {
    adminBtn.classList.toggle('hidden', !isAdmin);
    // Late-bind to avoid import cycle: openAdminPanel lives in admin/index.js
    adminBtn.onclick = () => window.openAdminPanel?.();
  }

  const adminLink = document.getElementById('adminPanelLink');
  if (adminLink) adminLink.classList.toggle('hidden', !isAdmin);

  const chip   = document.getElementById('adminChipName');
  const chipAv = document.getElementById('adminChipAvatar');
  if (chip   && state.user) chip.textContent   = state.user.name;
  if (chipAv && state.user) chipAv.textContent = state.user.avatar || 'AD';

  updateAdminOrdersBadge();
}

// ─── User menu stats (shown when logged-in panel is open) ─────
export function updateUserMenuStats() {
  if (!state.user) return;

  const nameEl    = document.getElementById('userMenuName');
  const emailEl   = document.getElementById('userMenuEmail');
  const badge     = document.getElementById('userRoleBadge');
  const av        = document.getElementById('userMenuAvatar');
  const statsEl   = document.getElementById('userMenuStats');
  const orderCount = document.getElementById('userMenuOrderCount');
  const favCount  = document.getElementById('userMenuFavCount');

  if (nameEl)  nameEl.textContent  = state.user.name;
  if (emailEl) emailEl.textContent = state.user.email;
  if (badge) {
    badge.textContent = state.user.role === 'admin' ? 'Адмін' : 'Покупець';
    badge.className   = `user-role-badge role-${state.user.role}`;
  }
  if (av) av.textContent = state.user.avatar || '?';

  const userOrders = getOrders().filter(o => o.userId === state.user.id);
  if (orderCount) orderCount.textContent = userOrders.length;
  if (favCount)   favCount.textContent   = state.favorites.length;

  if (statsEl) {
    const spent = userOrders.reduce((a, o) => a + o.total, 0);
    statsEl.innerHTML = `
      <div class="user-stat"><span>${userOrders.length}</span><small>Замовлень</small></div>
      <div class="user-stat"><span>${state.favorites.length}</span><small>Обране</small></div>
      <div class="user-stat"><span>${spent.toLocaleString('uk')} ₴</span><small>Витрачено</small></div>`;
  }
}
window.updateUserMenuStats = updateUserMenuStats;