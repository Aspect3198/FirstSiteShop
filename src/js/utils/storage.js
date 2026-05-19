// =============================================================
// utils/storage.js — localStorage persistence layer
// =============================================================
import { state }           from '../state/state.js';
import { lsGet, lsSet, lsDel } from './helpers.js';

// ─── Session ─────────────────────────────────────────────────
export function saveAll() {
  lsSet('mkt_cart', state.cart);
  lsSet('mkt_fav',  state.favorites);
  if (state.user) lsSet('mkt_user', state.user);
}

export function loadFromStorage() {
  const cart = lsGet('mkt_cart');
  const fav  = lsGet('mkt_fav');
  const user = lsGet('mkt_user');
  if (cart) state.cart      = cart;
  if (fav)  state.favorites = fav;
  if (user) state.user      = user;
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