// =============================================================
// components/search.js — Live search bar + dropdown
// =============================================================
import { state }                 from '../state/state.js';
import { hilite }                from '../utils/helpers.js';
import { applyFiltersAndRender } from './filters.js';

export function handleSearch(query) {
  state.searchQuery = query;
  applyFiltersAndRender();
  renderSearchDropdown(query);
}

export function renderSearchDropdown(query) {
  const dd = document.getElementById('searchDropdown');
  if (!dd) return;

  if (!query.trim()) { dd.classList.remove('open'); return; }

  const q       = query.toLowerCase();
  const matches = state.allProducts
    .filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
    .slice(0, 6);

  if (!matches.length) { dd.classList.remove('open'); return; }

  dd.innerHTML = matches.map(p => `
    <div class="search-item"
         onclick="openProductModal(${p.id});closeSearchDropdown()">
      <img class="search-item-img"
           src="${p.image}" alt="${p.name}"
           onerror="this.src='https://picsum.photos/seed/${p.id}/80/80'">
      <span class="search-item-name">${hilite(p.name, q)}</span>
      <span class="search-item-price">${p.price.toLocaleString('uk')} ₴</span>
    </div>`).join('');

  dd.classList.add('open');
}

export function closeSearchDropdown() {
  document.getElementById('searchDropdown')?.classList.remove('open');
}
window.closeSearchDropdown = closeSearchDropdown;