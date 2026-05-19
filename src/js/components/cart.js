// =============================================================
// components/cart.js — Cart state, rendering, and checkout
// =============================================================
import { state }              from '../state/state.js';
import { trunc }              from '../utils/helpers.js';
import { saveAll, getOrders, saveOrders, getUsers, saveUsers } from '../utils/storage.js';
import { showToast, updateCountBadges } from './ui.js';
import { openAuthModal }      from './auth.js';

// ─── Mutations ───────────────────────────────────────────────
export function addToCart(productId) {
  const p = state.allProducts.find(x => x.id === productId);
  if (!p) return;
  if (!p.inStock) { showToast('Немає в наявності', 'Товар закінчився', 'error'); return; }

  const existing = state.cart.find(c => c.id === productId);
  if (existing) {
    existing.qty = Math.min(existing.qty + 1, 99);
    showToast('Кількість збільшена', `${trunc(p.name, 32)} ×${existing.qty}`, 'info');
  } else {
    state.cart.push({ id: productId, qty: 1 });
    showToast('Додано до кошика', trunc(p.name, 40), 'success');
  }
  saveAll();
  updateCountBadges();
  renderCartUI();
  updateCardCartState(productId, true);
}
window.addToCart = addToCart;

export function removeFromCart(productId) {
  const p = state.allProducts.find(x => x.id === productId);
  state.cart = state.cart.filter(c => c.id !== productId);
  saveAll();
  updateCountBadges();
  renderCartUI();
  updateCardCartState(productId, false);
  if (p) showToast('Видалено з кошика', trunc(p.name, 36), 'warning');
}
window.removeFromCart = removeFromCart;

export function updateQty(productId, delta) {
  const item = state.cart.find(c => c.id === productId);
  if (!item) return;
  item.qty = Math.max(1, Math.min(99, item.qty + delta));
  if (item.qty < 1) { removeFromCart(productId); return; }
  saveAll();
  renderCartUI();
}
window.updateQty = updateQty;

export function clearCart() {
  state.cart = [];
  saveAll();
  updateCountBadges();
  renderCartUI();
  showToast('Кошик очищено', 'Всі товари видалено', 'info');
}

// ─── Checkout ────────────────────────────────────────────────
export function checkout() {
  if (!state.user) {
    showToast('Увійдіть', 'Для замовлення потрібен акаунт', 'warning');
    openAuthModal();
    return;
  }
  if (state.cart.length === 0) {
    showToast('Кошик порожній', 'Додайте товари', 'warning');
    return;
  }

  const order = {
    id:        'ORD-' + Date.now(),
    userId:    state.user.id,
    userName:  state.user.name,
    userEmail: state.user.email,
    date:      new Date().toLocaleDateString('uk-UA'),
    items:     state.cart.map(c => {
      const p = state.allProducts.find(x => x.id === c.id);
      return { id: c.id, name: p?.name || '', price: p?.price || 0, qty: c.qty, image: p?.image || '' };
    }),
    total:  state.cart.reduce((acc, c) => {
      const p = state.allProducts.find(x => x.id === c.id);
      return acc + (p?.price || 0) * c.qty;
    }, 0),
    status: 'pending',
  };

  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);

  // Increment user order counter
  const users = getUsers();
  const u     = users.find(x => x.id === state.user.id);
  if (u) { u.orders = (u.orders || 0) + 1; u.totalSpent = (u.totalSpent || 0) + order.total; saveUsers(users); }

  clearCart();
  closeCart();
  showToast('Замовлення оформлено!', `№ ${order.id} — ${order.total.toLocaleString('uk')} ₴`, 'success', 5000);

  // Update admin badge if visible
  window.updateAdminOrdersBadge?.();
}

// ─── Sync card button state (in-cart / not) ──────────────────
export function updateCardCartState(productId, inCart) {
  document.querySelectorAll(`.product-card[data-id="${productId}"] .add-cart-btn`)
    .forEach(btn => {
      btn.classList.toggle('in-cart', inCart);
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
             width="13" height="13">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72
                   a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        ${inCart ? 'В кошику' : 'Купити'}`;
    });
}

// ─── Render cart sidebar ──────────────────────────────────────
export function renderCartUI() {
  const itemsEl  = document.getElementById('cartItems');
  const emptyEl  = document.getElementById('cartEmptyMsg');
  const footerEl = document.getElementById('cartFooter');
  const countEl  = document.getElementById('cartItemsCount');
  const totalEl  = document.getElementById('cartTotalPrice');
  const discEl   = document.getElementById('cartDiscount');
  if (!itemsEl) return;

  if (state.cart.length === 0) {
    itemsEl.innerHTML = '';
    emptyEl?.classList.remove('hidden');
    footerEl?.classList.add('hidden');
    return;
  }

  emptyEl?.classList.add('hidden');
  footerEl?.classList.remove('hidden');

  let total = 0, saved = 0, count = 0;

  itemsEl.innerHTML = state.cart.map(item => {
    const p = state.allProducts.find(x => x.id === item.id);
    if (!p) return '';
    const line    = p.price * item.qty;
    const lineOld = (p.oldPrice || p.price) * item.qty;
    total += line;
    saved += lineOld - line;
    count += item.qty;

    return `
    <div class="cart-item">
      <img class="cart-item-img" src="${p.image}" alt="${p.name}"
           onerror="this.src='https://picsum.photos/seed/${p.id}/80/80'">
      <div class="cart-item-info">
        <div class="cart-item-name">${p.name}</div>
        <div class="cart-item-price">${line.toLocaleString('uk')} ₴</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="updateQty(${p.id},-1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty(${p.id},1)">+</button>
          <button class="remove-item-btn" onclick="removeFromCart(${p.id})">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6"  x2="6"  y2="18"/>
              <line x1="6"  y1="6"  x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>`;
  }).join('');

  if (countEl) countEl.textContent = count;
  if (totalEl) totalEl.textContent = total.toLocaleString('uk') + ' ₴';
  if (discEl)  discEl.textContent  = '-' + saved.toLocaleString('uk') + ' ₴';
}

// ─── Open / close sidebar ─────────────────────────────────────
export function openCart() {
  document.getElementById('cartSidebar')?.classList.add('open');
  document.getElementById('overlay')?.classList.add('active');
  renderCartUI();
}

export function closeCart() {
  document.getElementById('cartSidebar')?.classList.remove('open');
  if (!document.querySelector('.sidebar.open'))
    document.getElementById('overlay')?.classList.remove('active');
}