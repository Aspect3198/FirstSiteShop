// =============================================================
// admin/index.js — Admin panel open/close and section router
// =============================================================
import { state }   from '../state/state.js';
import { ssDel, ssSet } from '../utils/helpers.js';
import { updateAdminOrdersBadge } from '../components/ui.js';

// Lazy imports – each section module is small
import { renderAdminDashboard }  from './dashboard.js';
import { renderAdminProducts }   from './products.js';
import { renderAdminOrders }     from './orders.js';
import { renderAdminUsers }      from './users.js';
import { renderAdminAnalytics }  from './analytics.js';
import { renderAdminSettings }   from './settings.js';
import { renderAdminContacts, mountAdminContacts } from './contacts.js';

export function openAdminPanel() {
  if (!state.user || state.user.role !== 'admin') {
    window.showToast?.('Доступ заборонено', 'Тільки для адміністраторів', 'error');
    return;
  }
  document.getElementById('adminPanel')?.classList.add('open');
  document.getElementById('adminOverlay')?.classList.add('active');
  document.body.style.overflow = 'hidden';
  ssSet('mkt_adminPanelOpen', true);
  renderAdminSection(state.adminSection || 'dashboard');
}
window.openAdminPanel = openAdminPanel;

export function closeAdminPanel() {
  document.getElementById('adminPanel')?.classList.remove('open');
  document.getElementById('adminOverlay')?.classList.remove('active');
  document.body.style.overflow = '';
  ssDel('mkt_adminPanelOpen');
}
window.closeAdminPanel = closeAdminPanel;

export function renderAdminSection(section) {
  if (!state.user || state.user.role !== 'admin') return;
  state.adminSection = section;
  ssSet('mkt_adminSection', section);

  document.querySelectorAll('.admin-nav-btn')
    .forEach(b => b.classList.toggle('active', b.dataset.section === section));

  const TITLES = {
    dashboard:  'Дашборд',
    contacts:   'Контакти',
    products:   'Товари',
    orders:     'Замовлення',
    users:      'Користувачі',
    analytics:  'Аналітика',
    settings:   'Налаштування',
  };
  const tEl = document.getElementById('adminPageTitle');
  const bEl = document.getElementById('adminBreadcrumb');
  if (tEl) tEl.textContent = TITLES[section] || section;
  if (bEl) bEl.textContent = TITLES[section] || section;

  const content = document.getElementById('adminContent');
  if (!content) return;

  switch (section) {
    case 'dashboard': content.innerHTML = renderAdminDashboard();  break;
    case 'contacts':  content.innerHTML = renderAdminContacts(); mountAdminContacts(); break;
    case 'products':  content.innerHTML = renderAdminProducts();   break;
    case 'orders':    content.innerHTML = renderAdminOrders();     break;
    case 'users':     content.innerHTML = renderAdminUsers();      break;
    case 'analytics': content.innerHTML = renderAdminAnalytics();  break;
    case 'settings':  content.innerHTML = renderAdminSettings();   break;
  }
}
window.renderAdminSection = renderAdminSection;