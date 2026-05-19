// =============================================================
// main.js — Application entry point
// Import order matters: state first, then utils, then components.
// =============================================================

// ── CSS (Vite picks this up and injects it) ──────────────────
import '../css/main.css';

// ── Core ─────────────────────────────────────────────────────
import { state }                from './state/state.js';
import { SITE_NAME }            from './utils/constants.js';
import { loadFromStorage, saveAll } from './utils/storage.js';

// ── Supabase data layer ───────────────────────────────────────
import { loadProducts }         from './supabase/products-api.js';

// ── UI components ─────────────────────────────────────────────
import { showLoadError, updateCountBadges,
         updateAdminOrdersBadge }          from './components/ui.js';
import { renderCategories, renderMegaMenu,
         renderBrandFilter, renderRatingFilters,
         applyFiltersAndRender }           from './components/filters.js';
import { initPriceRange }                  from './components/price-range.js';
import { initSlider }                      from './components/slider.js';
import { updateAuthUI }                    from './components/auth.js';
import { renderCartUI }                    from './components/cart.js';

// ── Events ────────────────────────────────────────────────────
import { attachEventListeners }            from './events.js';

// ── Admin (registers window.openAdminPanel etc.) ─────────────
import './admin/index.js';

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
}

document.addEventListener('DOMContentLoaded', init);