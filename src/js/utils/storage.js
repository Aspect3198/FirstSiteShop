// =============================================================
// utils/storage.js — localStorage persistence layer
// =============================================================
import { state }           from '../state/state.js';
import { lsGet, lsSet, lsDel, ssGet } from './helpers.js';

// ─── Session ─────────────────────────────────────────────────
export function saveAll() {
  lsSet('mkt_cart', state.cart);
  lsSet('mkt_fav',  state.favorites);
  if (state.user) lsSet('mkt_user', state.user);
  // Persist some lightweight UI state so reload restores UX
  lsSet('mkt_currentCategory', state.currentCategory);
  lsSet('mkt_searchQuery', state.searchQuery);
  lsSet('mkt_viewMode', state.viewMode);
  lsSet('mkt_sortBy', state.sortBy);
  lsSet('mkt_filters', state.filters);
  lsSet('mkt_page', state.page);
}

export function loadFromStorage() {
  const cart = lsGet('mkt_cart');
  const fav  = lsGet('mkt_fav');
  const user = lsGet('mkt_user');
  if (cart) state.cart      = cart;
  if (fav)  state.favorites = fav;
  if (user) state.user      = user;
  // Restore UI state
  const cat = lsGet('mkt_currentCategory');
  const query = lsGet('mkt_searchQuery');
  const selectedProduct = ssGet('mkt_selectedProduct');
  const vm = lsGet('mkt_viewMode');
  const sb = lsGet('mkt_sortBy');
  const fl = lsGet('mkt_filters');
  const pg = lsGet('mkt_page');
  const view = ssGet('mkt_activeView');
  const adminSection = ssGet('mkt_adminSection');
  if (cat) state.currentCategory = cat;
  if (query) state.searchQuery = query;
  if (selectedProduct) state.selectedProduct = selectedProduct;
  if (vm) state.viewMode = vm;
  if (sb) state.sortBy = sb;
  if (fl) state.filters = Object.assign({}, state.filters, fl);
  if (pg) state.page = pg;
  if (view) state.activeView = view;
  if (adminSection) state.adminSection = adminSection;
}

// ─── Users ───────────────────────────────────────────────────
function getDefaultUsers() {
  return [
    { id: 1, name: 'Олексій Коваленко', email: 'alex@example.com',  password: 'password123', role: 'user',  joined: '2023-01-15', orders: 3, totalSpent: 48320, avatar: 'АК' },
    { id: 2, name: 'Марія Іваненко',    email: 'maria@example.com', password: 'maria2024',   role: 'user',  joined: '2023-06-20', orders: 1, totalSpent: 21450, avatar: 'МІ' },
    { id: 3, name: 'Адміністратор',     email: 'admin@market.ua',   password: 'admin2024',   role: 'admin', joined: '2021-01-01', orders: 0, totalSpent: 0,     avatar: 'AD' },
  ];
}

export function getUsers()       { return lsGet('mkt_users') || getDefaultUsers(); }
export function saveUsers(users) { lsSet('mkt_users', users); }

// ─── Orders ──────────────────────────────────────────────────
export function getOrders()    { return lsGet('mkt_orders') || []; }
export function saveOrders(o)  { lsSet('mkt_orders', o); }

// Re-export lsDel so callers don't need a second import
export { lsDel };