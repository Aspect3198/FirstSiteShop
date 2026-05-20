// =============================================================
// components/products.js — Product grid & card rendering
// =============================================================
import { state }      from '../state/state.js';
import { CATEGORIES } from '../utils/constants.js';
import { trunc }      from '../utils/helpers.js';

// ─── Grid ─────────────────────────────────────────────────────
export function renderProductGrid() {
  const grid    = document.getElementById('productGrid');
  const empty   = document.getElementById('emptyState');
  const loadBtn = document.getElementById('loadMoreBtn');
  if (!grid) return;

  const visible = state.filtered.slice(0, state.page * state.perPage);
  const hasMore = state.filtered.length > visible.length;

  if (state.filtered.length === 0) {
    grid.innerHTML = '';
    empty?.classList.remove('hidden');
    loadBtn?.classList.add('hidden');
    return;
  }

  empty?.classList.add('hidden');
  grid.className   = `product-grid${state.viewMode === 'list' ? ' list-view' : ''}`;
  grid.innerHTML   = visible.map((p, i) => renderCard(p, i)).join('');
  loadBtn?.classList.toggle('hidden', !hasMore);
}

// ─── Card ─────────────────────────────────────────────────────
export function renderCard(p, idx = 0) {
  const inCart = state.cart.some(c => c.id === p.id);
  const isFav  = state.favorites.includes(p.id);
  const delay  = Math.min(idx * 35, 400);
  const badge  = p.badge
    ? `<span class="product-badge badge-${p.badge}">${{ new: 'NEW', sale: 'SALE', top: 'TOP' }[p.badge] || p.badge}</span>`
    : '';

  return `
  <div class="product-card ${!p.inStock ? 'out-of-stock' : ''}"
       style="animation-delay:${delay}ms"
       onclick="openProductModal(${p.id})"
       data-id="${p.id}">

    ${p.discount > 0 ? `<span class="discount-badge">-${p.discount}%</span>` : ''}
    ${badge}

    <button class="wishlist-btn ${isFav ? 'active' : ''}"
            onclick="event.stopPropagation();toggleFavorite(${p.id})"
            title="Обране">
      <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}"
           stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06
                 a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78
                 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>

    <div class="card-img-wrap">
      <img src="${p.image}" alt="${p.name}" loading="lazy"
           onerror="this.src='https://picsum.photos/seed/${p.id}/400/400'">
    </div>

    <div class="card-body">
      <p class="card-brand">${p.brand}</p>
      <h3 class="card-name">${p.name}</h3>

      <div class="card-rating">
        <div class="stars">${renderStars(p.rating)}</div>
        <span class="review-count">(${(p.reviews || 0).toLocaleString('uk')})</span>
      </div>

      <div class="card-prices">
        <span class="price-new">${p.price.toLocaleString('uk')} ₴</span>
        ${p.oldPrice ? `<span class="price-old">${p.oldPrice.toLocaleString('uk')} ₴</span>` : ''}
      </div>

      <div class="card-footer">
        <button class="add-cart-btn ${inCart ? 'in-cart' : ''}"
                onclick="event.stopPropagation();addToCart(${p.id})"
                ${!p.inStock ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               width="13" height="13">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72
                     a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          ${inCart ? 'В кошику' : 'Купити'}
        </button>
      </div>
    </div>
  </div>`;
}

// ─── Stars ───────────────────────────────────────────────────
export function renderStars(rating) {
  return Array.from({ length: 5 }, (_, i) => {
    if (i < Math.floor(rating)) return '<span class="star filled">★</span>';
    if (i < rating)             return '<span class="star half">★</span>';
    return '<span class="star">☆</span>';
  }).join('');
}

// ─── Results info bar ─────────────────────────────────────────
export function renderResultsInfo() {
  const el = document.getElementById('resultsInfo');
  if (!el) return;
  const total   = state.filtered.length;
  const shown   = Math.min(state.page * state.perPage, total);
  const catName = CATEGORIES.find(c => c.id === state.currentCategory)?.label || 'Всі товари';
  el.innerHTML  = `<strong>${catName}</strong> — <strong>${total}</strong> товарів (показано ${shown})`;
}

// ─── Active filter tags ───────────────────────────────────────
export function renderActiveFilterTags() {
  const el = document.getElementById('activeFilters');
  if (!el) return;

  const tags = [];

  if (state.currentCategory !== 'all') {
    const cat = CATEGORIES.find(c => c.id === state.currentCategory);
    tags.push({ label: cat?.label, clear: () => window.filterByCategory('all') });
  }

  if (state.searchQuery) {
    tags.push({
      label: `🔍 "${state.searchQuery}"`,
      clear: () => {
        state.searchQuery = '';
        const inp = document.getElementById('searchInput');
        if (inp) inp.value = '';
        window.applyFiltersAndRender?.();
      },
    });
  }

  if (state.filters.priceMin > 0 || state.filters.priceMax < 100000) {
    tags.push({
      label: `${state.filters.priceMin.toLocaleString()}–${state.filters.priceMax.toLocaleString()} ₴`,
      clear: () => { state.filters.priceMin = 0; state.filters.priceMax = 100000; window.applyFiltersAndRender?.(); },
    });
  }

  state.filters.brands.forEach(b => tags.push({
    label: b,
    clear: () => {
      state.filters.brands = state.filters.brands.filter(x => x !== b);
      window.renderBrandFilter?.();
      window.applyFiltersAndRender?.();
    },
  }));

  if (state.filters.minRating > 0) {
    tags.push({
      label: `⭐ ${state.filters.minRating}+`,
      clear: () => { state.filters.minRating = 0; window.renderRatingFilters?.(); window.applyFiltersAndRender?.(); },
    });
  }

  if (state.filters.inStockOnly) {
    tags.push({
      label: 'В наявності',
      clear: () => {
        state.filters.inStockOnly = false;
        const el = document.getElementById('inStockOnly');
        if (el) el.checked = false;
        window.applyFiltersAndRender?.();
      },
    });
  }

  if (state.filters.discountOnly) {
    tags.push({
      label: 'Зі знижкою',
      clear: () => {
        state.filters.discountOnly = false;
        const el = document.getElementById('discountOnly');
        if (el) el.checked = false;
        window.applyFiltersAndRender?.();
      },
    });
  }

  el.innerHTML = tags.map((t, idx) =>
    `<span class="filter-tag">${t.label}<button class="filter-tag-close" data-tag-index="${idx}">✕</button></span>`,
  ).join('');

  el.querySelectorAll('.filter-tag-close').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const idx = Number(btn.dataset.tagIndex);
      if (Number.isInteger(idx) && tags[idx]) tags[idx].clear();
    });
  });
}