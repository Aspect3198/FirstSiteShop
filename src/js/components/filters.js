// =============================================================
// components/filters.js — Sidebar filters, category nav, sort
// =============================================================
import { state }                from '../state/state.js';
import { CATEGORIES }           from '../utils/constants.js';
import {
  renderProductGrid,
  renderResultsInfo,
  renderActiveFilterTags,
} from './products.js';

// ─── Category sidebar ────────────────────────────────────────
export function renderCategories() {
  const list = document.getElementById('catList');
  if (!list) return;

  const counts = {};
  CATEGORIES.forEach(c => {
    counts[c.id] = c.id === 'all'
      ? state.allProducts.length
      : state.allProducts.filter(p => p.category === c.id).length;
  });

  list.innerHTML = CATEGORIES.map(cat => `
    <li>
      <a href="#" class="cat-link ${state.currentCategory === cat.id ? 'active' : ''}"
         data-cat="${cat.id}">
        <span>${cat.icon} ${cat.label}</span>
        <span class="cat-count">${counts[cat.id]}</span>
      </a>
    </li>`).join('');

  list.querySelectorAll('.cat-link').forEach(a =>
    a.addEventListener('click', e => { e.preventDefault(); filterByCategory(a.dataset.cat); }),
  );
}
window.renderCategories = renderCategories;

// ─── Mega-menu ────────────────────────────────────────────────
export function renderMegaMenu() {
  const el = document.getElementById('catalogCats');
  if (!el) return;
  el.innerHTML = CATEGORIES
    .filter(c => c.id !== 'all')
    .map(cat => `
      <li>
        <a href="#" onclick="filterByCategory('${cat.id}');closeCatalog();return false;">
          <span class="cat-ico">${cat.icon}</span>${cat.label}
        </a>
      </li>`)
    .join('');
}

// ─── Brand filter ─────────────────────────────────────────────
export function renderBrandFilter() {
  const el = document.getElementById('brandList');
  if (!el) return;
  const brands = [...new Set(state.allProducts.map(p => p.brand))].sort();
  el.innerHTML = brands.map(b => `
    <label class="brand-check-item">
      <input type="checkbox" class="brand-cb" value="${b}"
             ${state.filters.brands.includes(b) ? 'checked' : ''}>
      <span class="checkmark"></span>
      <span class="brand-name">${b}</span>
      <span class="brand-count">${state.allProducts.filter(p => p.brand === b).length}</span>
    </label>`).join('');
}
window.renderBrandFilter = renderBrandFilter;

// ─── Rating filter ────────────────────────────────────────────
export function renderRatingFilters() {
  const el = document.getElementById('ratingFilters');
  if (!el) return;
  el.innerHTML = [4, 3, 2, 1].map(r => `
    <div class="rating-filter-item ${state.filters.minRating === r ? 'active' : ''}"
         onclick="setRatingFilter(${r})">
      <div class="stars-mini">${'⭐'.repeat(r)}${'☆'.repeat(5 - r)}</div>
      <span>та вище</span>
      <span class="rating-filter-count">
        ${state.allProducts.filter(p => p.rating >= r).length}
      </span>
    </div>`).join('');
}
window.renderRatingFilters = renderRatingFilters;

// ─── Core filter + sort + render pipeline ────────────────────
export function applyFiltersAndRender() {
  let products = [...state.allProducts];

  if (state.currentCategory !== 'all')
    products = products.filter(p => p.category === state.currentCategory);

  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q)),
    );
  }

  products = products.filter(
    p => p.price >= state.filters.priceMin && p.price <= state.filters.priceMax,
  );

  if (state.filters.brands.length)
    products = products.filter(p => state.filters.brands.includes(p.brand));
  if (state.filters.minRating > 0)
    products = products.filter(p => p.rating >= state.filters.minRating);
  if (state.filters.inStockOnly)
    products = products.filter(p => p.inStock);
  if (state.filters.discountOnly)
    products = products.filter(p => p.discount > 0);

  state.filtered = sortProducts(products);
  state.page     = 1;

  renderProductGrid();
  renderResultsInfo();
  renderActiveFilterTags();
  renderCategories();
}
window.applyFiltersAndRender = applyFiltersAndRender;

export function sortProducts(list) {
  const a = [...list];
  switch (state.sortBy) {
    case 'price-asc':  return a.sort((x, y) => x.price - y.price);
    case 'price-desc': return a.sort((x, y) => y.price - x.price);
    case 'rating':     return a.sort((x, y) => y.rating - x.rating);
    case 'discount':   return a.sort((x, y) => y.discount - x.discount);
    case 'newest':     return a.sort((x, y) => y.id - x.id);
    default:           return a.sort((x, y) => y.popular - x.popular);
  }
}

// ─── Public helpers (called from inline onclick & events) ─────
export function filterByCategory(catId) {
  state.currentCategory = catId;
  state.searchQuery     = '';
  const inp = document.getElementById('searchInput');
  if (inp) inp.value = '';
  applyFiltersAndRender();
  document.getElementById('mainContent')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.filterByCategory = filterByCategory;

export function setRatingFilter(r) {
  state.filters.minRating = state.filters.minRating === r ? 0 : r;
  renderRatingFilters();
}
window.setRatingFilter = setRatingFilter;

export function resetAll() {
  state.currentCategory = 'all';
  state.searchQuery     = '';
  state.filters = { priceMin: 0, priceMax: 100000, brands: [], minRating: 0, inStockOnly: false, discountOnly: false };
  state.sortBy  = 'popular';

  ['searchInput', 'priceMin', 'priceMax'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const rMin = document.getElementById('rangeMin');
  const rMax = document.getElementById('rangeMax');
  if (rMin) rMin.value = 0;
  if (rMax) rMax.value = 100000;

  ['inStockOnly', 'discountOnly'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });

  const sel = document.getElementById('sortSelect');
  if (sel) sel.value = 'popular';

  renderBrandFilter();
  renderRatingFilters();
  window.updateRangeFill?.();
  applyFiltersAndRender();
}
window.resetAll = resetAll;

export function closeCatalog() {
  document.getElementById('catalogMega')?.classList.remove('open');
  document.getElementById('overlay')?.classList.remove('active');
}
window.closeCatalog = closeCatalog;