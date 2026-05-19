// =============================================================
// components/modal.js — Product detail modal
// =============================================================
import { state }       from '../state/state.js';
import { renderStars } from './products.js';

export function openProductModal(productId) {
  const p = state.allProducts.find(x => x.id === productId);
  if (!p) return;

  const inCart = state.cart.some(c => c.id === productId);
  const isFav  = state.favorites.includes(productId);
  const saved  = p.oldPrice ? p.oldPrice - p.price : 0;
  const specs  = p.specs || {};

  document.getElementById('modalBody').innerHTML = `
    <div class="modal-gallery">
      <img class="modal-main-img" id="modalMainImg"
           src="${p.image}" alt="${p.name}"
           onerror="this.src='https://picsum.photos/seed/${p.id}/800/600'">
      ${p.images?.length > 1 ? `
        <div class="modal-thumbs">
          ${p.images.map((img, i) => `
            <img class="modal-thumb ${i === 0 ? 'active' : ''}"
                 src="${img}" alt="${p.name}"
                 onclick="switchModalImg('${img}', this)">`).join('')}
        </div>` : ''}
    </div>

    <div class="modal-info">
      <p class="modal-brand">${p.brand}</p>
      <h2 class="modal-title">${p.name}</h2>

      <div class="modal-rating">
        <div class="stars">${renderStars(p.rating)}</div>
        <span class="modal-review-count">${(p.reviews || 0).toLocaleString('uk')} відгуків</span>
        ${p.inStock
          ? '<span style="color:var(--accent);font-size:12px;font-weight:700">✓ В наявності</span>'
          : '<span style="color:#ff4d4d;font-size:12px;font-weight:700">✗ Немає</span>'}
      </div>

      <div class="modal-price-wrap">
        <span class="modal-price">${p.price.toLocaleString('uk')} ₴</span>
        ${p.oldPrice ? `<span class="modal-old-price">${p.oldPrice.toLocaleString('uk')} ₴</span>` : ''}
      </div>
      ${saved > 0 ? `<p class="modal-save">Ви економите ${saved.toLocaleString('uk')} ₴ (${p.discount}%)</p>` : ''}

      <p class="modal-desc">${p.description || ''}</p>

      ${Object.keys(specs).length ? `
        <div class="modal-specs">
          <h4>Характеристики</h4>
          ${Object.entries(specs).map(([k, v]) => `
            <div class="spec-row">
              <span class="spec-key">${k}</span>
              <span class="spec-val">${v}</span>
            </div>`).join('')}
        </div>` : ''}

      <div class="modal-actions">
        <button class="modal-cart-btn ${inCart ? 'in-cart' : ''}"
                onclick="addToCart(${productId});closeModal()">
          ${inCart ? '✓ В кошику' : '🛒 Додати до кошика'}
        </button>
        <button class="modal-wish-btn ${isFav ? 'active' : ''}"
                onclick="toggleFavorite(${productId});this.classList.toggle('active')">
          <svg width="20" height="20" viewBox="0 0 24 24"
               fill="${isFav ? 'currentColor' : 'none'}"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06
                     a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78
                     1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
    </div>`;

  document.getElementById('productModal')?.classList.add('active');
  document.getElementById('modalBackdrop')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}
window.openProductModal = openProductModal;

export function closeModal() {
  document.getElementById('productModal')?.classList.remove('active');
  document.getElementById('modalBackdrop')?.classList.remove('active');
  document.body.style.overflow = '';
}
window.closeModal = closeModal;

export function switchModalImg(src, thumbEl) {
  const img = document.getElementById('modalMainImg');
  if (img) img.src = src;
  document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
}
window.switchModalImg = switchModalImg;