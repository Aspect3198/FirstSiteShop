// =============================================================
// components/favorites.js — Wishlist toggle & favourites view
// =============================================================
import { state }              from '../state/state.js';
import { trunc }              from '../utils/helpers.js';
import { saveAll }            from '../utils/storage.js';
import { showToast, updateCountBadges } from './ui.js';
import { renderCard }         from './products.js';

export function toggleFavorite(productId) {
  const idx = state.favorites.indexOf(productId);
  const p   = state.allProducts.find(x => x.id === productId);

  if (idx === -1) {
    state.favorites.push(productId);
    showToast('Додано до обраного', trunc(p?.name || '', 36), 'success');
  } else {
    state.favorites.splice(idx, 1);
    showToast('Видалено з обраного', trunc(p?.name || '', 36), 'warning');
  }

  saveAll();
  updateCountBadges();

  // Sync all rendered cards for this product
  document.querySelectorAll(`.product-card[data-id="${productId}"] .wishlist-btn`)
    .forEach(btn => {
      const isFav = state.favorites.includes(productId);
      btn.classList.toggle('active', isFav);
      btn.querySelector('svg')?.setAttribute('fill', isFav ? 'currentColor' : 'none');
    });

  window.updateUserMenuStats?.();
}
window.toggleFavorite = toggleFavorite;

export function openFavoritesView() {
  state.filtered = state.allProducts.filter(p => state.favorites.includes(p.id));
  const grid     = document.getElementById('productGrid');
  const empty    = document.getElementById('emptyState');

  if (state.filtered.length === 0) {
    if (grid)  grid.innerHTML = '';
    empty?.classList.remove('hidden');
  } else {
    empty?.classList.add('hidden');
    if (grid) {
      grid.className = 'product-grid';
      grid.innerHTML = state.filtered.map((p, i) => renderCard(p, i)).join('');
    }
  }

  const info = document.getElementById('resultsInfo');
  if (info) info.innerHTML = `<strong>Обране</strong> — <strong>${state.favorites.length}</strong> товарів`;
}
window.openFavoritesView = openFavoritesView;