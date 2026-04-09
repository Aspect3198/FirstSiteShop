/* ===================================================
   MARKETPLACE — script.js
   Full-featured marketplace logic
   =================================================== */

'use strict';

// =============================================
// STATE
// =============================================
const state = {
  allProducts: [],
  filtered: [],
  cart: [],
  favorites: [],
  user: null,
  currentCategory: 'all',
  searchQuery: '',
  filters: {
    priceMin: 0,
    priceMax: 100000,
    brands: [],
    minRating: 0,
    inStockOnly: false,
    discountOnly: false,
  },
  sortBy: 'popular',
  viewMode: 'grid',
  page: 1,
  perPage: 12,
  sliderIndex: 0,
  sliderTimer: null,
};

const CATEGORIES = [
  { id: 'all',       label: 'Всі товари',         icon: '🏪' },
  { id: 'tv',        label: 'Телевізори',          icon: '📺' },
  { id: 'smartphones', label: 'Смартфони',         icon: '📱' },
  { id: 'computers', label: 'Ноутбуки та ПК',      icon: '💻' },
  { id: 'gaming',    label: 'Ігри та консолі',     icon: '🎮' },
  { id: 'audio',     label: 'Аудіо',               icon: '🎧' },
  { id: 'appliances',label: 'Побутова техніка',    icon: '🏠' },
  { id: 'clothing',  label: 'Одяг та взуття',      icon: '👟' },
  { id: 'sports',    label: 'Спорт',               icon: '💪' },
  { id: 'food',      label: 'Їжа та напої',        icon: '🥗' },
  { id: 'beauty',    label: 'Краса та здоров\'я',  icon: '💄' },
];

// =============================================
// INIT
// =============================================
async function init() {
  await loadProducts();
  loadFromStorage();
  renderCategories();
  renderMegaMenu();
  renderBrandFilter();
  renderRatingFilters();
  applyFiltersAndRender();
  initSlider();
  initPriceRange();
  attachEventListeners();
  updateCountBadges();
}

// =============================================
// DATA LOADING
// =============================================
async function loadProducts() {
  try {
    const res = await fetch('./data/products.json');
    if (!res.ok) throw new Error('Failed to load products');
    state.allProducts = await res.json();
  } catch (e) {
    // Inline fallback data for environments without a server
    state.allProducts = getInlineProducts();
  }
}

// =============================================
// STORAGE
// =============================================
function saveToStorage() {
  try {
    localStorage.setItem('mkt_cart', JSON.stringify(state.cart));
    localStorage.setItem('mkt_fav', JSON.stringify(state.favorites));
    if (state.user) localStorage.setItem('mkt_user', JSON.stringify(state.user));
  } catch (e) { /* quota exceeded */ }
}

function loadFromStorage() {
  try {
    const cart = localStorage.getItem('mkt_cart');
    const fav  = localStorage.getItem('mkt_fav');
    const user = localStorage.getItem('mkt_user');
    if (cart) state.cart      = JSON.parse(cart);
    if (fav)  state.favorites = JSON.parse(fav);
    if (user) {
      state.user = JSON.parse(user);
      updateAuthUI();
    }
  } catch (e) {}
}

// =============================================
// RENDER CATEGORIES SIDEBAR
// =============================================
function renderCategories() {
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
         data-cat="${cat.id}" onclick="filterByCategory('${cat.id}'); return false;">
        <span>${cat.icon} ${cat.label}</span>
        <span class="cat-count">${counts[cat.id]}</span>
      </a>
    </li>
  `).join('');
}

function renderMegaMenu() {
  const el = document.getElementById('catalogCats');
  if (!el) return;
  el.innerHTML = CATEGORIES.filter(c => c.id !== 'all').map(cat => `
    <li><a href="#" onclick="filterByCategory('${cat.id}'); closeCatalog(); return false;">
      <span class="cat-ico">${cat.icon}</span> ${cat.label}
    </a></li>
  `).join('');
}

function renderBrandFilter() {
  const el = document.getElementById('brandList');
  if (!el) return;
  const brands = [...new Set(state.allProducts.map(p => p.brand))].sort();
  el.innerHTML = brands.map(b => `
    <label class="brand-check-item">
      <input type="checkbox" class="brand-cb" value="${b}" ${state.filters.brands.includes(b) ? 'checked' : ''}>
      <span class="checkmark"></span>
      <span class="brand-name">${b}</span>
      <span class="brand-count">${state.allProducts.filter(p=>p.brand===b).length}</span>
    </label>
  `).join('');
}

function renderRatingFilters() {
  const el = document.getElementById('ratingFilters');
  if (!el) return;
  const levels = [4, 3, 2, 1];
  el.innerHTML = levels.map(r => `
    <div class="rating-filter-item ${state.filters.minRating === r ? 'active' : ''}"
         onclick="setRatingFilter(${r})">
      <div class="stars-mini">${renderStarsMini(r)}</div>
      <span>та вище</span>
      <span class="rating-filter-count">${state.allProducts.filter(p=>p.rating>=r).length}</span>
    </div>
  `).join('');
}

function renderStarsMini(rating) {
  return Array.from({length:5}, (_,i) =>
    `<span class="star-mini">${i < rating ? '⭐' : '☆'}</span>`
  ).join('');
}

// =============================================
// FILTER & SORT LOGIC
// =============================================
function applyFiltersAndRender() {
  let products = [...state.allProducts];

  // Category
  if (state.currentCategory !== 'all') {
    products = products.filter(p => p.category === state.currentCategory);
  }

  // Search
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  // Price
  products = products.filter(p =>
    p.price >= state.filters.priceMin && p.price <= state.filters.priceMax
  );

  // Brands
  if (state.filters.brands.length > 0) {
    products = products.filter(p => state.filters.brands.includes(p.brand));
  }

  // Rating
  if (state.filters.minRating > 0) {
    products = products.filter(p => p.rating >= state.filters.minRating);
  }

  // In stock
  if (state.filters.inStockOnly) {
    products = products.filter(p => p.inStock);
  }

  // Discount only
  if (state.filters.discountOnly) {
    products = products.filter(p => p.discount > 0);
  }

  // Sort
  products = sortProducts(products);

  state.filtered = products;
  state.page = 1;
  renderProductGrid();
  renderResultsInfo();
  renderActiveFilterTags();
  renderCategories(); // refresh counts
}

function sortProducts(products) {
  const sorted = [...products];
  switch (state.sortBy) {
    case 'price-asc':  return sorted.sort((a,b) => a.price - b.price);
    case 'price-desc': return sorted.sort((a,b) => b.price - a.price);
    case 'rating':     return sorted.sort((a,b) => b.rating - a.rating);
    case 'discount':   return sorted.sort((a,b) => b.discount - a.discount);
    case 'newest':     return sorted.sort((a,b) => b.id - a.id);
    case 'popular':
    default:           return sorted.sort((a,b) => b.popular - a.popular);
  }
}

function filterByCategory(catId) {
  state.currentCategory = catId;
  state.searchQuery = '';
  document.getElementById('searchInput').value = '';
  applyFiltersAndRender();
  // Scroll to top of content
  document.getElementById('productGrid').scrollIntoView({behavior:'smooth', block:'start'});
}
window.filterByCategory = filterByCategory;

function resetAll() {
  state.currentCategory = 'all';
  state.searchQuery = '';
  state.filters = { priceMin:0, priceMax:100000, brands:[], minRating:0, inStockOnly:false, discountOnly:false };
  state.sortBy = 'popular';
  document.getElementById('searchInput').value = '';
  document.getElementById('priceMin').value = '';
  document.getElementById('priceMax').value = '';
  document.getElementById('rangeMin').value = 0;
  document.getElementById('rangeMax').value = 100000;
  document.getElementById('inStockOnly').checked = false;
  document.getElementById('discountOnly').checked = false;
  document.getElementById('sortSelect').value = 'popular';
  renderBrandFilter();
  renderRatingFilters();
  updateRangeFill();
  applyFiltersAndRender();
}
window.resetAll = resetAll;

function setRatingFilter(r) {
  state.filters.minRating = state.filters.minRating === r ? 0 : r;
  renderRatingFilters();
}
window.setRatingFilter = setRatingFilter;

// =============================================
// RENDER PRODUCT GRID
// =============================================
function renderProductGrid() {
  const grid    = document.getElementById('productGrid');
  const empty   = document.getElementById('emptyState');
  const loadBtn = document.getElementById('loadMoreBtn');
  const loadWrap= document.getElementById('loadMoreWrap');

  if (!grid) return;

  const visible = state.filtered.slice(0, state.page * state.perPage);
  const hasMore = state.filtered.length > visible.length;

  if (state.filtered.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    loadWrap.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  grid.className = `product-grid${state.viewMode === 'list' ? ' list-view' : ''}`;
  grid.innerHTML = visible.map((p, i) => renderCard(p, i)).join('');

  loadBtn.classList.toggle('hidden', !hasMore);
  loadWrap.classList.toggle('hidden', !hasMore);
}

function renderCard(product, animIndex = 0) {
  const inCart = state.cart.some(c => c.id === product.id);
  const isFav  = state.favorites.includes(product.id);
  const discount = product.discount > 0;
  const starsHtml = renderStars(product.rating);
  const delay = Math.min(animIndex * 40, 400);

  return `
  <div class="product-card ${!product.inStock ? 'out-of-stock' : ''}"
       style="animation-delay:${delay}ms"
       onclick="openProductModal(${product.id})"
       data-id="${product.id}">
    ${discount ? `<span class="discount-badge">-${product.discount}%</span>` : ''}
    <button class="wishlist-btn ${isFav ? 'active' : ''}"
            onclick="event.stopPropagation(); toggleFavorite(${product.id})"
            aria-label="Додати в обране" title="Обране">
      <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
    <div class="card-img-wrap">
      <img src="${product.image}" alt="${product.name}" loading="lazy"
           onerror="this.src='https://picsum.photos/seed/${product.id}/400/400'">
    </div>
    <div class="card-body">
      <p class="card-brand">${product.brand}</p>
      <h3 class="card-name">${product.name}</h3>
      <div class="card-rating">
        <div class="stars">${starsHtml}</div>
        <span class="review-count">(${product.reviews.toLocaleString('uk')})</span>
      </div>
      <div class="card-prices">
        <span class="price-new">${product.price.toLocaleString('uk')} ₴</span>
        ${product.oldPrice ? `<span class="price-old">${product.oldPrice.toLocaleString('uk')} ₴</span>` : ''}
      </div>
      <div class="card-footer">
        <button class="add-cart-btn ${inCart ? 'in-cart' : ''}"
                onclick="event.stopPropagation(); addToCart(${product.id})"
                ${!product.inStock ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          ${inCart ? 'В кошику' : 'Купити'}
        </button>
      </div>
    </div>
  </div>`;
}

function renderStars(rating) {
  return Array.from({length:5}, (_,i) => {
    if (i < Math.floor(rating)) return `<span class="star filled">★</span>`;
    if (i < rating) return `<span class="star half">★</span>`;
    return `<span class="star">☆</span>`;
  }).join('');
}

function renderResultsInfo() {
  const el = document.getElementById('resultsInfo');
  if (!el) return;
  const total = state.filtered.length;
  const shown = Math.min(state.page * state.perPage, total);
  const catName = CATEGORIES.find(c => c.id === state.currentCategory)?.label || 'Всі товари';
  el.innerHTML = `<strong>${catName}</strong> — знайдено <strong>${total}</strong> товарів (показано ${shown})`;
}

// =============================================
// ACTIVE FILTER TAGS
// =============================================
function renderActiveFilterTags() {
  const el = document.getElementById('activeFilters');
  if (!el) return;
  const tags = [];
  if (state.currentCategory !== 'all') {
    const cat = CATEGORIES.find(c => c.id === state.currentCategory);
    tags.push({ label: cat?.label, clear: () => filterByCategory('all') });
  }
  if (state.searchQuery) {
    tags.push({ label: `🔍 "${state.searchQuery}"`, clear: () => { state.searchQuery=''; document.getElementById('searchInput').value=''; applyFiltersAndRender(); } });
  }
  if (state.filters.priceMin > 0 || state.filters.priceMax < 100000) {
    tags.push({ label: `${state.filters.priceMin.toLocaleString()} – ${state.filters.priceMax.toLocaleString()} ₴`, clear: () => { state.filters.priceMin=0; state.filters.priceMax=100000; applyFiltersAndRender(); } });
  }
  state.filters.brands.forEach(b => {
    tags.push({ label: b, clear: () => { state.filters.brands = state.filters.brands.filter(x=>x!==b); renderBrandFilter(); applyFiltersAndRender(); } });
  });
  if (state.filters.minRating > 0) {
    tags.push({ label: `⭐ ${state.filters.minRating}+`, clear: () => { state.filters.minRating=0; renderRatingFilters(); applyFiltersAndRender(); } });
  }
  if (state.filters.inStockOnly) tags.push({ label: 'В наявності', clear: () => { state.filters.inStockOnly=false; document.getElementById('inStockOnly').checked=false; applyFiltersAndRender(); } });
  if (state.filters.discountOnly) tags.push({ label: 'Зі знижкою', clear: () => { state.filters.discountOnly=false; document.getElementById('discountOnly').checked=false; applyFiltersAndRender(); } });

  el.innerHTML = tags.map((t, i) => `
    <span class="filter-tag">${t.label}
      <button onclick="(${t.clear.toString()})()" title="Видалити">✕</button>
    </span>`).join('');
}

// =============================================
// CART
// =============================================
function addToCart(productId) {
  const product = state.allProducts.find(p => p.id === productId);
  if (!product) return;
  if (!product.inStock) { showToast('Товар відсутній', 'Вибачте, товар закінчився', 'error'); return; }

  const existing = state.cart.find(c => c.id === productId);
  if (existing) {
    existing.qty = Math.min(existing.qty + 1, 99);
    showToast('Кількість збільшено', `${truncate(product.name, 32)} ×${existing.qty}`, 'info');
  } else {
    state.cart.push({ id: productId, qty: 1 });
    showToast('Додано до кошика', truncate(product.name, 40), 'success');
  }

  saveToStorage();
  updateCountBadges();
  renderCartUI();
  updateCardCartState(productId, true);
}

function removeFromCart(productId) {
  const product = state.allProducts.find(p => p.id === productId);
  state.cart = state.cart.filter(c => c.id !== productId);
  saveToStorage();
  updateCountBadges();
  renderCartUI();
  updateCardCartState(productId, false);
  if (product) showToast('Видалено', truncate(product.name, 36), 'warning');
}

function updateQty(productId, delta) {
  const item = state.cart.find(c => c.id === productId);
  if (!item) return;
  item.qty = Math.max(1, Math.min(99, item.qty + delta));
  if (delta < 0 && item.qty < 1) return removeFromCart(productId);
  saveToStorage();
  renderCartUI();
}

function clearCart() {
  state.cart = [];
  saveToStorage();
  updateCountBadges();
  renderCartUI();
  showToast('Кошик очищено', 'Всі товари видалено', 'info');
}

function renderCartUI() {
  const itemsEl   = document.getElementById('cartItems');
  const emptyEl   = document.getElementById('cartEmptyMsg');
  const footerEl  = document.getElementById('cartFooter');
  const countEl   = document.getElementById('cartItemsCount');
  const totalEl   = document.getElementById('cartTotalPrice');
  const discountEl= document.getElementById('cartDiscount');

  if (!itemsEl) return;

  if (state.cart.length === 0) {
    itemsEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    footerEl.classList.add('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  footerEl.classList.remove('hidden');

  let total = 0, savedTotal = 0, itemCount = 0;

  itemsEl.innerHTML = state.cart.map(item => {
    const p = state.allProducts.find(x => x.id === item.id);
    if (!p) return '';
    const linePrice = p.price * item.qty;
    const lineOld   = (p.oldPrice || p.price) * item.qty;
    total += linePrice;
    savedTotal += lineOld - linePrice;
    itemCount += item.qty;

    return `
    <div class="cart-item" data-id="${p.id}">
      <img class="cart-item-img" src="${p.image}" alt="${p.name}"
           onerror="this.src='https://picsum.photos/seed/${p.id}/100/100'">
      <div class="cart-item-info">
        <div class="cart-item-name">${p.name}</div>
        <div class="cart-item-price">${linePrice.toLocaleString('uk')} ₴</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="updateQty(${p.id}, -1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty(${p.id}, 1)">+</button>
          <button class="remove-item-btn" onclick="removeFromCart(${p.id})" title="Видалити">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    </div>`;
  }).join('');

  countEl.textContent  = itemCount;
  totalEl.textContent  = total.toLocaleString('uk') + ' ₴';
  discountEl.textContent = '-' + savedTotal.toLocaleString('uk') + ' ₴';
}

function updateCardCartState(productId, inCart) {
  const cards = document.querySelectorAll(`.product-card[data-id="${productId}"] .add-cart-btn`);
  cards.forEach(btn => {
    btn.classList.toggle('in-cart', inCart);
    btn.innerHTML = inCart
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> В кошику`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> Купити`;
  });
}

// =============================================
// FAVORITES
// =============================================
function toggleFavorite(productId) {
  const idx = state.favorites.indexOf(productId);
  const product = state.allProducts.find(p => p.id === productId);
  if (idx === -1) {
    state.favorites.push(productId);
    showToast('Додано до обраного', truncate(product?.name || '', 36), 'success');
  } else {
    state.favorites.splice(idx, 1);
    showToast('Видалено з обраного', truncate(product?.name || '', 36), 'warning');
  }
  saveToStorage();
  updateCountBadges();
  // Update wishlist buttons
  document.querySelectorAll(`.product-card[data-id="${productId}"] .wishlist-btn`).forEach(btn => {
    const isFav = state.favorites.includes(productId);
    btn.classList.toggle('active', isFav);
    btn.querySelector('svg').setAttribute('fill', isFav ? 'currentColor' : 'none');
  });
}

// =============================================
// COUNT BADGES
// =============================================
function updateCountBadges() {
  const cartTotal = state.cart.reduce((a, c) => a + c.qty, 0);
  const favTotal  = state.favorites.length;

  const cartBadge = document.getElementById('cartCount');
  const favBadge  = document.getElementById('favCount');

  if (cartBadge) {
    cartBadge.textContent = cartTotal;
    cartBadge.classList.toggle('visible', cartTotal > 0);
  }
  if (favBadge) {
    favBadge.textContent = favTotal;
    favBadge.classList.toggle('visible', favTotal > 0);
  }
}

// =============================================
// CART SIDEBAR OPEN/CLOSE
// =============================================
function openCart() {
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('overlay').classList.add('active');
  renderCartUI();
}

function closeCart() {
  document.getElementById('cartSidebar').classList.remove('open');
  if (!document.querySelector('.sidebar.open')) {
    document.getElementById('overlay').classList.remove('active');
  }
}

// =============================================
// PRODUCT MODAL
// =============================================
function openProductModal(productId) {
  const product = state.allProducts.find(p => p.id === productId);
  if (!product) return;

  const modal    = document.getElementById('productModal');
  const backdrop = document.getElementById('modalBackdrop');
  const body     = document.getElementById('modalBody');
  const inCart   = state.cart.some(c => c.id === productId);
  const isFav    = state.favorites.includes(productId);
  const saved    = product.oldPrice ? product.oldPrice - product.price : 0;
  const specs    = product.specs || {};

  body.innerHTML = `
    <div class="modal-gallery">
      <img class="modal-main-img" id="modalMainImg" src="${product.image}" alt="${product.name}"
           onerror="this.src='https://picsum.photos/seed/${product.id}/800/600'">
      ${product.images && product.images.length > 1 ? `
        <div class="modal-thumbs">
          ${product.images.map((img,i) => `
            <img class="modal-thumb ${i===0?'active':''}" src="${img}" alt="${product.name} ${i+1}"
                 onclick="switchModalImg('${img}', this)">
          `).join('')}
        </div>` : ''}
    </div>
    <div class="modal-info">
      <p class="modal-brand">${product.brand}</p>
      <h2 class="modal-title">${product.name}</h2>
      <div class="modal-rating">
        <div class="stars">${renderStars(product.rating)}</div>
        <span class="modal-review-count">${product.reviews.toLocaleString('uk')} відгуків</span>
        ${product.inStock
          ? '<span style="color:var(--accent);font-size:12px;font-weight:700">✓ В наявності</span>'
          : '<span style="color:#ff4d4d;font-size:12px;font-weight:700">✗ Немає в наявності</span>'}
      </div>
      <div class="modal-price-wrap">
        <span class="modal-price">${product.price.toLocaleString('uk')} ₴</span>
        ${product.oldPrice ? `<span class="modal-old-price">${product.oldPrice.toLocaleString('uk')} ₴</span>` : ''}
      </div>
      ${saved > 0 ? `<p class="modal-save">Ви економите ${saved.toLocaleString('uk')} ₴ (${product.discount}%)</p>` : ''}
      <p class="modal-desc">${product.description}</p>
      ${Object.keys(specs).length > 0 ? `
        <div class="modal-specs">
          <h4>Характеристики</h4>
          ${Object.entries(specs).map(([k,v]) => `
            <div class="spec-row">
              <span class="spec-key">${k}</span>
              <span class="spec-val">${v}</span>
            </div>`).join('')}
        </div>` : ''}
      <div class="modal-actions">
        <button class="modal-cart-btn ${inCart ? 'in-cart' : ''}" onclick="addToCart(${productId}); closeModal();">
          ${inCart ? '✓ В кошику' : '🛒 Додати до кошика'}
        </button>
        <button class="modal-wish-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(${productId}); this.classList.toggle('active');" title="Обране">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
    </div>`;

  modal.classList.add('active');
  backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('productModal').classList.remove('active');
  document.getElementById('modalBackdrop').classList.remove('active');
  document.body.style.overflow = '';
}
window.closeModal = closeModal;

function switchModalImg(src, thumbEl) {
  document.getElementById('modalMainImg').src = src;
  document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
}
window.switchModalImg = switchModalImg;

// =============================================
// SEARCH (LIVE)
// =============================================
function handleSearch(query) {
  state.searchQuery = query;
  applyFiltersAndRender();
  renderSearchDropdown(query);
}

function renderSearchDropdown(query) {
  const dropdown = document.getElementById('searchDropdown');
  if (!dropdown) return;

  if (!query.trim()) {
    dropdown.classList.remove('open');
    return;
  }

  const q = query.toLowerCase();
  const matches = state.allProducts
    .filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
    .slice(0, 6);

  if (matches.length === 0) {
    dropdown.classList.remove('open');
    return;
  }

  dropdown.innerHTML = matches.map(p => `
    <div class="search-item" onclick="openProductModal(${p.id}); closeSearchDropdown();">
      <img class="search-item-img" src="${p.image}" alt="${p.name}" onerror="this.src='https://picsum.photos/seed/${p.id}/80/80'">
      <span class="search-item-name">${highlightMatch(p.name, q)}</span>
      <span class="search-item-price">${p.price.toLocaleString('uk')} ₴</span>
    </div>`).join('');

  dropdown.classList.add('open');
}

function closeSearchDropdown() {
  const d = document.getElementById('searchDropdown');
  if (d) d.classList.remove('open');
}
window.closeSearchDropdown = closeSearchDropdown;

function highlightMatch(text, query) {
  const re = new RegExp(`(${escapeRe(query)})`, 'gi');
  return text.replace(re, `<mark style="background:var(--accent-light);color:var(--accent);border-radius:2px">$1</mark>`);
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// =============================================
// BANNER SLIDER
// =============================================
function initSlider() {
  const track = document.getElementById('slidesTrack');
  const slides = track ? track.querySelectorAll('.slide') : [];
  const dotsContainer = document.getElementById('sliderDots');
  const total = slides.length;

  if (!total) return;

  // Create dots
  dotsContainer.innerHTML = Array.from({length: total}, (_, i) =>
    `<span class="dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></span>`
  ).join('');

  startSliderTimer();
}

function goToSlide(idx) {
  const track = document.getElementById('slidesTrack');
  const slides = track ? track.querySelectorAll('.slide') : [];
  const dots   = document.querySelectorAll('.dot');
  const total  = slides.length;

  state.sliderIndex = ((idx % total) + total) % total;
  if (track) track.style.transform = `translateX(-${state.sliderIndex * 100}%)`;
  dots.forEach((d, i) => d.classList.toggle('active', i === state.sliderIndex));
}
window.goToSlide = goToSlide;

function nextSlide() { goToSlide(state.sliderIndex + 1); }
function prevSlide() { goToSlide(state.sliderIndex - 1); }

function startSliderTimer() {
  clearInterval(state.sliderTimer);
  state.sliderTimer = setInterval(nextSlide, 5000);
}

function pauseSlider() { clearInterval(state.sliderTimer); }

// =============================================
// PRICE RANGE SLIDER
// =============================================
function initPriceRange() {
  const rangeMin = document.getElementById('rangeMin');
  const rangeMax = document.getElementById('rangeMax');
  const priceMin = document.getElementById('priceMin');
  const priceMax = document.getElementById('priceMax');

  if (!rangeMin || !rangeMax) return;

  const prices = state.allProducts.map(p => p.price);
  const maxVal = Math.max(...prices, 100000);
  rangeMin.max = maxVal;
  rangeMax.max = maxVal;
  rangeMax.value = maxVal;

  updateRangeFill();
}

function updateRangeFill() {
  const rangeMin = document.getElementById('rangeMin');
  const rangeMax = document.getElementById('rangeMax');
  const fill     = document.getElementById('rangeFill');
  if (!rangeMin || !rangeMax || !fill) return;

  const minVal = +rangeMin.value;
  const maxVal = +rangeMax.value;
  const max    = +rangeMax.max || 100000;
  const leftPct  = (minVal / max) * 100;
  const rightPct = (maxVal / max) * 100;

  fill.style.left  = leftPct + '%';
  fill.style.width = (rightPct - leftPct) + '%';

  const priceMin = document.getElementById('priceMin');
  const priceMax = document.getElementById('priceMax');
  if (priceMin) priceMin.value = minVal;
  if (priceMax) priceMax.value = maxVal;
}

// =============================================
// AUTH
// =============================================
function openAuthModal() {
  if (state.user) {
    // Show logout option
    showToast(`Привіт, ${state.user.name}!`, 'Натисніть ще раз для виходу', 'info');
    // Second click logic
    document.getElementById('authBtn').onclick = () => {
      if (confirm(`Вийти з акаунту ${state.user.name}?`)) logout();
    };
    return;
  }
  document.getElementById('authModal').classList.add('active');
  document.getElementById('authBtn').onclick = openAuthModal;
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('active');
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(tab === 'login' ? 'loginPanel' : 'registerPanel').classList.add('active');
}

function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPassword').value;

  if (!email || !pass) {
    showToast('Помилка', 'Заповніть всі поля', 'error');
    return;
  }

  // Demo auth (check against hardcoded users)
  const demoUsers = [
    { id:1, name:'Олексій Коваленко', email:'alex@example.com', password:'password123' },
    { id:2, name:'Марія Іваненко',    email:'maria@example.com', password:'maria2024' },
  ];

  const user = demoUsers.find(u => u.email === email && u.password === pass);
  if (!user) {
    showToast('Помилка входу', 'Невірний email або пароль', 'error');
    return;
  }

  state.user = { id: user.id, name: user.name, email: user.email };
  saveToStorage();
  updateAuthUI();
  closeAuthModal();
  showToast(`Вітаємо, ${user.name}!`, 'Ви успішно увійшли', 'success');
}

function register() {
  const name  = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass  = document.getElementById('regPassword').value;

  if (!name || !email || !pass) {
    showToast('Помилка', 'Заповніть всі поля', 'error');
    return;
  }
  if (pass.length < 6) {
    showToast('Помилка', 'Пароль має бути мінімум 6 символів', 'error');
    return;
  }

  state.user = { id: Date.now(), name, email };
  saveToStorage();
  updateAuthUI();
  closeAuthModal();
  showToast(`Вітаємо, ${name}!`, 'Реєстрація успішна', 'success');
}

function logout() {
  state.user = null;
  localStorage.removeItem('mkt_user');
  updateAuthUI();
  showToast('До побачення!', 'Ви вийшли з акаунту', 'info');
  document.getElementById('authBtn').onclick = openAuthModal;
}

function updateAuthUI() {
  const label = document.getElementById('authLabel');
  if (label) {
    label.textContent = state.user ? state.user.name.split(' ')[0] : 'Увійти';
  }
  const btn = document.getElementById('authBtn');
  if (btn) btn.classList.toggle('logged-in', !!state.user);
}

// =============================================
// TOAST NOTIFICATIONS
// =============================================
const TOAST_ICONS = { success:'✓', error:'✕', info:'ℹ', warning:'⚠' };

function showToast(title, message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${TOAST_ICONS[type] || 'ℹ'}</div>
    <div class="toast-text">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>
    <button class="toast-close" onclick="removeToast(this.parentElement)">✕</button>`;

  container.appendChild(toast);

  const timer = setTimeout(() => removeToast(toast), duration);
  toast._timer = timer;

  // Limit toasts on screen
  const toasts = container.querySelectorAll('.toast');
  if (toasts.length > 5) removeToast(toasts[0]);
}

function removeToast(el) {
  if (!el || !el.parentElement) return;
  clearTimeout(el._timer);
  el.classList.add('removing');
  setTimeout(() => el.remove(), 300);
}
window.removeToast = removeToast;

// =============================================
// UTILITY
// =============================================
function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

function closeCatalog() {
  document.getElementById('catalogMega').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
}
window.closeCatalog = closeCatalog;

// =============================================
// EVENT LISTENERS
// =============================================
function attachEventListeners() {
  // Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', e => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => handleSearch(e.target.value), 300);
    });
    searchInput.addEventListener('focus', e => {
      if (e.target.value) renderSearchDropdown(e.target.value);
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.search-wrap')) closeSearchDropdown();
    });
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { closeSearchDropdown(); searchInput.blur(); }
      if (e.key === 'Escape') { searchInput.value=''; handleSearch(''); closeSearchDropdown(); }
    });
  }

  document.getElementById('searchSubmit')?.addEventListener('click', () => {
    handleSearch(searchInput.value);
    closeSearchDropdown();
  });

  // Sort
  document.getElementById('sortSelect')?.addEventListener('change', e => {
    state.sortBy = e.target.value;
    applyFiltersAndRender();
  });

  // View Toggle
  document.getElementById('gridViewBtn')?.addEventListener('click', () => {
    state.viewMode = 'grid';
    document.getElementById('gridViewBtn').classList.add('active');
    document.getElementById('listViewBtn').classList.remove('active');
    renderProductGrid();
  });
  document.getElementById('listViewBtn')?.addEventListener('click', () => {
    state.viewMode = 'list';
    document.getElementById('listViewBtn').classList.add('active');
    document.getElementById('gridViewBtn').classList.remove('active');
    renderProductGrid();
  });

  // Cart
  document.getElementById('cartBtn')?.addEventListener('click', openCart);
  document.getElementById('closeCartBtn')?.addEventListener('click', closeCart);
  document.getElementById('clearCartBtn')?.addEventListener('click', clearCart);
  document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    if (state.cart.length === 0) { showToast('Кошик порожній', 'Додайте товари перед оформленням', 'warning'); return; }
    showToast('Замовлення оформлено!', `Дякуємо! Ми зв'яжемося з вами найближчим часом.`, 'success', 5000);
    closeCart();
    clearCart();
  });

  // Modal
  document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
  document.getElementById('modalBackdrop')?.addEventListener('click', closeModal);

  // Auth
  document.getElementById('authBtn')?.addEventListener('click', openAuthModal);
  document.getElementById('authCloseBtn')?.addEventListener('click', closeAuthModal);
  document.getElementById('loginTabBtn')?.addEventListener('click', () => switchAuthTab('login'));
  document.getElementById('registerTabBtn')?.addEventListener('click', () => switchAuthTab('register'));
  document.getElementById('loginSubmitBtn')?.addEventListener('click', login);
  document.getElementById('registerSubmitBtn')?.addEventListener('click', register);
  // Enter key for auth
  document.getElementById('loginPassword')?.addEventListener('keydown', e => { if (e.key==='Enter') login(); });
  document.getElementById('regPassword')?.addEventListener('keydown', e => { if (e.key==='Enter') register(); });
  // Close auth on backdrop click
  document.getElementById('authModal')?.addEventListener('click', e => {
    if (e.target.id === 'authModal') closeAuthModal();
  });

  // Favorites
  document.getElementById('favoritesBtn')?.addEventListener('click', () => {
    if (state.favorites.length === 0) {
      showToast('Обране порожнє', 'Додайте товари в обране', 'info');
      return;
    }
    // Filter to favorites
    state.currentCategory = 'all';
    state.filtered = state.allProducts.filter(p => state.favorites.includes(p.id));
    renderProductGrid();
    const el = document.getElementById('resultsInfo');
    if (el) el.innerHTML = `<strong>Обране</strong> — ${state.favorites.length} товарів`;
    state.filtered.forEach(p =>
      document.querySelectorAll(`.product-card[data-id="${p.id}"] .wishlist-btn`).forEach(b => b.classList.add('active'))
    );
  });

  // Catalog toggle
  document.getElementById('catalogToggleBtn')?.addEventListener('click', () => {
    const mega = document.getElementById('catalogMega');
    const overlay = document.getElementById('overlay');
    const isOpen = mega.classList.contains('open');
    mega.classList.toggle('open', !isOpen);
    overlay.classList.toggle('active', !isOpen);
  });

  // Burger / Mobile sidebar
  document.getElementById('burgerBtn')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.add('open');
    overlay.classList.add('active');
  });

  // Overlay closes everything
  document.getElementById('overlay')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('catalogMega').classList.remove('open');
    closeCart();
    document.getElementById('overlay').classList.remove('active');
  });

  // Price range inputs
  const rangeMin = document.getElementById('rangeMin');
  const rangeMax = document.getElementById('rangeMax');
  if (rangeMin && rangeMax) {
    rangeMin.addEventListener('input', () => {
      if (+rangeMin.value > +rangeMax.value) rangeMin.value = rangeMax.value;
      updateRangeFill();
    });
    rangeMax.addEventListener('input', () => {
      if (+rangeMax.value < +rangeMin.value) rangeMax.value = rangeMin.value;
      updateRangeFill();
    });
  }
  document.getElementById('priceMin')?.addEventListener('change', e => {
    rangeMin.value = e.target.value;
    updateRangeFill();
  });
  document.getElementById('priceMax')?.addEventListener('change', e => {
    rangeMax.value = e.target.value;
    updateRangeFill();
  });

  // Apply filters button
  document.getElementById('applyFilters')?.addEventListener('click', () => {
    const minInput  = document.getElementById('priceMin');
    const maxInput  = document.getElementById('priceMax');
    const rangeMinEl = document.getElementById('rangeMin');
    const rangeMaxEl = document.getElementById('rangeMax');
    state.filters.priceMin = +rangeMinEl.value || 0;
    state.filters.priceMax = +rangeMaxEl.value || 100000;
    if (minInput.value !== '') state.filters.priceMin = +minInput.value;
    if (maxInput.value !== '') state.filters.priceMax = +maxInput.value;

    const brandCBs = document.querySelectorAll('.brand-cb:checked');
    state.filters.brands = Array.from(brandCBs).map(cb => cb.value);

    state.filters.inStockOnly = document.getElementById('inStockOnly').checked;
    state.filters.discountOnly = document.getElementById('discountOnly').checked;

    applyFiltersAndRender();
    // Close sidebar on mobile
    if (window.innerWidth < 960) {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('overlay').classList.remove('active');
    }
    showToast('Фільтри застосовано', `Знайдено ${state.filtered.length} товарів`, 'info');
  });

  // Reset filters
  document.getElementById('resetFilters')?.addEventListener('click', resetAll);

  // Load more
  document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
    state.page++;
    renderProductGrid();
    renderResultsInfo();
  });

  // Slider arrows
  document.getElementById('sliderPrev')?.addEventListener('click', () => { prevSlide(); startSliderTimer(); });
  document.getElementById('sliderNext')?.addEventListener('click', () => { nextSlide(); startSliderTimer(); });
  document.getElementById('heroSlider')?.addEventListener('mouseenter', pauseSlider);
  document.getElementById('heroSlider')?.addEventListener('mouseleave', startSliderTimer);

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      closeCart();
      closeAuthModal();
    }
  });

  // In-stock / discount checkboxes (live update)
  document.getElementById('inStockOnly')?.addEventListener('change', e => {
    state.filters.inStockOnly = e.target.checked;
  });
  document.getElementById('discountOnly')?.addEventListener('change', e => {
    state.filters.discountOnly = e.target.checked;
  });
}

// =============================================
// INLINE FALLBACK PRODUCT DATA
// (for file:// protocol or no-server environments)
// =============================================
function getInlineProducts() {
  return [
    { id:1, name:"Телевізор TCL 55P7K QLED 4K", category:"tv", brand:"TCL", price:20099, oldPrice:26999, discount:26, rating:4.7, reviews:342, image:"https://picsum.photos/seed/tv55/400/400", images:["https://picsum.photos/seed/tv55/800/600"], description:"Телевізор TCL 55P7K з технологією QLED та підтримкою 4K HDR. Частота оновлення 144 Гц, Google TV.", specs:{"Діагональ":"55\"","Роздільна здатність":"3840×2160 (4K)","Частота":"144 Гц","ОС":"Google TV"}, inStock:true, popular:95, tags:["4K","QLED","Google TV"] },
    { id:2, name:"Apple iPhone 15 Pro 256GB", category:"smartphones", brand:"Apple", price:45999, oldPrice:52999, discount:13, rating:4.9, reviews:1204, image:"https://picsum.photos/seed/iphone15/400/400", images:["https://picsum.photos/seed/iphone15/800/600"], description:"iPhone 15 Pro з чіпом A17 Pro, камерою 48 МП та USB-C з підтримкою USB 3.", specs:{"Чіп":"A17 Pro","Екран":"6.1\" Super Retina XDR","Камера":"48 МП","Пам'ять":"256 GB"}, inStock:true, popular:99, tags:["Apple","iOS","5G"] },
    { id:3, name:"Samsung Galaxy S24 Ultra 512GB", category:"smartphones", brand:"Samsung", price:49999, oldPrice:59999, discount:17, rating:4.8, reviews:876, image:"https://picsum.photos/seed/s24ultra/400/400", images:["https://picsum.photos/seed/s24ultra/800/600"], description:"Samsung Galaxy S24 Ultra з вбудованим S Pen та камерою 200 МП.", specs:{"Чіп":"Snapdragon 8 Gen 3","Екран":"6.8\" Dynamic AMOLED","Камера":"200 МП"}, inStock:true, popular:92, tags:["Samsung","S Pen","AI"] },
    { id:4, name:"Sony PlayStation 5 Slim 1TB", category:"gaming", brand:"Sony", price:23999, oldPrice:27999, discount:14, rating:4.9, reviews:2103, image:"https://picsum.photos/seed/ps5slim/400/400", images:["https://picsum.photos/seed/ps5slim/800/600"], description:"PlayStation 5 Slim — компактніша версія PS5 зі збільшеним накопичувачем 1 ТБ.", specs:{"Накопичувач":"1 TB SSD","Графіка":"4K 120fps","Контролер":"DualSense"}, inStock:true, popular:97, tags:["PS5","4K","DualSense"] },
    { id:5, name:"ASUS ROG Strix G16 RTX 4070", category:"computers", brand:"ASUS", price:68999, oldPrice:79999, discount:14, rating:4.7, reviews:445, image:"https://picsum.photos/seed/rogstrix/400/400", images:["https://picsum.photos/seed/rogstrix/800/600"], description:"Ігровий ноутбук ASUS ROG Strix G16 з RTX 4070, 32 ГБ DDR5 та дисплеєм 240 Гц QHD.", specs:{"Процесор":"Intel i9-14900HX","Відеокарта":"RTX 4070 8GB","RAM":"32 GB DDR5"}, inStock:true, popular:88, tags:["RTX 4070","Gaming"] },
    { id:6, name:"Apple MacBook Pro 14\" M3 Pro", category:"computers", brand:"Apple", price:89999, oldPrice:99999, discount:10, rating:4.9, reviews:678, image:"https://picsum.photos/seed/macbookpro/400/400", images:["https://picsum.photos/seed/macbookpro/800/600"], description:"MacBook Pro 14\" з чіпом M3 Pro та до 18 годин автономної роботи.", specs:{"Чіп":"Apple M3 Pro","RAM":"18 GB","SSD":"512 GB"}, inStock:true, popular:91, tags:["M3 Pro","macOS"] },
    { id:7, name:"Sony WH-1000XM5 Навушники", category:"audio", brand:"Sony", price:12499, oldPrice:15999, discount:22, rating:4.8, reviews:934, image:"https://picsum.photos/seed/sonywh/400/400", images:["https://picsum.photos/seed/sonywh/800/600"], description:"Флагманські навушники Sony WH-1000XM5 з найкращим ANC у класі та 30 годинами роботи.", specs:{"Тип":"Over-ear бездротові","ANC":"Так","Час роботи":"30 год"}, inStock:true, popular:85, tags:["ANC","LDAC"] },
    { id:8, name:"Apple AirPods Pro 2-го покоління", category:"audio", brand:"Apple", price:8999, oldPrice:10999, discount:18, rating:4.7, reviews:1567, image:"https://picsum.photos/seed/airpodspro/400/400", images:["https://picsum.photos/seed/airpodspro/800/600"], description:"AirPods Pro 2 з чіпом H2, адаптивним шумопоглинанням та Lossless Audio.", specs:{"Чіп":"Apple H2","ANC":"Адаптивний","Час роботи":"6 год"}, inStock:true, popular:89, tags:["ANC","H2"] },
    { id:9, name:"Dyson V15 Detect Absolute", category:"appliances", brand:"Dyson", price:21999, oldPrice:27999, discount:21, rating:4.6, reviews:523, image:"https://picsum.photos/seed/dysonv15/400/400", images:["https://picsum.photos/seed/dysonv15/800/600"], description:"Бездротовий пилосос Dyson V15 Detect з лазерним виявленням пилу та 60 хвилинами роботи.", specs:{"Потужність":"240 AW","Час роботи":"60 хв","Фільтрація":"HEPA"}, inStock:true, popular:78, tags:["HEPA","Лазер"] },
    { id:10, name:"Миша A4Tech Bloody W95 Ultra", category:"gaming", brand:"A4Tech", price:1449, oldPrice:1999, discount:27, rating:4.5, reviews:1203, image:"https://picsum.photos/seed/a4tech/400/400", images:["https://picsum.photos/seed/a4tech/800/600"], description:"Ігрова миша A4Tech Bloody W95 Ultra зі швидкістю 16000 DPI та RGB підсвіткою.", specs:{"DPI":"100-16000","Кнопки":"8","RGB":"Так"}, inStock:true, popular:82, tags:["RGB","16000 DPI"] },
    { id:11, name:"Ігровий килимок Hator Tonn S Speed", category:"gaming", brand:"Hator", price:199, oldPrice:null, discount:0, rating:4.4, reviews:456, image:"https://picsum.photos/seed/hatorpad/400/400", images:["https://picsum.photos/seed/hatorpad/800/600"], description:"Ігровий килимок Hator Tonn S Speed з прошитими краями та гумовою основою.", specs:{"Розмір":"360 × 320 мм","Товщина":"3 мм","Тип":"Speed"}, inStock:true, popular:70, tags:["Speed","Gaming"] },
    { id:12, name:"Nike Air Max 270 React", category:"clothing", brand:"Nike", price:4599, oldPrice:5999, discount:23, rating:4.6, reviews:789, image:"https://picsum.photos/seed/nikeair/400/400", images:["https://picsum.photos/seed/nikeair/800/600"], description:"Nike Air Max 270 React з революційною підошвою React і вікном Air.", specs:{"Підошва":"Air Max + React","Матеріал":"Сітка"}, inStock:true, popular:87, tags:["Air Max","React"] },
    { id:13, name:"Adidas Originals Hoodie Trefoil", category:"clothing", brand:"Adidas", price:2499, oldPrice:3299, discount:24, rating:4.5, reviews:334, image:"https://picsum.photos/seed/adidashoodie/400/400", images:["https://picsum.photos/seed/adidashoodie/800/600"], description:"Класичне худі Adidas Originals з логотипом Trefoil та м'якою флісовою підкладкою.", specs:{"Матеріал":"80% бавовна, 20% поліестер","Посадка":"Regular"}, inStock:true, popular:75, tags:["Adidas","Cotton"] },
    { id:14, name:"Протеїн Optimum Nutrition Gold Standard 2.27кг", category:"sports", brand:"Optimum Nutrition", price:3299, oldPrice:3999, discount:17, rating:4.8, reviews:2341, image:"https://picsum.photos/seed/protein/400/400", images:["https://picsum.photos/seed/protein/800/600"], description:"Gold Standard — найпродаваніший протеїн у світі. 24г протеїну на порцію, 5.5г BCAA.", specs:{"Протеїн":"24г / порція","BCAA":"5.5г","Порцій":"74"}, inStock:true, popular:93, tags:["Whey","BCAA"] },
    { id:15, name:"Килимок для йоги Adidas ADYG-10400", category:"sports", brand:"Adidas", price:1299, oldPrice:1799, discount:28, rating:4.4, reviews:567, image:"https://picsum.photos/seed/yogamat/400/400", images:["https://picsum.photos/seed/yogamat/800/600"], description:"Килимок для йоги Adidas товщиною 6 мм з ковзкостійким покриттям.", specs:{"Товщина":"6 мм","Розмір":"173 × 61 см","Матеріал":"NBR"}, inStock:true, popular:68, tags:["Yoga","Fitness"] },
    { id:16, name:"Клавіатура HyperX Alloy Origins 65", category:"computers", brand:"HyperX", price:3999, oldPrice:5299, discount:25, rating:4.7, reviews:723, image:"https://picsum.photos/seed/hyperxkb/400/400", images:["https://picsum.photos/seed/hyperxkb/800/600"], description:"Компактна механічна клавіатура HyperX Alloy Origins 65 з RGB та алюмінієвим корпусом.", specs:{"Перемикачі":"HyperX Red","Розкладка":"65%","Підсвітка":"RGB per-key"}, inStock:true, popular:80, tags:["Mechanical","RGB"] },
    { id:17, name:"Шоколад Spell Dark No Sugar 85г", category:"food", brand:"Spell", price:179, oldPrice:209, discount:14, rating:4.6, reviews:234, image:"https://picsum.photos/seed/chocolate/400/400", images:["https://picsum.photos/seed/chocolate/800/600"], description:"Чорний шоколад Spell 85% без цукру, веганський, без глютену.", specs:{"Какао":"85%","Вага":"85 г","Цукор":"Без цукру"}, inStock:true, popular:65, tags:["Dark","Sugar-free","Vegan"] },
    { id:18, name:"Оливкова олія Borges Extra Light 1л", category:"food", brand:"Borges", price:319, oldPrice:619, discount:48, rating:4.7, reviews:892, image:"https://picsum.photos/seed/oliveoil/400/400", images:["https://picsum.photos/seed/oliveoil/800/600"], description:"Оливкова олія Borges Extra Light для смаження та випічки, вироблена в Іспанії.", specs:{"Об'єм":"1 л","Тип":"Extra Light","Країна":"Іспанія"}, inStock:true, popular:72, tags:["Extra Light","Spain"] },
    { id:19, name:"Крем La Roche-Posay Effaclar", category:"beauty", brand:"La Roche-Posay", price:899, oldPrice:1199, discount:25, rating:4.8, reviews:1456, image:"https://picsum.photos/seed/larocheposay/400/400", images:["https://picsum.photos/seed/larocheposay/800/600"], description:"Крем-гель для жирної шкіри з матуючим ефектом на 24 годин.", specs:{"Тип шкіри":"Жирна","Об'єм":"40 мл"}, inStock:true, popular:86, tags:["Acne","Mattifying"] },
    { id:20, name:"Набір парфумів Chanel N°5 Подарунковий", category:"beauty", brand:"Chanel", price:7499, oldPrice:9299, discount:19, rating:4.9, reviews:345, image:"https://picsum.photos/seed/chaneln5/400/400", images:["https://picsum.photos/seed/chaneln5/800/600"], description:"Подарунковий набір Chanel N°5 EDP 100мл + міні + лосьйон. Іконічний аромат.", specs:{"Концентрація":"Eau de Parfum","Об'єм":"100 мл"}, inStock:true, popular:90, tags:["EDP","Gift Set"] }
  ];
}

// =============================================
// BOOTSTRAP
// =============================================
document.addEventListener('DOMContentLoaded', init);