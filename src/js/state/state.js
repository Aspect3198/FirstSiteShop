// =============================================================
// state/state.js — Single source of truth for runtime state
// =============================================================

export const state = {
  allProducts: [],
  filtered:    [],
  cart:        [],
  favorites:   [],
  user:        null,

  currentCategory: 'all',
  searchQuery:     '',

  filters: {
    priceMin:     0,
    priceMax:     100000,
    brands:       [],
    minRating:    0,
    inStockOnly:  false,
    discountOnly: false,
  },

  sortBy:   'popular',
  viewMode: 'grid',
  page:     1,
  perPage:  12,
  activeView: 'catalog',

  sliderIndex: 0,
  sliderTimer: null,
  adminSection: 'dashboard',
  // persisted UI / selection
  selectedProduct: null,
};