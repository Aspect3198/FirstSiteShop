// =============================================================
// events.js — Attaches all DOM event listeners
// Imported once by main.js after the DOM is ready.
// =============================================================
import { state }                         from './state/state.js';
import { handleSearch, closeSearchDropdown } from './components/search.js';
import { applyFiltersAndRender,
         renderBrandFilter,
         renderRatingFilters,
         resetAll,
         closeCatalog }                  from './components/filters.js';
import { openCart, closeCart,
         clearCart, checkout }           from './components/cart.js';
import { closeModal }                    from './components/modal.js';
import { openFavoritesView }             from './components/favorites.js';
import { openAuthModal, closeAuthModal,
         switchAuthTab, login, register,
         logout }                        from './components/auth.js';
import { closeMyOrders, openMyOrders }   from './components/orders.js';
import { nextSlide, prevSlide,
         startSliderTimer, pauseSlider } from './components/slider.js';
import { updateRangeFill }               from './components/price-range.js';
import { openAdminPanel, closeAdminPanel,
         renderAdminSection }            from './admin/index.js';

export function attachEventListeners() {

  // ── Search ──────────────────────────────────────────────────
  let searchTimeout;
  document.getElementById('searchInput')?.addEventListener('input', e => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => handleSearch(e.target.value), 280);
  });
  document.getElementById('searchInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { closeSearchDropdown(); e.target.blur(); }
    if (e.key === 'Escape') { e.target.value = ''; handleSearch(''); closeSearchDropdown(); }
  });
  document.getElementById('searchInput')?.addEventListener('focus', e => {
    if (e.target.value) import('./components/search.js')
      .then(m => m.renderSearchDropdown(e.target.value));
  });
  document.getElementById('searchSubmit')?.addEventListener('click', () => {
    const q = document.getElementById('searchInput')?.value || '';
    handleSearch(q);
    closeSearchDropdown();
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrap')) closeSearchDropdown();
  });

  // ── Sort & view ─────────────────────────────────────────────
  document.getElementById('sortSelect')?.addEventListener('change', e => {
    state.sortBy = e.target.value;
    applyFiltersAndRender();
    window.saveAll?.();
  });
  document.getElementById('gridViewBtn')?.addEventListener('click', () => {
    state.viewMode = 'grid';
    document.getElementById('gridViewBtn')?.classList.add('active');
    document.getElementById('listViewBtn')?.classList.remove('active');
    import('./components/products.js').then(m => m.renderProductGrid());
    window.saveAll?.();
  });
  document.getElementById('listViewBtn')?.addEventListener('click', () => {
    state.viewMode = 'list';
    document.getElementById('listViewBtn')?.classList.add('active');
    document.getElementById('gridViewBtn')?.classList.remove('active');
    import('./components/products.js').then(m => m.renderProductGrid());
    window.saveAll?.();
  });

  // ── Cart ────────────────────────────────────────────────────
  document.getElementById('cartBtn')?.addEventListener('click', openCart);
  document.getElementById('closeCartBtn')?.addEventListener('click', closeCart);
  document.getElementById('clearCartBtn')?.addEventListener('click', clearCart);
  document.getElementById('checkoutBtn')?.addEventListener('click', checkout);

  // ── Product modal ───────────────────────────────────────────
  document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
  document.getElementById('modalBackdrop')?.addEventListener('click', closeModal);

  // ── Auth ────────────────────────────────────────────────────
  document.getElementById('authBtn')?.addEventListener('click', openAuthModal);
  document.getElementById('authCloseBtn')?.addEventListener('click', closeAuthModal);
  document.getElementById('authModal')?.addEventListener('click', e => {
    if (e.target.id === 'authModal') closeAuthModal();
  });
  document.getElementById('loginTabBtn')?.addEventListener('click', () => switchAuthTab('login'));
  document.getElementById('registerTabBtn')?.addEventListener('click', () => switchAuthTab('register'));
  document.getElementById('loginSubmitBtn')?.addEventListener('click', login);
  document.getElementById('registerSubmitBtn')?.addEventListener('click', register);
  document.getElementById('loginPassword')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') login();
  });
  document.getElementById('regPassword')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') register();
  });
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
  document.getElementById('myOrdersBtn')?.addEventListener('click', () => {
    openMyOrders();
    closeAuthModal();
  });
  document.getElementById('adminPanelLink')?.addEventListener('click', () => {
    openAdminPanel();
    closeAuthModal();
  });

  // Role selector (register form)
  document.querySelectorAll('input[name="regRole"]').forEach(r => {
    r.addEventListener('change', () => {
      const codeGroup = document.getElementById('adminCodeGroup');
      if (codeGroup) codeGroup.classList.toggle('hidden', r.value !== 'admin');
      document.querySelectorAll('.role-option').forEach(opt =>
        opt.classList.toggle('selected', opt.querySelector('input')?.checked),
      );
    });
  });
  document.querySelectorAll('.role-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const inp = opt.querySelector('input');
      if (inp) { inp.checked = true; inp.dispatchEvent(new Event('change')); }
    });
  });

  // ── Admin panel ─────────────────────────────────────────────
  document.getElementById('adminPanelBtn')?.addEventListener('click', openAdminPanel);
  document.getElementById('adminCloseBtn')?.addEventListener('click', closeAdminPanel);
  document.getElementById('adminOverlay')?.addEventListener('click', closeAdminPanel);
  document.querySelectorAll('.admin-nav-btn').forEach(btn =>
    btn.addEventListener('click', () => renderAdminSection(btn.dataset.section)),
  );
  document.getElementById('pformCloseBtn')?.addEventListener('click', () =>
    import('./admin/products.js').then(m => m.closePform()),
  );
  document.getElementById('pformBackdrop')?.addEventListener('click', () =>
    import('./admin/products.js').then(m => m.closePform()),
  );

  // ── My orders modal ─────────────────────────────────────────
  document.getElementById('ordersCloseBtn')?.addEventListener('click', closeMyOrders);
  document.getElementById('ordersModalBackdrop')?.addEventListener('click', closeMyOrders);

  // ── Favourites header button ─────────────────────────────────
  document.getElementById('favoritesBtn')?.addEventListener('click', () => {
    if (state.favorites.length === 0) {
      window.showToast?.('Обране порожнє', 'Додайте товари в обране', 'info');
      return;
    }
    openFavoritesView();
    document.getElementById('mainContent')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // ── Catalog toggle ───────────────────────────────────────────
  document.getElementById('catalogToggleBtn')?.addEventListener('click', () => {
    const mega    = document.getElementById('catalogMega');
    const overlay = document.getElementById('overlay');
    const isOpen  = mega?.classList.contains('open');
    mega?.classList.toggle('open', !isOpen);
    overlay?.classList.toggle('active', !isOpen);
  });

  // ── Burger / mobile sidebar ──────────────────────────────────
  document.getElementById('burgerBtn')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('overlay')?.classList.add('active');
  });

  // ── Global overlay (closes everything) ──────────────────────
  document.getElementById('overlay')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('catalogMega')?.classList.remove('open');
    closeCart();
    document.getElementById('overlay')?.classList.remove('active');
  });

  // ── Price range sliders ──────────────────────────────────────
  const rMin = document.getElementById('rangeMin');
  const rMax = document.getElementById('rangeMax');
  rMin?.addEventListener('input', () => {
    if (+rMin.value > +rMax.value) rMin.value = rMax.value;
    updateRangeFill();
  });
  rMax?.addEventListener('input', () => {
    if (+rMax.value < +rMin.value) rMax.value = rMin.value;
    updateRangeFill();
  });
  document.getElementById('priceMin')?.addEventListener('change', e => {
    if (rMin) { rMin.value = e.target.value; updateRangeFill(); }
  });
  document.getElementById('priceMax')?.addEventListener('change', e => {
    if (rMax) { rMax.value = e.target.value; updateRangeFill(); }
  });

  // ── Apply / reset filters ────────────────────────────────────
  document.getElementById('applyFilters')?.addEventListener('click', () => {
    const rMinEl = document.getElementById('rangeMin');
    const rMaxEl = document.getElementById('rangeMax');
    const pMin   = document.getElementById('priceMin');
    const pMax   = document.getElementById('priceMax');

    state.filters.priceMin = pMin?.value !== '' ? +pMin.value : +(rMinEl?.value || 0);
    state.filters.priceMax = pMax?.value !== '' ? +pMax.value : +(rMaxEl?.value || 100000);
    state.filters.brands   = Array.from(document.querySelectorAll('.brand-cb:checked'))
      .map(c => c.value);
    state.filters.inStockOnly  = document.getElementById('inStockOnly')?.checked || false;
    state.filters.discountOnly = document.getElementById('discountOnly')?.checked || false;

    applyFiltersAndRender();

    // Persist applied filters so they survive F5
    window.saveAll?.();

    if (window.innerWidth < 960) {
      document.getElementById('sidebar')?.classList.remove('open');
      document.getElementById('overlay')?.classList.remove('active');
    }
    window.showToast?.('Фільтри застосовано', `Знайдено ${state.filtered.length} товарів`, 'info');
  });
  document.getElementById('resetFilters')?.addEventListener('click', resetAll);

  // ── Load more button ─────────────────────────────────────────
  document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
    state.page++;
    import('./components/products.js').then(m => {
      m.renderProductGrid();
      m.renderResultsInfo();
    });
  });

  // ── Hero slider controls ─────────────────────────────────────
  document.getElementById('sliderPrev')?.addEventListener('click', () => {
    prevSlide(); startSliderTimer();
  });
  document.getElementById('sliderNext')?.addEventListener('click', () => {
    nextSlide(); startSliderTimer();
  });
  document.getElementById('heroSlider')?.addEventListener('mouseenter', pauseSlider);
  document.getElementById('heroSlider')?.addEventListener('mouseleave', startSliderTimer);

  // ── Live checkboxes (immediate filter prep) ──────────────────
  document.getElementById('inStockOnly')?.addEventListener('change', e => {
    state.filters.inStockOnly = e.target.checked;
  });
  document.getElementById('discountOnly')?.addEventListener('change', e => {
    state.filters.discountOnly = e.target.checked;
  });

  // ── Global keyboard shortcuts ────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      closeCart();
      closeAuthModal();
      closeAdminPanel();
      closeMyOrders();
      import('./admin/products.js').then(m => m.closePform());
    }
  });
}