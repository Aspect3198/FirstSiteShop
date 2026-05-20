// =============================================================
// main.js — Application entry point
// Import order matters: state first, then utils, then components.
// =============================================================

// ── CSS (Vite picks this up and injects it) ──────────────────
import '../css/main.css';

// ── Core ─────────────────────────────────────────────────────
import { state }                from './state/state.js';
import { SITE_NAME }            from './utils/constants.js';
import { loadFromStorage, saveAll } from './utils/storage.js';import { ssGet }                from './utils/helpers.js';
// ── Supabase data layer ───────────────────────────────────────
import { loadProducts }         from './supabase/products-api.js';

// ── UI components ─────────────────────────────────────────────
import { showLoadError, updateCountBadges,
         updateAdminOrdersBadge }          from './components/ui.js';
import { renderCategories, renderMegaMenu,
         renderBrandFilter, renderRatingFilters,
         applyFiltersAndRender }           from './components/filters.js';
import { initPriceRange, updateRangeFill } from './components/price-range.js';
import { openProductModal }                from './components/modal.js';
import { initSlider }                      from './components/slider.js';
import { updateAuthUI }                    from './components/auth.js';
import { renderCartUI }                    from './components/cart.js';
import { openFavoritesView }               from './components/favorites.js';
import { openAdminPanel }                  from './admin/index.js';
// ── Events ────────────────────────────────────────────────────
import { attachEventListeners }            from './events.js';

// ── Admin (registers window.openAdminPanel etc.) ─────────────

// ─── Make saveAll available to admin modules via window ───────
window.saveAll = saveAll;

// =============================================================
// init
// =============================================================
async function init() {
  document.title = `${SITE_NAME} — Інтернет-магазин`;

  // 1. Restore cart / favourites / user from localStorage
  loadFromStorage();

  // 2. Wire all DOM event listeners
  attachEventListeners();

  // Apply persisted UI state to DOM (lightweight)
  const sortEl = document.getElementById('sortSelect');
  if (sortEl) sortEl.value = state.sortBy || sortEl.value;
  const gridBtn = document.getElementById('gridViewBtn');
  const listBtn = document.getElementById('listViewBtn');
  if (gridBtn && listBtn) {
    gridBtn.classList.toggle('active', state.viewMode === 'grid');
    listBtn.classList.toggle('active', state.viewMode === 'list');
  }
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = state.searchQuery || '';
  // restore price inputs
  const pMin = document.getElementById('priceMin');
  const pMax = document.getElementById('priceMax');
  const rMin = document.getElementById('rangeMin');
  const rMax = document.getElementById('rangeMax');
  if (pMin) pMin.value = state.filters.priceMin;
  if (pMax) pMax.value = state.filters.priceMax;
  if (rMin) rMin.value = state.filters.priceMin;
  if (rMax) rMax.value = state.filters.priceMax;
  updateRangeFill();

  // 3. Setup product-independent UI
  initSlider();
  updateCountBadges();
  updateAuthUI();
  updateAdminOrdersBadge();

  // 4. Load products from Supabase — self-contained, handles own errors
  console.log('[WONDERMARKET] Starting…');
  try {
    await loadProducts();
  } catch (err) {
    showLoadError(err.message ?? 'Не вдалося завантажити товари');
    return;
  }

  // 5. Build all product-dependent UI
  renderCategories();
  renderMegaMenu();
  renderBrandFilter();
  renderRatingFilters();
  applyFiltersAndRender();
  initPriceRange();
  renderCartUI();

  const navigationEntries = performance.getEntriesByType?.('navigation') || [];
  const navType = navigationEntries[0]?.type || window.performance?.navigation?.type;
  const isReload = navType === 'reload' || navType === 1;

  if (isReload && state.activeView === 'favorites') {
    openFavoritesView();
  }

  const adminPanelOpen = ssGet('mkt_adminPanelOpen');
  if (adminPanelOpen && state.user?.role === 'admin') {
    openAdminPanel();
    // if a product form draft was open, restore it
    const pformOpen = ssGet('mkt_admin_pform_open');
    if (pformOpen) import('./admin/products.js').then(m => m.openProductForm(null));
  }

  if (state.selectedProduct) {
    openProductModal(state.selectedProduct);
  }
}

document.addEventListener('DOMContentLoaded', init);