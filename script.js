'use strict';

import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL = 'https://bkldjrcyncxpfmjsegqq.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_Kqe1m9DtX81brGFAXOa00A_53n-DtK-'; 

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Ваша функція нормалізації (вже перевірена)
function normalizeProduct(row) {
  return {
    ...row,
    oldPrice:    row.old_price    ?? row.oldPrice    ?? null,
    inStock:     row.in_stock     ?? row.inStock     ?? true,
    brand:       row.brand        ?? '',
    discount:    row.discount     ?? 0,
    reviews:     row.reviews      ?? 0,
    popular:     row.popular      ?? 50,
    description: row.description  ?? '',
    images:      row.images       ?? [],
    tags:        row.tags         ?? [],
    specs:       row.specs        ?? {},
  };
}

// 3. Функція для отримання всіх даних з бази
async function fetchAllProducts() {
  try {
    // Зчитуємо всі колонки з таблиці 'products'
    const { data, error } = await db
      .from('products')
      .select('*')
      .order('id', { ascending: true }); // Сортуємо по ID

    if (error) throw error;

    // Нормалізуємо кожен отриманий товар
    const products = data.map(normalizeProduct);

    console.log('Дані успішно зчитано:', products);
    
    // Викликаємо функцію рендеру (відображення) товарів на сторінці
    // Наприклад: renderProducts(products);
    return products;

  } catch (err) {
    console.error('Помилка при зчитуванні даних:', err.message);
  }
}

// 4. Автоматичний запуск при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
  fetchAllProducts();
});

const SITE_NAME        = 'WONDERMARKET';
const ADMIN_SECRET_CODE = 'MARKET2024';

const CATEGORIES = [
  { id:'all',         label:'Всі товари',          icon:'🏪' },
  { id:'tv',          label:'Телевізори',           icon:'📺' },
  { id:'smartphones', label:'Смартфони',            icon:'📱' },
  { id:'computers',   label:'Ноутбуки та ПК',       icon:'💻' },
  { id:'gaming',      label:'Ігри та консолі',      icon:'🎮' },
  { id:'audio',       label:'Аудіо',                icon:'🎧' },
  { id:'appliances',  label:'Побутова техніка',     icon:'🏠' },
  { id:'clothing',    label:'Одяг та взуття',       icon:'👟' },
  { id:'sports',      label:'Спорт',                icon:'💪' },
  { id:'food',        label:'Їжа та напої',         icon:'🥗' },
  { id:'beauty',      label:"Краса та здоров'я",    icon:'💄' },
];

const CAT_LABELS = {
  tv:'Телевізори', smartphones:'Смартфони', computers:'ПК/Ноутбуки',
  gaming:'Ігри', audio:'Аудіо', appliances:'Техніка',
  clothing:'Одяг', sports:'Спорт', food:'Їжа', beauty:'Краса',
};

const ORDER_STATUS_MAP = {
  pending:   { label:'Очікує',     cls:'status-pending'   },
  processing:{ label:'Обробка',    cls:'status-processing' },
  shipped:   { label:'Відправлено',cls:'status-shipped'   },
  delivered: { label:'Доставлено', cls:'status-delivered' },
  cancelled: { label:'Скасовано',  cls:'status-cancelled' },
};


// ================================================================
// STATE
// ================================================================
const state = {
  allProducts: [],
  filtered:    [],
  cart:        [],
  favorites:   [],
  user:        null,
  currentCategory: 'all',
  searchQuery:     '',
  filters: { priceMin:0, priceMax:100000, brands:[], minRating:0, inStockOnly:false, discountOnly:false },
  sortBy:   'popular',
  viewMode: 'grid',
  page:     1,
  perPage:  12,
  sliderIndex: 0,
  sliderTimer: null,
  adminSection: 'dashboard',
};

// ================================================================
// INIT
// ================================================================
// ================================================================
// INIT — ЗАПУСК МАГАЗИНУ
// ================================================================
async function init() {
  document.title = SITE_NAME + ' — Інтернет-магазин';

  try {
    // 1. Зчитуємо та нормалізуємо дані відразу при старті
    await loadProducts(); 
  } catch (err) {
    showLoadError(err.message);
    return; // Зупиняємо ініціалізацію, якщо дані не завантажились
  }

  // 2. Ініціалізуємо інтерфейс, коли дані вже є в пам'яті
  loadFromStorage();
  renderCategories();
  renderMegaMenu();
  renderBrandFilter();
  renderRatingFilters();
  applyFiltersAndRender(); // Ця функція відобразить товари на екрані
  initSlider();
  initPriceRange();
  attachEventListeners();
  updateCountBadges();
  updateAuthUI();
}

// ================================================================
// ЗАВАНТАЖЕННЯ ТА НОРМАЛІЗАЦІЯ
// ================================================================
async function loadProducts() {
  console.log('Початок зчитування даних з Supabase...');
  
  const { data, error } = await db
    .from('products')
    .select('*')
    .order('rating', { ascending: false }); // Сортуємо за рейтингом за замовчуванням

  if (error) {
    throw new Error(`Supabase Error: ${error.message}`);
  }

  if (!Array.isArray(data)) {
    throw new Error('Очікувався масив даних, але отримано щось інше');
  }

  // Використовуємо вашу функцію normalizeProduct для обробки кожного товару
  state.allProducts = data.map(normalizeProduct);
  
  console.log('Дані успішно завантажено та нормалізовано:', state.allProducts.length, 'товарів');
}
// ================================================================
// STORAGE HELPERS
// ================================================================
function lsGet(key)        { try { return JSON.parse(localStorage.getItem(key)); } catch(e){ return null; } }
function lsSet(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch(e){} }
function lsDel(key)        { try { localStorage.removeItem(key); } catch(e){} }

function saveAll() {
  lsSet('mkt_cart',  state.cart);
  lsSet('mkt_fav',   state.favorites);
  if (state.user) lsSet('mkt_user', state.user);
}

function loadFromStorage() {
  const cart = lsGet('mkt_cart');
  const fav  = lsGet('mkt_fav');
  const user = lsGet('mkt_user');
  if (cart) state.cart      = cart;
  if (fav)  state.favorites = fav;
  if (user) state.user      = user;
}

// Registered users DB (persisted in localStorage)
function getUsers()        { return lsGet('mkt_users') || getDefaultUsers(); }
function saveUsers(users)  { lsSet('mkt_users', users); }

function getDefaultUsers() {
  return [
    { id:1, name:'Олексій Коваленко', email:'alex@example.com',  password:'password123', role:'user',  joined:'2023-01-15', orders:3, totalSpent:48320, avatar:'АК' },
    { id:2, name:'Марія Іваненко',    email:'maria@example.com', password:'maria2024',   role:'user',  joined:'2023-06-20', orders:1, totalSpent:21450, avatar:'МІ' },
    { id:3, name:'Адміністратор',     email:'admin@market.ua',   password:'admin2024',   role:'admin', joined:'2021-01-01', orders:0, totalSpent:0,     avatar:'AD' },
  ];
}

// Orders DB
function getOrders()       { return lsGet('mkt_orders') || []; }
function saveOrders(o)     { lsSet('mkt_orders', o); }

// ================================================================
// SIDEBAR — CATEGORIES
// ================================================================
function renderCategories() {
  const list = document.getElementById('catList');
  if (!list) return;
  const counts = {};
  CATEGORIES.forEach(c => { counts[c.id] = c.id==='all' ? state.allProducts.length : state.allProducts.filter(p=>p.category===c.id).length; });
  list.innerHTML = CATEGORIES.map(cat => `
    <li><a href="#" class="cat-link ${state.currentCategory===cat.id?'active':''}" data-cat="${cat.id}">
      <span>${cat.icon} ${cat.label}</span>
      <span class="cat-count">${counts[cat.id]}</span>
    </a></li>`).join('');
  list.querySelectorAll('.cat-link').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); filterByCategory(a.dataset.cat);
  }));
}

function renderMegaMenu() {
  const el = document.getElementById('catalogCats');
  if (!el) return;
  el.innerHTML = CATEGORIES.filter(c=>c.id!=='all').map(cat =>
    `<li><a href="#" onclick="filterByCategory('${cat.id}');closeCatalog();return false;">
      <span class="cat-ico">${cat.icon}</span>${cat.label}</a></li>`).join('');
}

function renderBrandFilter() {
  const el = document.getElementById('brandList');
  if (!el) return;
  const brands = [...new Set(state.allProducts.map(p=>p.brand))].sort();
  el.innerHTML = brands.map(b => `
    <label class="brand-check-item">
      <input type="checkbox" class="brand-cb" value="${b}" ${state.filters.brands.includes(b)?'checked':''}>
      <span class="checkmark"></span>
      <span class="brand-name">${b}</span>
      <span class="brand-count">${state.allProducts.filter(p=>p.brand===b).length}</span>
    </label>`).join('');
}

function renderRatingFilters() {
  const el = document.getElementById('ratingFilters');
  if (!el) return;
  el.innerHTML = [4,3,2,1].map(r => `
    <div class="rating-filter-item ${state.filters.minRating===r?'active':''}" onclick="setRatingFilter(${r})">
      <div class="stars-mini">${'⭐'.repeat(r)}${'☆'.repeat(5-r)}</div>
      <span>та вище</span>
      <span class="rating-filter-count">${state.allProducts.filter(p=>p.rating>=r).length}</span>
    </div>`).join('');
}

// ================================================================
// FILTER & SORT
// ================================================================
function applyFiltersAndRender() {
  let products = [...state.allProducts];
  if (state.currentCategory !== 'all') products = products.filter(p => p.category === state.currentCategory);
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || (p.tags||[]).some(t=>t.toLowerCase().includes(q)));
  }
  products = products.filter(p => p.price >= state.filters.priceMin && p.price <= state.filters.priceMax);
  if (state.filters.brands.length)    products = products.filter(p => state.filters.brands.includes(p.brand));
  if (state.filters.minRating > 0)    products = products.filter(p => p.rating >= state.filters.minRating);
  if (state.filters.inStockOnly)      products = products.filter(p => p.inStock);
  if (state.filters.discountOnly)     products = products.filter(p => p.discount > 0);
  state.filtered = sortProducts(products);
  state.page = 1;
  renderProductGrid();
  renderResultsInfo();
  renderActiveFilterTags();
  renderCategories();
}

function sortProducts(list) {
  const a = [...list];
  switch(state.sortBy) {
    case 'price-asc':  return a.sort((x,y)=>x.price-y.price);
    case 'price-desc': return a.sort((x,y)=>y.price-x.price);
    case 'rating':     return a.sort((x,y)=>y.rating-x.rating);
    case 'discount':   return a.sort((x,y)=>y.discount-x.discount);
    case 'newest':     return a.sort((x,y)=>y.id-x.id);
    default:           return a.sort((x,y)=>y.popular-x.popular);
  }
}

function filterByCategory(catId) {
  state.currentCategory = catId;
  state.searchQuery = '';
  const inp = document.getElementById('searchInput');
  if(inp) inp.value = '';
  applyFiltersAndRender();
  document.getElementById('mainContent')?.scrollIntoView({behavior:'smooth',block:'start'});
}
window.filterByCategory = filterByCategory;

function setRatingFilter(r) { state.filters.minRating = state.filters.minRating===r ? 0 : r; renderRatingFilters(); }
window.setRatingFilter = setRatingFilter;

function resetAll() {
  state.currentCategory='all'; state.searchQuery='';
  state.filters={ priceMin:0, priceMax:100000, brands:[], minRating:0, inStockOnly:false, discountOnly:false };
  state.sortBy='popular';
  const fields = ['searchInput','priceMin','priceMax'];
  fields.forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  const rMin=document.getElementById('rangeMin'), rMax=document.getElementById('rangeMax');
  if(rMin) rMin.value=0; if(rMax) rMax.value=100000;
  ['inStockOnly','discountOnly'].forEach(id=>{ const el=document.getElementById(id); if(el) el.checked=false; });
  const sel=document.getElementById('sortSelect'); if(sel) sel.value='popular';
  renderBrandFilter(); renderRatingFilters(); updateRangeFill();
  applyFiltersAndRender();
}
window.resetAll = resetAll;

// ================================================================
// PRODUCT GRID RENDER
// ================================================================
function renderProductGrid() {
  const grid   = document.getElementById('productGrid');
  const empty  = document.getElementById('emptyState');
  const loadBtn= document.getElementById('loadMoreBtn');
  const loadWrap=document.getElementById('loadMoreWrap');
  if(!grid) return;

  const visible = state.filtered.slice(0, state.page * state.perPage);
  const hasMore = state.filtered.length > visible.length;

  if(state.filtered.length === 0) {
    grid.innerHTML=''; empty.classList.remove('hidden');
    loadBtn.classList.add('hidden'); return;
  }
  empty.classList.add('hidden');
  grid.className = `product-grid${state.viewMode==='list'?' list-view':''}`;
  grid.innerHTML = visible.map((p,i) => renderCard(p,i)).join('');
  loadBtn.classList.toggle('hidden', !hasMore);
}

function renderCard(p, idx=0) {
  const inCart = state.cart.some(c=>c.id===p.id);
  const isFav  = state.favorites.includes(p.id);
  const delay  = Math.min(idx*35, 400);
  const badge  = p.badge ? `<span class="product-badge badge-${p.badge}">${{new:'NEW',sale:'SALE',top:'TOP'}[p.badge]||p.badge}</span>` : '';
  return `
  <div class="product-card ${!p.inStock?'out-of-stock':''}" style="animation-delay:${delay}ms"
       onclick="openProductModal(${p.id})" data-id="${p.id}">
    ${p.discount>0?`<span class="discount-badge">-${p.discount}%</span>`:''}
    ${badge}
    <button class="wishlist-btn ${isFav?'active':''}" onclick="event.stopPropagation();toggleFavorite(${p.id})" title="Обране">
      <svg viewBox="0 0 24 24" fill="${isFav?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    </button>
    <div class="card-img-wrap">
      <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://picsum.photos/seed/${p.id}/400/400'">
    </div>
    <div class="card-body">
      <p class="card-brand">${p.brand}</p>
      <h3 class="card-name">${p.name}</h3>
      <div class="card-rating">
        <div class="stars">${renderStars(p.rating)}</div>
        <span class="review-count">(${(p.reviews||0).toLocaleString('uk')})</span>
      </div>
      <div class="card-prices">
        <span class="price-new">${p.price.toLocaleString('uk')} ₴</span>
        ${p.oldPrice?`<span class="price-old">${p.oldPrice.toLocaleString('uk')} ₴</span>`:''}
      </div>
      <div class="card-footer">
        <button class="add-cart-btn ${inCart?'in-cart':''}"
                onclick="event.stopPropagation();addToCart(${p.id})"
                ${!p.inStock?'disabled':''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          ${inCart?'В кошику':'Купити'}
        </button>
      </div>
    </div>
  </div>`;
}

function renderStars(rating) {
  return Array.from({length:5},(_,i)=>{
    if(i<Math.floor(rating)) return '<span class="star filled">★</span>';
    if(i<rating)             return '<span class="star half">★</span>';
    return '<span class="star">☆</span>';
  }).join('');
}

function renderResultsInfo() {
  const el = document.getElementById('resultsInfo');
  if(!el) return;
  const total = state.filtered.length;
  const shown = Math.min(state.page*state.perPage, total);
  const catName = CATEGORIES.find(c=>c.id===state.currentCategory)?.label||'Всі товари';
  el.innerHTML=`<strong>${catName}</strong> — <strong>${total}</strong> товарів (показано ${shown})`;
}

function renderActiveFilterTags() {
  const el = document.getElementById('activeFilters');
  if(!el) return;
  const tags=[];
  if(state.currentCategory!=='all') {
    const cat=CATEGORIES.find(c=>c.id===state.currentCategory);
    tags.push({label:cat?.label,clear:()=>filterByCategory('all')});
  }
  if(state.searchQuery) tags.push({label:`🔍 "${state.searchQuery}"`,clear:()=>{state.searchQuery='';document.getElementById('searchInput').value='';applyFiltersAndRender();}});
  if(state.filters.priceMin>0||state.filters.priceMax<100000) tags.push({label:`${state.filters.priceMin.toLocaleString()}–${state.filters.priceMax.toLocaleString()} ₴`,clear:()=>{state.filters.priceMin=0;state.filters.priceMax=100000;applyFiltersAndRender();}});
  state.filters.brands.forEach(b=>tags.push({label:b,clear:()=>{state.filters.brands=state.filters.brands.filter(x=>x!==b);renderBrandFilter();applyFiltersAndRender();}}));
  if(state.filters.minRating>0) tags.push({label:`⭐ ${state.filters.minRating}+`,clear:()=>{state.filters.minRating=0;renderRatingFilters();applyFiltersAndRender();}});
  if(state.filters.inStockOnly) tags.push({label:'В наявності',clear:()=>{state.filters.inStockOnly=false;document.getElementById('inStockOnly').checked=false;applyFiltersAndRender();}});
  if(state.filters.discountOnly) tags.push({label:'Зі знижкою',clear:()=>{state.filters.discountOnly=false;document.getElementById('discountOnly').checked=false;applyFiltersAndRender();}});
  el.innerHTML=tags.map(t=>`<span class="filter-tag">${t.label}<button onclick="(${t.clear.toString()})()">✕</button></span>`).join('');
}

// ================================================================
// CART
// ================================================================
function addToCart(productId) {
  const p = state.allProducts.find(x=>x.id===productId);
  if(!p) return;
  if(!p.inStock) { showToast('Немає в наявності','Товар закінчився','error'); return; }
  const existing = state.cart.find(c=>c.id===productId);
  if(existing) {
    existing.qty = Math.min(existing.qty+1, 99);
    showToast('Кількість збільшена',`${trunc(p.name,32)} ×${existing.qty}`,'info');
  } else {
    state.cart.push({id:productId, qty:1});
    showToast('Додано до кошика',trunc(p.name,40),'success');
  }
  saveAll(); updateCountBadges(); renderCartUI(); updateCardCartState(productId,true);
}
window.addToCart = addToCart;  // exposed for inline onclick in dynamically rendered cards

function removeFromCart(productId) {
  const p=state.allProducts.find(x=>x.id===productId);
  state.cart=state.cart.filter(c=>c.id!==productId);
  saveAll(); updateCountBadges(); renderCartUI(); updateCardCartState(productId,false);
  if(p) showToast('Видалено з кошика',trunc(p.name,36),'warning');
}
window.removeFromCart = removeFromCart;  // exposed for inline onclick in cart UI

function updateQty(productId, delta) {
  const item=state.cart.find(c=>c.id===productId);
  if(!item) return;
  item.qty=Math.max(1,Math.min(99,item.qty+delta));
  if(item.qty<1) return removeFromCart(productId);
  saveAll(); renderCartUI();
}
window.updateQty=updateQty;

function clearCart() {
  state.cart=[]; saveAll(); updateCountBadges(); renderCartUI();
  showToast('Кошик очищено','Всі товари видалено','info');
}

function renderCartUI() {
  const itemsEl   =document.getElementById('cartItems');
  const emptyEl   =document.getElementById('cartEmptyMsg');
  const footerEl  =document.getElementById('cartFooter');
  const countEl   =document.getElementById('cartItemsCount');
  const totalEl   =document.getElementById('cartTotalPrice');
  const discEl    =document.getElementById('cartDiscount');
  if(!itemsEl) return;

  if(state.cart.length===0){
    itemsEl.innerHTML=''; emptyEl.classList.remove('hidden'); footerEl.classList.add('hidden'); return;
  }
  emptyEl.classList.add('hidden'); footerEl.classList.remove('hidden');

  let total=0, saved=0, count=0;
  itemsEl.innerHTML=state.cart.map(item=>{
    const p=state.allProducts.find(x=>x.id===item.id);
    if(!p) return '';
    const line=p.price*item.qty; const lineOld=(p.oldPrice||p.price)*item.qty;
    total+=line; saved+=lineOld-line; count+=item.qty;
    return `
    <div class="cart-item">
      <img class="cart-item-img" src="${p.image}" alt="${p.name}" onerror="this.src='https://picsum.photos/seed/${p.id}/80/80'">
      <div class="cart-item-info">
        <div class="cart-item-name">${p.name}</div>
        <div class="cart-item-price">${line.toLocaleString('uk')} ₴</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="updateQty(${p.id},-1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty(${p.id},1)">+</button>
          <button class="remove-item-btn" onclick="removeFromCart(${p.id})">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    </div>`;
  }).join('');

  countEl.textContent=count;
  totalEl.textContent=total.toLocaleString('uk')+' ₴';
  discEl.textContent='-'+saved.toLocaleString('uk')+' ₴';
}

function checkout() {
  if(!state.user){ showToast('Увійдіть','Для замовлення потрібен акаунт','warning'); openAuthModal(); return; }
  if(state.cart.length===0){ showToast('Кошик порожній','Додайте товари','warning'); return; }

  const order = {
    id: 'ORD-'+ Date.now(),
    userId:    state.user.id,
    userName:  state.user.name,
    userEmail: state.user.email,
    date:      new Date().toLocaleDateString('uk-UA'),
    items:     state.cart.map(c=>{
      const p=state.allProducts.find(x=>x.id===c.id);
      return { id:c.id, name:p?.name||'', price:p?.price||0, qty:c.qty, image:p?.image||'' };
    }),
    total: state.cart.reduce((acc,c)=>{
      const p=state.allProducts.find(x=>x.id===c.id);
      return acc+(p?.price||0)*c.qty;
    },0),
    status: 'pending',
  };

  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);

  // Update user order count
  const users = getUsers();
  const u = users.find(x=>x.id===state.user.id);
  if(u){ u.orders=(u.orders||0)+1; u.totalSpent=(u.totalSpent||0)+order.total; saveUsers(users); }

  clearCart();
  closeCart();
  showToast('Замовлення оформлено!', `№ ${order.id} — ${order.total.toLocaleString('uk')} ₴`, 'success', 5000);
  updateAdminOrdersBadge();
}

function updateCardCartState(productId, inCart) {
  document.querySelectorAll(`.product-card[data-id="${productId}"] .add-cart-btn`).forEach(btn=>{
    btn.classList.toggle('in-cart', inCart);
    btn.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>${inCart?'В кошику':'Купити'}`;
  });
}

// ================================================================
// FAVORITES
// ================================================================
function toggleFavorite(productId) {
  const idx=state.favorites.indexOf(productId);
  const p=state.allProducts.find(x=>x.id===productId);
  if(idx===-1){ state.favorites.push(productId); showToast('Додано до обраного',trunc(p?.name||'',36),'success'); }
  else        { state.favorites.splice(idx,1);    showToast('Видалено з обраного',trunc(p?.name||'',36),'warning'); }
  saveAll(); updateCountBadges();
  document.querySelectorAll(`.product-card[data-id="${productId}"] .wishlist-btn`).forEach(btn=>{
    const isFav=state.favorites.includes(productId);
    btn.classList.toggle('active',isFav);
    btn.querySelector('svg').setAttribute('fill',isFav?'currentColor':'none');
  });
  updateUserMenuStats();
}
window.toggleFavorite = toggleFavorite;  // exposed for inline onclick in dynamically rendered cards

function openFavoritesView() {
  state.filtered=state.allProducts.filter(p=>state.favorites.includes(p.id));
  const grid=document.getElementById('productGrid');
  const empty=document.getElementById('emptyState');
  if(state.filtered.length===0){ grid.innerHTML=''; empty.classList.remove('hidden'); }
  else{ empty.classList.add('hidden'); grid.className='product-grid'; grid.innerHTML=state.filtered.map((p,i)=>renderCard(p,i)).join(''); }
  const info=document.getElementById('resultsInfo');
  if(info) info.innerHTML=`<strong>Обране</strong> — <strong>${state.favorites.length}</strong> товарів`;
}
window.openFavoritesView=openFavoritesView;

// ================================================================
// COUNT BADGES
// ================================================================
function updateCountBadges() {
  const cartTotal=state.cart.reduce((a,c)=>a+c.qty,0);
  const favTotal=state.favorites.length;
  const cb=document.getElementById('cartCount'), fb=document.getElementById('favCount');
  if(cb){ cb.textContent=cartTotal; cb.classList.toggle('visible',cartTotal>0); }
  if(fb){ fb.textContent=favTotal;  fb.classList.toggle('visible',favTotal>0);  }
}

// ================================================================
// CART OPEN / CLOSE
// ================================================================
function openCart()  { document.getElementById('cartSidebar').classList.add('open'); document.getElementById('overlay').classList.add('active'); renderCartUI(); }
function closeCart() { document.getElementById('cartSidebar').classList.remove('open'); if(!document.querySelector('.sidebar.open')) document.getElementById('overlay').classList.remove('active'); }

// ================================================================
// PRODUCT MODAL
// ================================================================
function openProductModal(productId) {
  const p=state.allProducts.find(x=>x.id===productId);
  if(!p) return;
  const inCart=state.cart.some(c=>c.id===productId);
  const isFav=state.favorites.includes(productId);
  const saved=p.oldPrice?p.oldPrice-p.price:0;
  const specs=p.specs||{};

  document.getElementById('modalBody').innerHTML=`
    <div class="modal-gallery">
      <img class="modal-main-img" id="modalMainImg" src="${p.image}" alt="${p.name}" onerror="this.src='https://picsum.photos/seed/${p.id}/800/600'">
      ${(p.images&&p.images.length>1)?`<div class="modal-thumbs">${p.images.map((img,i)=>`<img class="modal-thumb ${i===0?'active':''}" src="${img}" alt="${p.name}" onclick="switchModalImg('${img}',this)">`).join('')}</div>`:''}
    </div>
    <div class="modal-info">
      <p class="modal-brand">${p.brand}</p>
      <h2 class="modal-title">${p.name}</h2>
      <div class="modal-rating">
        <div class="stars">${renderStars(p.rating)}</div>
        <span class="modal-review-count">${(p.reviews||0).toLocaleString('uk')} відгуків</span>
        ${p.inStock?'<span style="color:var(--accent);font-size:12px;font-weight:700">✓ В наявності</span>':'<span style="color:#ff4d4d;font-size:12px;font-weight:700">✗ Немає</span>'}
      </div>
      <div class="modal-price-wrap">
        <span class="modal-price">${p.price.toLocaleString('uk')} ₴</span>
        ${p.oldPrice?`<span class="modal-old-price">${p.oldPrice.toLocaleString('uk')} ₴</span>`:''}
      </div>
      ${saved>0?`<p class="modal-save">Ви економите ${saved.toLocaleString('uk')} ₴ (${p.discount}%)</p>`:''}
      <p class="modal-desc">${p.description||''}</p>
      ${Object.keys(specs).length?`<div class="modal-specs"><h4>Характеристики</h4>${Object.entries(specs).map(([k,v])=>`<div class="spec-row"><span class="spec-key">${k}</span><span class="spec-val">${v}</span></div>`).join('')}</div>`:''}
      <div class="modal-actions">
        <button class="modal-cart-btn ${inCart?'in-cart':''}" onclick="addToCart(${productId});closeModal()">
          ${inCart?'✓ В кошику':'🛒 Додати до кошика'}
        </button>
        <button class="modal-wish-btn ${isFav?'active':''}" onclick="toggleFavorite(${productId});this.classList.toggle('active')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFav?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
    </div>`;

  document.getElementById('productModal').classList.add('active');
  document.getElementById('modalBackdrop').classList.add('active');
  document.body.style.overflow='hidden';
}

function closeModal() {
  document.getElementById('productModal').classList.remove('active');
  document.getElementById('modalBackdrop').classList.remove('active');
  document.body.style.overflow='';
}
window.closeModal=closeModal;
window.openProductModal = openProductModal;  // exposed for inline onclick on product cards

function switchModalImg(src,thumb) {
  document.getElementById('modalMainImg').src=src;
  document.querySelectorAll('.modal-thumb').forEach(t=>t.classList.remove('active'));
  thumb.classList.add('active');
}
window.switchModalImg=switchModalImg;

// ================================================================
// LIVE SEARCH
// ================================================================
function handleSearch(query) {
  state.searchQuery=query;
  applyFiltersAndRender();
  renderSearchDropdown(query);
}

function renderSearchDropdown(query) {
  const dd=document.getElementById('searchDropdown');
  if(!dd) return;
  if(!query.trim()){ dd.classList.remove('open'); return; }
  const q=query.toLowerCase();
  const matches=state.allProducts.filter(p=>p.name.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q)).slice(0,6);
  if(!matches.length){ dd.classList.remove('open'); return; }
  dd.innerHTML=matches.map(p=>`
    <div class="search-item" onclick="openProductModal(${p.id});closeSearchDropdown()">
      <img class="search-item-img" src="${p.image}" alt="${p.name}" onerror="this.src='https://picsum.photos/seed/${p.id}/80/80'">
      <span class="search-item-name">${hilite(p.name,q)}</span>
      <span class="search-item-price">${p.price.toLocaleString('uk')} ₴</span>
    </div>`).join('');
  dd.classList.add('open');
}

function closeSearchDropdown() { document.getElementById('searchDropdown')?.classList.remove('open'); }
window.closeSearchDropdown=closeSearchDropdown;
function hilite(t,q){ return t.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi'), '<mark style="background:var(--accent-light);color:var(--accent)">$1</mark>'); }

// ================================================================
// SLIDER
// ================================================================
function initSlider() {
  const track=document.getElementById('slidesTrack');
  if(!track) return;
  const total=track.querySelectorAll('.slide').length;
  const dotsEl=document.getElementById('sliderDots');
  if(dotsEl) dotsEl.innerHTML=Array.from({length:total},(_,i)=>`<span class="dot ${i===0?'active':''}" onclick="goToSlide(${i})"></span>`).join('');
  startSliderTimer();
}

function goToSlide(idx) {
  const track=document.getElementById('slidesTrack');
  if(!track) return;
  const total=track.querySelectorAll('.slide').length;
  state.sliderIndex=((idx%total)+total)%total;
  track.style.transform=`translateX(-${state.sliderIndex*100}%)`;
  document.querySelectorAll('.dot').forEach((d,i)=>d.classList.toggle('active',i===state.sliderIndex));
}
window.goToSlide=goToSlide;

function nextSlide(){ goToSlide(state.sliderIndex+1); }
function prevSlide(){ goToSlide(state.sliderIndex-1); }
function startSliderTimer(){ clearInterval(state.sliderTimer); state.sliderTimer=setInterval(nextSlide,5000); }
function pauseSlider(){ clearInterval(state.sliderTimer); }

// ================================================================
// PRICE RANGE
// ================================================================
function initPriceRange() {
  const rMin=document.getElementById('rangeMin'), rMax=document.getElementById('rangeMax');
  if(!rMin||!rMax) return;
  const maxVal=Math.max(...state.allProducts.map(p=>p.price), 100000);
  rMin.max=maxVal; rMax.max=maxVal; rMax.value=maxVal;
  updateRangeFill();
}

function updateRangeFill() {
  const rMin=document.getElementById('rangeMin'), rMax=document.getElementById('rangeMax');
  const fill=document.getElementById('rangeFill');
  if(!rMin||!rMax||!fill) return;
  const mn=+rMin.value, mx=+rMax.value, max=+rMax.max||100000;
  fill.style.left =(mn/max*100)+'%';
  fill.style.width=((mx-mn)/max*100)+'%';
  const pMin=document.getElementById('priceMin'), pMax=document.getElementById('priceMax');
  if(pMin) pMin.value=mn; if(pMax) pMax.value=mx;
}

// ================================================================
// AUTH SYSTEM
// ================================================================
function openAuthModal() {
  const modal=document.getElementById('authModal');
  if(!modal) return;
  if(state.user) {
    // Show user menu panel
    document.querySelectorAll('.auth-panel,.auth-tabs').forEach(el=>el.classList.remove('active'));
    document.getElementById('userMenuPanel')?.classList.add('active');
    const tabs=document.getElementById('authTabs');
    if(tabs) tabs.style.display='none';
    updateUserMenuStats();
  } else {
    document.querySelectorAll('.auth-panel').forEach(el=>el.classList.remove('active'));
    document.getElementById('loginPanel')?.classList.add('active');
    const tabs=document.getElementById('authTabs');
    if(tabs) tabs.style.display='';
    document.getElementById('loginTabBtn')?.classList.add('active');
    document.getElementById('registerTabBtn')?.classList.remove('active');
  }
  modal.classList.add('active');
}

function closeAuthModal() {
  document.getElementById('authModal')?.classList.remove('active');
}
window.closeAuthModal=closeAuthModal;

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===tab));
  document.getElementById('loginPanel')?.classList.toggle('active',    tab==='login');
  document.getElementById('registerPanel')?.classList.toggle('active', tab==='register');
}

function togglePwd(inputId, btn) {
  const inp=document.getElementById(inputId);
  if(!inp) return;
  inp.type = inp.type==='password' ? 'text' : 'password';
  btn.textContent = inp.type==='password' ? '👁' : '🙈';
}
window.togglePwd=togglePwd;

function login() {
  const email=document.getElementById('loginEmail')?.value.trim();
  const pass =document.getElementById('loginPassword')?.value;
  if(!email||!pass){ showToast('Помилка','Заповніть всі поля','error'); return; }

  const users=getUsers();
  const found=users.find(u=>u.email===email&&u.password===pass);
  if(!found){ showToast('Помилка входу','Невірний email або пароль','error'); return; }

  state.user={id:found.id, name:found.name, email:found.email, role:found.role, avatar:found.avatar||found.name.split(' ').map(w=>w[0]).join('').slice(0,2)};
  saveAll();
  updateAuthUI();
  closeAuthModal();
  showToast(`Вітаємо, ${found.name.split(' ')[0]}!`, found.role==='admin'?'Ви увійшли як адміністратор':'Ви успішно увійшли', 'success');
}

function register() {
  const name  =document.getElementById('regName')?.value.trim();
  const email =document.getElementById('regEmail')?.value.trim();
  const pass  =document.getElementById('regPassword')?.value;
  const roleEl=document.querySelector('input[name="regRole"]:checked');
  const role  =roleEl?.value||'user';
  const code  =document.getElementById('adminCode')?.value;

  if(!name||!email||!pass){ showToast('Помилка','Заповніть всі поля','error'); return; }
  if(pass.length<6)        { showToast('Помилка','Пароль мінімум 6 символів','error'); return; }

  const users=getUsers();
  if(users.find(u=>u.email===email)){ showToast('Помилка','Цей email вже зареєстровано','error'); return; }

  if(role==='admin'){
    if(code!==ADMIN_SECRET_CODE){ showToast('Невірний код','Секретний код адміна неправильний','error'); return; }
  }

  const newUser={
    id:Date.now(), name, email, password:pass, role,
    avatar:name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
    joined:new Date().toISOString().split('T')[0], orders:0, totalSpent:0,
  };
  users.push(newUser);
  saveUsers(users);

  state.user={id:newUser.id, name, email, role, avatar:newUser.avatar};
  saveAll();
  updateAuthUI();
  closeAuthModal();
  showToast(`Вітаємо, ${name.split(' ')[0]}!`, role==='admin'?'Ви зареєстровані як адмін':'Реєстрація успішна','success');
}

function logout() {
  state.user=null; lsDel('mkt_user');
  updateAuthUI();
  showToast('До побачення!','Ви вийшли з акаунту','info');
  closeAuthModal();
}

function updateAuthUI() {
  const label    =document.getElementById('authLabel');
  const adminBtn =document.getElementById('adminPanelBtn');
  const isAdmin  =state.user?.role==='admin';
  const isLogged =!!state.user;

  if(label) label.textContent=isLogged ? state.user.name.split(' ')[0] : 'Увійти';
  if(adminBtn){ adminBtn.classList.toggle('hidden',!isAdmin); adminBtn.onclick=openAdminPanel; }

  const adminLink=document.getElementById('adminPanelLink');
  if(adminLink) adminLink.classList.toggle('hidden',!isAdmin);

  const chip=document.getElementById('adminChipName');
  const chipAv=document.getElementById('adminChipAvatar');
  if(chip&&state.user){ chip.textContent=state.user.name; }
  if(chipAv&&state.user){ chipAv.textContent=state.user.avatar||'AD'; }

  updateAdminOrdersBadge();
}

function updateUserMenuStats() {
  const el=document.getElementById('userMenuStats');
  const nameEl=document.getElementById('userMenuName');
  const emailEl=document.getElementById('userMenuEmail');
  const badge=document.getElementById('userRoleBadge');
  const av=document.getElementById('userMenuAvatar');
  const orderCount=document.getElementById('userMenuOrderCount');
  const favCount=document.getElementById('userMenuFavCount');
  if(!state.user) return;

  if(nameEl)  nameEl.textContent=state.user.name;
  if(emailEl) emailEl.textContent=state.user.email;
  if(badge){  badge.textContent=state.user.role==='admin'?'Адмін':'Покупець'; badge.className=`user-role-badge role-${state.user.role}`; }
  if(av)      av.textContent=state.user.avatar||'?';

  const userOrders=getOrders().filter(o=>o.userId===state.user.id);
  if(orderCount) orderCount.textContent=userOrders.length;
  if(favCount)   favCount.textContent=state.favorites.length;

  if(el){
    const spent=userOrders.reduce((a,o)=>a+o.total,0);
    el.innerHTML=`
      <div class="user-stat"><span>${userOrders.length}</span><small>Замовлень</small></div>
      <div class="user-stat"><span>${state.favorites.length}</span><small>Обране</small></div>
      <div class="user-stat"><span>${spent.toLocaleString('uk')} ₴</span><small>Витрачено</small></div>`;
  }
}

// ================================================================
// MY ORDERS MODAL (user)
// ================================================================
function openMyOrders() {
  if(!state.user){ showToast('Потрібен вхід','','warning'); return; }
  const modal=document.getElementById('ordersModal');
  const body =document.getElementById('ordersModalBody');
  if(!modal||!body) return;

  const orders=getOrders().filter(o=>o.userId===state.user.id);
  if(orders.length===0){
    body.innerHTML=`<div class="orders-empty"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg><p>Замовлень ще немає</p><small>Зробіть перше замовлення</small></div>`;
  } else {
    body.innerHTML=orders.map(o=>`
      <div class="order-card">
        <div class="order-card-head">
          <span class="order-id">№ ${o.id}</span>
          <span class="order-date">${o.date}</span>
          <span class="order-status-badge ${ORDER_STATUS_MAP[o.status]?.cls||''}">${ORDER_STATUS_MAP[o.status]?.label||o.status}</span>
        </div>
        <div class="order-items-preview">
          ${o.items.slice(0,3).map(it=>`<img src="${it.image}" alt="${it.name}" onerror="this.src='https://picsum.photos/seed/${it.id}/60/60'">`).join('')}
          ${o.items.length>3?`<span class="order-items-more">+${o.items.length-3}</span>`:''}
        </div>
        <div class="order-card-foot">
          <span>${o.items.reduce((a,i)=>a+i.qty,0)} товарів</span>
          <strong>${o.total.toLocaleString('uk')} ₴</strong>
        </div>
      </div>`).join('');
  }

  document.getElementById('ordersModalBackdrop')?.classList.add('active');
  modal.classList.add('open');
  document.body.style.overflow='hidden';
}
window.openMyOrders=openMyOrders;

function closeMyOrders() {
  document.getElementById('ordersModal')?.classList.remove('open');
  document.getElementById('ordersModalBackdrop')?.classList.remove('active');
  document.body.style.overflow='';
}

// ================================================================
// ADMIN PANEL — OPEN / CLOSE / GUARD
// ================================================================
function openAdminPanel() {
  if(!state.user||state.user.role!=='admin'){
    showToast('Доступ заборонено','Тільки для адміністраторів','error'); return;
  }
  document.getElementById('adminPanel')?.classList.add('open');
  document.getElementById('adminOverlay')?.classList.add('active');
  document.body.style.overflow='hidden';
  renderAdminSection('dashboard');
}
window.openAdminPanel=openAdminPanel;

function closeAdminPanel() {
  document.getElementById('adminPanel')?.classList.remove('open');
  document.getElementById('adminOverlay')?.classList.remove('active');
  document.body.style.overflow='';
}
window.closeAdminPanel=closeAdminPanel;

function updateAdminOrdersBadge() {
  const el=document.getElementById('adminOrdersBadge');
  if(!el) return;
  const pending=getOrders().filter(o=>o.status==='pending').length;
  el.textContent=pending;
  el.style.display=pending>0?'':'none';
}

// ================================================================
// ADMIN — SECTION ROUTER
// ================================================================
function renderAdminSection(section) {
  if(!state.user||state.user.role!=='admin') return;
  state.adminSection=section;

  document.querySelectorAll('.admin-nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.section===section));
  const titles={dashboard:'Дашборд',products:'Товари',orders:'Замовлення',users:'Користувачі',analytics:'Аналітика',settings:'Налаштування'};
  const tEl=document.getElementById('adminPageTitle'), bEl=document.getElementById('adminBreadcrumb');
  if(tEl) tEl.textContent=titles[section]||section;
  if(bEl) bEl.textContent=titles[section]||section;

  const el=document.getElementById('adminContent');
  if(!el) return;
  switch(section){
    case 'dashboard':  el.innerHTML=renderAdminDashboard();  break;
    case 'products':   el.innerHTML=renderAdminProducts();   break;
    case 'orders':     el.innerHTML=renderAdminOrders();     break;
    case 'users':      el.innerHTML=renderAdminUsers();      break;
    case 'analytics':  el.innerHTML=renderAdminAnalytics();  break;
    case 'settings':   el.innerHTML=renderAdminSettings();   break;
  }
}
window.renderAdminSection=renderAdminSection;

// ================================================================
// ADMIN — DASHBOARD
// ================================================================
function renderAdminDashboard() {
  const orders  =getOrders();
  const users   =getUsers();
  const products=state.allProducts;
  const revenue =orders.filter(o=>o.status==='delivered').reduce((a,o)=>a+o.total,0);
  const pending =orders.filter(o=>o.status==='pending').length;

  return `
  <div class="adm-stats-grid">
    <div class="adm-stat-card green">
      <div class="adm-stat-icon">₴</div>
      <div class="adm-stat-body">
        <div class="adm-stat-val">${revenue.toLocaleString('uk')} ₴</div>
        <div class="adm-stat-label">Дохід (доставлено)</div>
        <div class="adm-stat-sub">${orders.filter(o=>o.status==='delivered').length} виконаних замовлень</div>
      </div>
    </div>
    <div class="adm-stat-card blue">
      <div class="adm-stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
      <div class="adm-stat-body">
        <div class="adm-stat-val">${orders.length}</div>
        <div class="adm-stat-label">Всього замовлень</div>
        <div class="adm-stat-sub" style="color:${pending>0?'var(--adm-orange)':'var(--adm-text3)'}">Очікує: ${pending}</div>
      </div>
    </div>
    <div class="adm-stat-card orange">
      <div class="adm-stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div>
      <div class="adm-stat-body">
        <div class="adm-stat-val">${products.length}</div>
        <div class="adm-stat-label">Товарів у каталозі</div>
        <div class="adm-stat-sub">В наявності: ${products.filter(p=>p.inStock).length}</div>
      </div>
    </div>
    <div class="adm-stat-card purple">
      <div class="adm-stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
      <div class="adm-stat-body">
        <div class="adm-stat-val">${users.filter(u=>u.role!=='admin').length}</div>
        <div class="adm-stat-label">Покупці</div>
        <div class="adm-stat-sub">Адмінів: ${users.filter(u=>u.role==='admin').length}</div>
      </div>
    </div>
  </div>

  <div class="adm-two-col">
    <div class="adm-section-box">
      <div class="adm-section-head"><h3>Останні замовлення</h3><button class="adm-link-btn" onclick="renderAdminSection('orders')">Всі →</button></div>
      ${orders.length===0?'<p style="color:var(--adm-text3);text-align:center;padding:20px">Замовлень ще немає</p>':`
      <table class="adm-table"><thead><tr><th>ID</th><th>Клієнт</th><th>Сума</th><th>Статус</th></tr></thead>
      <tbody>${orders.slice(0,5).map(o=>`
        <tr><td><span class="adm-order-id">${o.id.slice(-8)}</span></td>
        <td>${trunc(o.userName,20)}</td>
        <td><strong>${o.total.toLocaleString('uk')} ₴</strong></td>
        <td>${adminStatusBadge(o.status)}</td></tr>`).join('')}
      </tbody></table>`}
    </div>
    <div class="adm-section-box">
      <div class="adm-section-head"><h3>Топ товарів</h3><button class="adm-link-btn" onclick="renderAdminSection('products')">Всі →</button></div>
      <div class="adm-top-products">
        ${[...products].sort((a,b)=>b.popular-a.popular).slice(0,5).map((p,i)=>`
          <div class="adm-top-product">
            <span class="adm-top-rank">${i+1}</span>
            <img src="${p.image}" alt="${p.name}" onerror="this.src='https://picsum.photos/seed/${p.id}/60/60'">
            <div class="adm-top-info"><span class="adm-top-name">${trunc(p.name,28)}</span><span class="adm-top-price">${p.price.toLocaleString('uk')} ₴</span></div>
            <div class="adm-top-bar-wrap"><div class="adm-top-bar" style="width:${p.popular}%"></div><span>${p.popular}%</span></div>
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function adminStatusBadge(status) {
  const s=ORDER_STATUS_MAP[status]||{label:status,cls:''};
  return `<span class="adm-status-badge ${s.cls}">${s.label}</span>`;
}

// ================================================================
// ADMIN — PRODUCTS
// ================================================================
function renderAdminProducts() {
  return `
  <div class="adm-toolbar">
    <input type="text" class="adm-search-input" placeholder="Пошук товарів..." oninput="adminFilterProducts(this.value)" id="admProdSearch">
    <div style="display:flex;gap:8px;align-items:center">
      <select class="adm-status-select" onchange="adminFilterProductsCat(this.value)">
        <option value="">Всі категорії</option>
        ${Object.entries(CAT_LABELS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}
      </select>
      <button class="adm-btn-primary" onclick="openProductForm()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Додати товар
      </button>
    </div>
  </div>
  <div class="adm-section-box" style="padding:0;overflow:auto">
    <table class="adm-table adm-prod-table">
      <thead><tr><th>Фото</th><th>Назва / Бренд</th><th>Категорія</th><th>Ціна</th><th>Знижка</th><th>Бейдж</th><th>Статус</th><th>Дії</th></tr></thead>
      <tbody id="admProdTbody">${adminProductRows(state.allProducts)}</tbody>
    </table>
  </div>`;
}

function adminProductRows(products) {
  return products.map(p=>`
    <tr id="admPRow_${p.id}">
      <td><img class="adm-prod-thumb" src="${p.image}" onerror="this.src='https://picsum.photos/seed/${p.id}/60/60'"></td>
      <td><span class="adm-prod-name">${trunc(p.name,34)}</span><br><small style="color:var(--adm-text3)">${p.brand}</small></td>
      <td><span class="adm-cat-tag">${CAT_LABELS[p.category]||p.category}</span></td>
      <td><strong>${p.price.toLocaleString('uk')} ₴</strong>${p.oldPrice?`<br><small style="text-decoration:line-through;color:var(--adm-text3)">${p.oldPrice.toLocaleString('uk')} ₴</small>`:''}</td>
      <td>${p.discount>0?`<span class="adm-discount-tag">-${p.discount}%</span>`:'—'}</td>
      <td>${p.badge?`<span class="adm-prod-badge badge-${p.badge}">${{new:'NEW',sale:'SALE',top:'TOP'}[p.badge]||p.badge}</span>`:'—'}</td>
      <td><span class="adm-status-badge ${p.inStock?'status-delivered':'status-cancelled'}">${p.inStock?'В наявності':'Немає'}</span></td>
      <td class="adm-actions-cell">
        <button class="adm-icon-btn edit" onclick="openProductForm(${p.id})" title="Редагувати">✏️</button>
        <button class="adm-icon-btn toggle" onclick="adminToggleStock(${p.id})" title="Змінити наявність">📦</button>
        <button class="adm-icon-btn delete" onclick="adminDeleteProduct(${p.id})" title="Видалити">🗑️</button>
      </td>
    </tr>`).join('');
}

function adminFilterProducts(q) {
  const filtered=state.allProducts.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())||p.brand.toLowerCase().includes(q.toLowerCase()));
  const el=document.getElementById('admProdTbody'); if(el) el.innerHTML=adminProductRows(filtered);
}
window.adminFilterProducts=adminFilterProducts;

function adminFilterProductsCat(cat) {
  const filtered=cat ? state.allProducts.filter(p=>p.category===cat) : state.allProducts;
  const el=document.getElementById('admProdTbody'); if(el) el.innerHTML=adminProductRows(filtered);
}
window.adminFilterProductsCat=adminFilterProductsCat;

async function adminToggleStock(id) {
  const p = state.allProducts.find(x => x.id === id);
  if (!p) return;

  const newStock = !p.inStock;

  const { error } = await db
    .from('products')
    .update({ in_stock: newStock })
    .eq('id', id);

  if (error) {
    showToast('Помилка', error.message, 'error');
    return;
  }

  // Update in-memory state only after the DB call succeeds
  p.inStock = newStock;
  renderAdminSection('products');
  applyFiltersAndRender();
  showToast('Оновлено', `${trunc(p.name, 28)} — ${p.inStock ? 'в наявності' : 'немає'}`, 'info');
}
window.adminToggleStock=adminToggleStock;

async function adminDeleteProduct(id) {
  const p = state.allProducts.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Видалити "${trunc(p.name, 40)}"?`)) return;

  const { error } = await db
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    showToast('Помилка видалення', error.message, 'error');
    return;
  }

  // Remove from in-memory state only after the DB call succeeds
  state.allProducts = state.allProducts.filter(x => x.id !== id);
  state.cart        = state.cart.filter(c => c.id !== id);
  state.favorites   = state.favorites.filter(f => f !== id);

  saveAll(); // persist cart / favorites changes to localStorage
  renderAdminSection('products');
  applyFiltersAndRender();
  showToast('Видалено', trunc(p.name, 34), 'warning');
}
window.adminDeleteProduct=adminDeleteProduct;

// ================================================================
// ADMIN — PRODUCT FORM
// ================================================================
function openProductForm(editId=null) {
  const p=editId?state.allProducts.find(x=>x.id===editId):null;
  document.getElementById('pformTitle').textContent=p?'Редагувати товар':'Додати товар';

  const catOpts=Object.entries(CAT_LABELS).map(([k,v])=>`<option value="${k}" ${p?.category===k?'selected':''}>${v}</option>`).join('');
  const badgeOpts=['','new','sale','top'].map(b=>`<option value="${b}" ${(p?.badge||'')===b?'selected':''}>${b||'—'}</option>`).join('');

  document.getElementById('pformBody').innerHTML=`
  <div class="pform-grid">
    <div class="form-group" style="grid-column:1/-1">
      <label>Назва *</label>
      <input id="pf_name" type="text" value="${p?.name||''}" placeholder="Назва товару">
    </div>
    <div class="form-group">
      <label>Бренд *</label>
      <input id="pf_brand" type="text" value="${p?.brand||''}" placeholder="Apple, Samsung...">
    </div>
    <div class="form-group">
      <label>Категорія</label>
      <select id="pf_cat">${catOpts}</select>
    </div>
    <div class="form-group">
      <label>Ціна (₴) *</label>
      <input id="pf_price" type="number" value="${p?.price||''}" placeholder="0" min="0">
    </div>
    <div class="form-group">
      <label>Стара ціна (₴)</label>
      <input id="pf_oldprice" type="number" value="${p?.oldPrice||''}" placeholder="0" min="0">
    </div>
    <div class="form-group">
      <label>Знижка (%)</label>
      <input id="pf_discount" type="number" value="${p?.discount||0}" min="0" max="99">
    </div>
    <div class="form-group">
      <label>Рейтинг (1–5)</label>
      <input id="pf_rating" type="number" value="${p?.rating||4.5}" min="1" max="5" step="0.1">
    </div>
    <div class="form-group">
      <label>Відгуків</label>
      <input id="pf_reviews" type="number" value="${p?.reviews||0}" min="0">
    </div>
    <div class="form-group">
      <label>Бейдж</label>
      <select id="pf_badge">${badgeOpts}</select>
    </div>
    <div class="form-group" style="grid-column:1/-1">
      <label>URL фото *</label>
      <input id="pf_image" type="text" value="${p?.image||''}" placeholder="https://...">
      <div id="pf_img_preview" style="margin-top:8px">${p?.image?`<img src="${p.image}" style="height:80px;border-radius:8px;border:1px solid var(--adm-border)" onerror="this.style.display='none'">`:''}  </div>
    </div>
    <div class="form-group" style="grid-column:1/-1">
      <label>Опис</label>
      <textarea id="pf_desc" rows="3" placeholder="Опис товару...">${p?.description||''}</textarea>
    </div>
    <div class="form-group">
      <label class="checkbox-label"><input type="checkbox" id="pf_instock" ${p?.inStock!==false?'checked':''}><span class="checkmark"></span>В наявності</label>
    </div>
  </div>
  <div class="pform-footer">
    <button class="adm-btn-secondary" onclick="closePform()">Скасувати</button>
    <button class="adm-btn-primary" onclick="adminSaveProduct(${editId||'null'})">${p?'Зберегти':'Додати товар'}</button>
  </div>`;

  // Live image preview
  document.getElementById('pf_image')?.addEventListener('input', function(){
    const prev=document.getElementById('pf_img_preview');
    if(prev) prev.innerHTML=this.value?`<img src="${this.value}" style="height:80px;border-radius:8px;border:1px solid var(--adm-border)" onerror="this.style.display='none'">`:'';
  });

  document.getElementById('pformModal').classList.add('open');
  document.getElementById('pformBackdrop').classList.add('active');
}
window.openProductForm=openProductForm;

function closePform() {
  document.getElementById('pformModal').classList.remove('open');
  document.getElementById('pformBackdrop').classList.remove('active');
}
window.closePform=closePform;

async function adminSaveProduct(editId) {
  const name     = document.getElementById('pf_name')?.value.trim();
  const brand    = document.getElementById('pf_brand')?.value.trim();
  const cat      = document.getElementById('pf_cat')?.value;
  const price    = +document.getElementById('pf_price')?.value;
  const oldPrice = +document.getElementById('pf_oldprice')?.value || null;
  const discount = +document.getElementById('pf_discount')?.value || 0;
  const rating   = +document.getElementById('pf_rating')?.value  || 4.5;
  const reviews  = +document.getElementById('pf_reviews')?.value || 0;
  const badge    = document.getElementById('pf_badge')?.value    || '';
  const image    = document.getElementById('pf_image')?.value.trim();
  const desc     = document.getElementById('pf_desc')?.value.trim();
  const inStock  = document.getElementById('pf_instock')?.checked;

  if (!name || !brand || !price) {
    showToast('Помилка', "Заповніть обов'язкові поля (*)", 'error');
    return;
  }

  if (editId) {
    // ── UPDATE ──────────────────────────────────────────────────
    const existing = state.allProducts.find(x => x.id === editId);
    if (!existing) return;

    // Use Supabase snake_case column names for the DB payload
    const dbPayload = {
      name, brand, category: cat, price,
      old_price:   oldPrice,
      discount,    rating, reviews, badge,
      description: desc,
      in_stock:    inStock,
      image:       image || existing.image,
    };

    // Optimistic update in memory for instant UI feedback
    Object.assign(existing, normalizeProduct({ ...existing, ...dbPayload }));

    const { error } = await db
      .from('products')
      .update(dbPayload)
      .eq('id', editId);

    if (error) {
      // Revert: reload fresh data from Supabase
      await loadProducts();
      showToast('Помилка збереження', error.message, 'error');
      return;
    }

    showToast('Збережено', trunc(name, 34), 'success');

  } else {
    // ── INSERT ──────────────────────────────────────────────────
    const duplicate = state.allProducts.find(
      p => p.name.toLowerCase() === name.toLowerCase() &&
           p.brand.toLowerCase() === brand.toLowerCase()
    );
    if (duplicate) {
      showToast('Дублікат', 'Товар з такою назвою вже є', 'warning');
      return;
    }

    // Use Supabase snake_case column names for the DB payload
    const dbPayload = {
      name, brand, category: cat, price,
      old_price:   oldPrice,
      discount,    rating, reviews, badge,
      description: desc,
      in_stock:    inStock,
      image:  image || `https://picsum.photos/seed/${Date.now()}/400/400`,
      images: image ? [image] : [],
      popular: 50,
      tags:    [],
      specs:   {},
    };

    const { data: inserted, error } = await db
      .from('products')
      .insert(dbPayload)
      .select()
      .single();

    if (error) {
      showToast('Помилка', error.message, 'error');
      return;
    }

    // Normalize the returned DB row before adding to state
    state.allProducts.unshift(normalizeProduct(inserted));
    showToast('Товар додано', trunc(name, 34), 'success');
  }

  closePform();
  renderAdminSection('products');
  applyFiltersAndRender();
  renderCategories();
}
window.adminSaveProduct=adminSaveProduct;

// ================================================================
// ADMIN — ORDERS
// ================================================================
function renderAdminOrders() {
  const orders=getOrders();
  const statuses=['all','pending','processing','shipped','delivered','cancelled'];
  const sLabels={all:'Всі',pending:'Очікують',processing:'Обробка',shipped:'Відправлені',delivered:'Доставлені',cancelled:'Скасовані'};

  return `
  <div class="adm-toolbar">
    <div class="adm-filter-tabs">
      ${statuses.map((s,i)=>`<button class="adm-filter-tab ${i===0?'active':''}" onclick="adminFilterOrders('${s}',this)">${sLabels[s]} (${s==='all'?orders.length:orders.filter(o=>o.status===s).length})</button>`).join('')}
    </div>
  </div>
  <div class="adm-section-box" style="padding:0;overflow:auto">
    <table class="adm-table">
      <thead><tr><th>ID</th><th>Клієнт</th><th>Email</th><th>Дата</th><th>Товарів</th><th>Сума</th><th>Статус</th><th>Змінити статус</th></tr></thead>
      <tbody id="admOrdersTbody">${adminOrderRows(orders)}</tbody>
    </table>
  </div>
  ${orders.length===0?'<div style="text-align:center;padding:40px;color:var(--adm-text3)">Замовлень ще немає</div>':''}`;
}

function adminOrderRows(orders) {
  return orders.map(o=>`
    <tr id="admORow_${o.id}">
      <td><span class="adm-order-id">${o.id.slice(-10)}</span></td>
      <td>${trunc(o.userName||'',20)}</td>
      <td style="color:var(--adm-text3);font-size:12px">${trunc(o.userEmail||'',24)}</td>
      <td style="color:var(--adm-text3)">${o.date}</td>
      <td>${o.items?.length||0} (${o.items?.reduce((a,i)=>a+i.qty,0)||0} шт)</td>
      <td><strong>${o.total.toLocaleString('uk')} ₴</strong></td>
      <td>${adminStatusBadge(o.status)}</td>
      <td>
        <select class="adm-status-select" onchange="adminChangeOrderStatus('${o.id}',this.value)">
          ${Object.entries(ORDER_STATUS_MAP).map(([k,v])=>`<option value="${k}" ${o.status===k?'selected':''}>${v.label}</option>`).join('')}
        </select>
      </td>
    </tr>`).join('');
}

function adminFilterOrders(status, btn) {
  document.querySelectorAll('.adm-filter-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const orders=getOrders();
  const filtered=status==='all'?orders:orders.filter(o=>o.status===status);
  const el=document.getElementById('admOrdersTbody'); if(el) el.innerHTML=adminOrderRows(filtered);
}
window.adminFilterOrders=adminFilterOrders;

function adminChangeOrderStatus(orderId, newStatus) {
  const orders=getOrders();
  const o=orders.find(x=>x.id===orderId); if(!o) return;
  o.status=newStatus; saveOrders(orders);
  showToast('Статус оновлено',`${orderId.slice(-8)} → ${ORDER_STATUS_MAP[newStatus]?.label||newStatus}`,'success');
  updateAdminOrdersBadge();
  renderAdminSection('orders');
}
window.adminChangeOrderStatus=adminChangeOrderStatus;

// ================================================================
// ADMIN — USERS
// ================================================================
function renderAdminUsers() {
  const users=getUsers();
  return `
  <div class="adm-toolbar">
    <input type="text" class="adm-search-input" placeholder="Пошук за ім'ям або email..." oninput="adminFilterUsers(this.value)">
    <span style="font-size:13px;color:var(--adm-text3)">Всього: ${users.length} | Адміни: ${users.filter(u=>u.role==='admin').length} | Покупці: ${users.filter(u=>u.role!=='admin').length}</span>
  </div>
  <div class="adm-section-box" style="padding:0;overflow:auto">
    <table class="adm-table">
      <thead><tr><th>Аватар</th><th>Ім'я</th><th>Email</th><th>Роль</th><th>Реєстрація</th><th>Замовлень</th><th>Витрачено</th><th>Дії</th></tr></thead>
      <tbody id="admUsersTbody">${adminUserRows(users)}</tbody>
    </table>
  </div>`;
}

function adminUserRows(users) {
  return users.map(u=>`
    <tr>
      <td><div class="adm-user-avatar-cell" style="background:${u.role==='admin'?'var(--adm-purple)':'var(--adm-green)'}">${u.avatar||u.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div></td>
      <td><strong>${u.name}</strong></td>
      <td style="color:var(--adm-text3);font-size:12px">${u.email}</td>
      <td><span class="adm-status-badge ${u.role==='admin'?'status-admin':'status-delivered'}">${u.role==='admin'?'Адмін':'Покупець'}</span></td>
      <td style="color:var(--adm-text3)">${u.joined||'—'}</td>
      <td>${u.orders||0}</td>
      <td><strong>${(u.totalSpent||0).toLocaleString('uk')} ₴</strong></td>
      <td>${u.role!=='admin'?`<button class="adm-icon-btn delete" onclick="adminDeleteUser(${u.id})" title="Видалити">🗑️</button>`:'—'}</td>
    </tr>`).join('');
}

function adminFilterUsers(q) {
  const filtered=getUsers().filter(u=>u.name.toLowerCase().includes(q.toLowerCase())||u.email.toLowerCase().includes(q.toLowerCase()));
  const el=document.getElementById('admUsersTbody'); if(el) el.innerHTML=adminUserRows(filtered);
}
window.adminFilterUsers=adminFilterUsers;

function adminDeleteUser(id) {
  const users=getUsers(); const u=users.find(x=>x.id===id);
  if(!u||u.role==='admin') return;
  if(!confirm(`Видалити користувача "${u.name}"?`)) return;
  saveUsers(users.filter(x=>x.id!==id));
  renderAdminSection('users');
  showToast('Видалено',u.name,'warning');
}
window.adminDeleteUser=adminDeleteUser;

// ================================================================
// ADMIN — ANALYTICS
// ================================================================
function renderAdminAnalytics() {
  const orders=getOrders();
  const products=state.allProducts;
  const byCat={};
  products.forEach(p=>{byCat[p.category]=(byCat[p.category]||0)+1;});
  const maxCat=Math.max(...Object.values(byCat), 1);

  // Revenue by status
  const statusRevenue=Object.keys(ORDER_STATUS_MAP).map(s=>({
    label:ORDER_STATUS_MAP[s].label, count:orders.filter(o=>o.status===s).length,
    total:orders.filter(o=>o.status===s).reduce((a,o)=>a+o.total,0),
  }));

  const avgRating=products.length ? (products.reduce((a,p)=>a+p.rating,0)/products.length).toFixed(1) : 0;
  const totalReviews=products.reduce((a,p)=>a+(p.reviews||0),0);

  return `
  <div class="adm-two-col">
    <div class="adm-section-box">
      <div class="adm-section-head"><h3>Товари по категоріях</h3></div>
      <div class="adm-horiz-bars">
        ${Object.entries(byCat).map(([cat,count])=>`
          <div class="adm-horiz-bar-item">
            <span class="adm-horiz-label">${CAT_LABELS[cat]||cat}</span>
            <div class="adm-horiz-track"><div class="adm-horiz-fill" style="width:${Math.round((count/maxCat)*100)}%"></div></div>
            <span class="adm-horiz-val">${count}</span>
          </div>`).join('')}
      </div>
    </div>
    <div class="adm-section-box">
      <div class="adm-section-head"><h3>Замовлення по статусах</h3></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${statusRevenue.map(s=>`
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--adm-border)">
            ${adminStatusBadge(Object.keys(ORDER_STATUS_MAP).find(k=>ORDER_STATUS_MAP[k].label===s.label)||'')}
            <span style="font-size:13px;color:var(--adm-text3)">${s.count} замовлень</span>
            <strong style="font-size:13px">${s.total.toLocaleString('uk')} ₴</strong>
          </div>`).join('')}
      </div>
    </div>
  </div>
  <div class="adm-section-box">
    <div class="adm-section-head"><h3>Ключові показники</h3></div>
    <div class="adm-kpi-grid">
      <div class="adm-kpi"><span class="adm-kpi-val">${products.filter(p=>p.discount>0).length}</span><span class="adm-kpi-label">Товарів зі знижкою</span></div>
      <div class="adm-kpi"><span class="adm-kpi-val">${avgRating}</span><span class="adm-kpi-label">Середній рейтинг</span></div>
      <div class="adm-kpi"><span class="adm-kpi-val">${totalReviews.toLocaleString('uk')}</span><span class="adm-kpi-label">Всього відгуків</span></div>
      <div class="adm-kpi"><span class="adm-kpi-val">${products.filter(p=>!p.inStock).length}</span><span class="adm-kpi-label">Немає в наявності</span></div>
      <div class="adm-kpi"><span class="adm-kpi-val">${orders.filter(o=>o.status==='delivered').length}</span><span class="adm-kpi-label">Доставлено</span></div>
      <div class="adm-kpi"><span class="adm-kpi-val">${orders.reduce((a,o)=>a+o.total,0).toLocaleString('uk')} ₴</span><span class="adm-kpi-label">Загальний оборот</span></div>
    </div>
  </div>`;
}

// ================================================================
// ADMIN — SETTINGS
// ================================================================
function renderAdminSettings() {
  return `
  <div class="adm-two-col">
    <div class="adm-section-box">
      <div class="adm-section-head"><h3>Налаштування магазину</h3></div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="form-group"><label style="font-size:12px;font-weight:700;color:var(--adm-text3);text-transform:uppercase">Назва магазину</label><input type="text" value="WONDERMARKET" class="adm-input"></div>
        <div class="form-group"><label style="font-size:12px;font-weight:700;color:var(--adm-text3);text-transform:uppercase">Email підтримки</label><input type="email" value="support@wondermarket.ua" class="adm-input"></div>
        <div class="form-group"><label style="font-size:12px;font-weight:700;color:var(--adm-text3);text-transform:uppercase">Телефон</label><input type="tel" value="+380 44 000 0000" class="adm-input"></div>
        <div class="form-group"><label style="font-size:12px;font-weight:700;color:var(--adm-text3);text-transform:uppercase">Мін. сума для безкоштовної доставки (₴)</label><input type="number" value="1500" class="adm-input"></div>
        <div class="form-group"><label style="font-size:12px;font-weight:700;color:var(--adm-text3);text-transform:uppercase">Секретний код адміна</label><input type="password" value="${ADMIN_SECRET_CODE}" class="adm-input" readonly></div>
        <div class="form-group"><label class="checkbox-label"><input type="checkbox" checked><span class="checkmark"></span>Показувати товари без наявності</label></div>
        <div class="form-group"><label class="checkbox-label"><input type="checkbox" checked><span class="checkmark"></span>Надсилати email після замовлення</label></div>
        <button class="adm-btn-primary" onclick="showToast('Збережено','Налаштування оновлено','success')" style="width:fit-content">Зберегти</button>
      </div>
    </div>
    <div class="adm-section-box">
      <div class="adm-section-head"><h3>Інформація системи</h3></div>
      <div class="adm-sys-info">
        <div class="adm-sys-row"><span>Версія</span><span>3.0.0</span></div>
        <div class="adm-sys-row"><span>Товарів</span><span>${state.allProducts.length}</span></div>
        <div class="adm-sys-row"><span>Користувачів</span><span>${getUsers().length}</span></div>
        <div class="adm-sys-row"><span>Замовлень</span><span>${getOrders().length}</span></div>
        <div class="adm-sys-row"><span>Секрет-код</span><span style="color:var(--adm-orange)">MARKET2024</span></div>
        <div class="adm-sys-row"><span>База даних</span><span style="color:var(--adm-green)">Supabase</span></div>
        <div class="adm-sys-row"><span>Проект</span><span style="color:var(--adm-text3)">bkldjrcyncxpfmjsegqq</span></div>
      </div>
      <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px">
        <button class="adm-btn-danger" onclick="if(confirm('Видалити всі замовлення?')){lsSet('mkt_orders',[]);renderAdminSection('settings');showToast('Очищено','Всі замовлення видалено','warning');}">Очистити замовлення</button>
        <button class="adm-btn-danger" style="background:var(--adm-orange)" onclick="if(confirm('Скинути всі дані?')){localStorage.clear();location.reload();}">Скинути всі дані</button>
      </div>
    </div>
  </div>`;
}

// ================================================================
// TOAST
// ================================================================
const TOAST_ICONS={success:'✓',error:'✕',info:'ℹ',warning:'⚠'};

function showToast(title, msg, type='info', duration=3500) {
  const c=document.getElementById('toastContainer'); if(!c) return;
  const t=document.createElement('div');
  t.className=`toast ${type}`;
  t.innerHTML=`
    <div class="toast-icon">${TOAST_ICONS[type]||'ℹ'}</div>
    <div class="toast-text"><div class="toast-title">${title}</div>${msg?`<div class="toast-msg">${msg}</div>`:''}</div>
    <button class="toast-close" onclick="removeToast(this.parentElement)">✕</button>`;
  c.appendChild(t);
  t._timer=setTimeout(()=>removeToast(t), duration);
  const all=c.querySelectorAll('.toast');
  if(all.length>5) removeToast(all[0]);
}
window.showToast=showToast;

function removeToast(el) {
  if(!el?.parentElement) return;
  clearTimeout(el._timer); el.classList.add('removing');
  setTimeout(()=>el.remove(), 300);
}
window.removeToast=removeToast;

// ================================================================
// UTILITY
// ================================================================
function trunc(s, n) { return s&&s.length>n ? s.slice(0,n)+'…' : (s||''); }
function closeCatalog() { document.getElementById('catalogMega')?.classList.remove('open'); document.getElementById('overlay')?.classList.remove('active'); }
window.closeCatalog=closeCatalog;

// ================================================================
// EVENT LISTENERS
// ================================================================
function attachEventListeners() {
  // Search
  let searchTimeout;
  document.getElementById('searchInput')?.addEventListener('input', e=>{
    clearTimeout(searchTimeout);
    searchTimeout=setTimeout(()=>handleSearch(e.target.value), 280);
  });
  document.getElementById('searchInput')?.addEventListener('keydown', e=>{
    if(e.key==='Enter') { closeSearchDropdown(); e.target.blur(); }
    if(e.key==='Escape'){ e.target.value=''; handleSearch(''); closeSearchDropdown(); }
  });
  document.getElementById('searchInput')?.addEventListener('focus', e => { if(e.target.value) renderSearchDropdown(e.target.value); });
  document.getElementById('searchSubmit')?.addEventListener('click', ()=>{ handleSearch(document.getElementById('searchInput')?.value||''); closeSearchDropdown(); });
  document.addEventListener('click', e=>{ if(!e.target.closest('.search-wrap')) closeSearchDropdown(); });

  // Sort & view
  document.getElementById('sortSelect')?.addEventListener('change', e=>{ state.sortBy=e.target.value; applyFiltersAndRender(); });
  document.getElementById('gridViewBtn')?.addEventListener('click', ()=>{ state.viewMode='grid'; document.getElementById('gridViewBtn').classList.add('active'); document.getElementById('listViewBtn').classList.remove('active'); renderProductGrid(); });
  document.getElementById('listViewBtn')?.addEventListener('click', ()=>{ state.viewMode='list'; document.getElementById('listViewBtn').classList.add('active'); document.getElementById('gridViewBtn').classList.remove('active'); renderProductGrid(); });

  // Cart
  document.getElementById('cartBtn')?.addEventListener('click', openCart);
  document.getElementById('closeCartBtn')?.addEventListener('click', closeCart);
  document.getElementById('clearCartBtn')?.addEventListener('click', clearCart);
  document.getElementById('checkoutBtn')?.addEventListener('click', checkout);

  // Product modal
  document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
  document.getElementById('modalBackdrop')?.addEventListener('click', closeModal);

  // Auth modal
  document.getElementById('authBtn')?.addEventListener('click', openAuthModal);
  document.getElementById('authCloseBtn')?.addEventListener('click', closeAuthModal);
  document.getElementById('authModal')?.addEventListener('click', e=>{ if(e.target.id==='authModal') closeAuthModal(); });
  document.getElementById('loginTabBtn')?.addEventListener('click', ()=>switchAuthTab('login'));
  document.getElementById('registerTabBtn')?.addEventListener('click', ()=>switchAuthTab('register'));
  document.getElementById('loginSubmitBtn')?.addEventListener('click', login);
  document.getElementById('registerSubmitBtn')?.addEventListener('click', register);
  document.getElementById('loginPassword')?.addEventListener('keydown', e=>{ if(e.key==='Enter') login(); });
  document.getElementById('regPassword')?.addEventListener('keydown', e=>{ if(e.key==='Enter') register(); });
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
  document.getElementById('myOrdersBtn')?.addEventListener('click', ()=>{ openMyOrders(); closeAuthModal(); });
  document.getElementById('adminPanelLink')?.addEventListener('click', ()=>{ openAdminPanel(); closeAuthModal(); });

  // Role selector
  document.querySelectorAll('input[name="regRole"]').forEach(r=>{
    r.addEventListener('change', ()=>{
      const codeGroup=document.getElementById('adminCodeGroup');
      if(codeGroup) codeGroup.classList.toggle('hidden', r.value!=='admin');
      document.querySelectorAll('.role-option').forEach(opt=>opt.classList.toggle('selected', opt.querySelector('input')?.checked));
    });
  });
  document.querySelectorAll('.role-option').forEach(opt=>{
    opt.addEventListener('click', ()=>{ const inp=opt.querySelector('input'); if(inp){ inp.checked=true; inp.dispatchEvent(new Event('change')); } });
  });

  // Admin panel
  document.getElementById('adminPanelBtn')?.addEventListener('click', openAdminPanel);
  document.getElementById('adminCloseBtn')?.addEventListener('click', closeAdminPanel);
  document.getElementById('adminOverlay')?.addEventListener('click', closeAdminPanel);
  document.querySelectorAll('.admin-nav-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>renderAdminSection(btn.dataset.section));
  });
  document.getElementById('pformCloseBtn')?.addEventListener('click', closePform);
  document.getElementById('pformBackdrop')?.addEventListener('click', closePform);

  // My orders modal
  document.getElementById('ordersCloseBtn')?.addEventListener('click', closeMyOrders);
  document.getElementById('ordersModalBackdrop')?.addEventListener('click', closeMyOrders);

  // Favorites header btn
  document.getElementById('favoritesBtn')?.addEventListener('click', ()=>{
    if(state.favorites.length===0){ showToast('Обране порожнє','Додайте товари в обране','info'); return; }
    openFavoritesView();
    document.getElementById('mainContent')?.scrollIntoView({behavior:'smooth',block:'start'});
  });

  // Catalog toggle
  document.getElementById('catalogToggleBtn')?.addEventListener('click', ()=>{
    const mega=document.getElementById('catalogMega');
    const overlay=document.getElementById('overlay');
    const isOpen=mega.classList.contains('open');
    mega.classList.toggle('open',!isOpen); overlay.classList.toggle('active',!isOpen);
  });

  // Burger / mobile sidebar
  document.getElementById('burgerBtn')?.addEventListener('click', ()=>{
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('active');
  });

  // Overlay
  document.getElementById('overlay')?.addEventListener('click', ()=>{
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('catalogMega').classList.remove('open');
    closeCart();
    document.getElementById('overlay').classList.remove('active');
  });

  // Price range
  const rMin=document.getElementById('rangeMin'), rMax=document.getElementById('rangeMax');
  rMin?.addEventListener('input', ()=>{ if(+rMin.value>+rMax.value) rMin.value=rMax.value; updateRangeFill(); });
  rMax?.addEventListener('input', ()=>{ if(+rMax.value<+rMin.value) rMax.value=rMin.value; updateRangeFill(); });
  document.getElementById('priceMin')?.addEventListener('change', e=>{ if(rMin){ rMin.value=e.target.value; updateRangeFill(); }});
  document.getElementById('priceMax')?.addEventListener('change', e=>{ if(rMax){ rMax.value=e.target.value; updateRangeFill(); }});

  // Filters apply/reset
  document.getElementById('applyFilters')?.addEventListener('click', ()=>{
    state.filters.priceMin=+document.getElementById('rangeMin').value||0;
    state.filters.priceMax=+document.getElementById('rangeMax').value||100000;
    const pMin=document.getElementById('priceMin'), pMax=document.getElementById('priceMax');
    if(pMin.value!=='') state.filters.priceMin=+pMin.value;
    if(pMax.value!=='') state.filters.priceMax=+pMax.value;
    state.filters.brands=Array.from(document.querySelectorAll('.brand-cb:checked')).map(c=>c.value);
    state.filters.inStockOnly=document.getElementById('inStockOnly').checked;
    state.filters.discountOnly=document.getElementById('discountOnly').checked;
    applyFiltersAndRender();
    if(window.innerWidth<960){ document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlay').classList.remove('active'); }
    showToast('Фільтри застосовано',`Знайдено ${state.filtered.length} товарів`,'info');
  });
  document.getElementById('resetFilters')?.addEventListener('click', resetAll);

  // Load more
  document.getElementById('loadMoreBtn')?.addEventListener('click', ()=>{ state.page++; renderProductGrid(); renderResultsInfo(); });

  // Slider
  document.getElementById('sliderPrev')?.addEventListener('click', ()=>{ prevSlide(); startSliderTimer(); });
  document.getElementById('sliderNext')?.addEventListener('click', ()=>{ nextSlide(); startSliderTimer(); });
  document.getElementById('heroSlider')?.addEventListener('mouseenter', pauseSlider);
  document.getElementById('heroSlider')?.addEventListener('mouseleave', startSliderTimer);

  // Keyboard
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape'){ closeModal(); closeCart(); closeAuthModal(); closeAdminPanel(); closeMyOrders(); closePform(); }
  });

  // Checkboxes live
  document.getElementById('inStockOnly')?.addEventListener('change', e=>{ state.filters.inStockOnly=e.target.checked; });
  document.getElementById('discountOnly')?.addEventListener('change', e=>{ state.filters.discountOnly=e.target.checked; });
}

// ================================================================
// LOAD ERROR — displayed when Supabase cannot be reached
// ================================================================
function showLoadError(message) {
  const grid  = document.getElementById('productGrid');
  const empty = document.getElementById('emptyState');
  const info  = document.getElementById('resultsInfo');

  if (info)  info.innerHTML = '';
  if (empty) empty.classList.add('hidden');

  if (grid) {
    grid.innerHTML = `
      <div class="load-error-state">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
             stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <circle cx="12" cy="16" r="0.5" fill="var(--accent)"/>
        </svg>
        <h3>Не вдалося завантажити товари</h3>
        <p>${message}</p>
        <button class="btn-apply" onclick="location.reload()" style="width:auto;padding:10px 28px;margin-top:8px">
          Спробувати знову
        </button>
      </div>`;
  }

  console.error('[WONDERMARKET] loadProducts failed:', message);
}

// ================================================================
// START
// ================================================================
document.addEventListener('DOMContentLoaded', init);