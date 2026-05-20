// =============================================================
// components/modal.js — Product detail modal
// =============================================================
import { state }       from '../state/state.js';
import { ssSet, ssDel } from '../utils/helpers.js';
import { renderStars } from './products.js';

export function openProductModal(productId) {
  const p = state.allProducts.find(x => x.id === productId);
  if (!p) return;

  const inCart = state.cart.some(c => c.id === productId);
  const isFav  = state.favorites.includes(productId);
  const saved  = p.oldPrice ? p.oldPrice - p.price : 0;
  const specs  = p.specs || {};
  const galleryImages = [p.image]
    .concat(Array.isArray(p.images) ? p.images.filter(src => src && src !== p.image) : [])
    .slice(0, 2);
  const mainImage = galleryImages[0] || p.image;

  const detailPanel = document.getElementById('productDetailPanel');
  const detailBody  = document.getElementById('productDetailContent');
  if (!detailBody || !detailPanel) return;

  state.selectedProduct = productId;
  ssSet('mkt_selectedProduct', productId);

  detailBody.innerHTML = `
    <div class="detail-main">
      <div class="detail-image-panel">
        <div class="detail-image-frame">
          <img id="detailMainImg" src="${mainImage}" alt="${p.name}"
               onerror="this.src='https://picsum.photos/seed/${p.id}/800/600'">
        </div>
        ${galleryImages.length > 1 ? `
          <div class="detail-thumb-row">
            ${galleryImages.map((src, idx) => `
              <button type="button" class="detail-thumb-btn ${idx === 0 ? 'active' : ''}"
                      onclick="switchDetailImage('${src}', this)">
                <img src="${src}" alt="${p.name}">
              </button>`).join('')}
          </div>` : ''}
      </div>

      <div class="detail-info">
        <p class="detail-brand">${p.brand}</p>
        <h2 class="detail-title">${p.name}</h2>

        <div class="detail-rating">
          <div class="stars">${renderStars(p.rating)}</div>
          <span class="detail-review-count">${(p.reviews || 0).toLocaleString('uk')} відгуків</span>
        </div>

        <div class="detail-price-row">
          <div>
            <span class="detail-price">${p.price.toLocaleString('uk')} ₴</span>
            ${p.oldPrice ? `<span class="detail-old-price">${p.oldPrice.toLocaleString('uk')} ₴</span>` : ''}
          </div>
          ${saved > 0 ? `<p class="detail-save">Економія ${saved.toLocaleString('uk')} ₴ (${p.discount}%)</p>` : ''}
        </div>

        <p class="detail-desc">${p.description || ''}</p>

        ${Object.keys(specs).length ? `
          <div class="detail-specs">
            <h4>Характеристики</h4>
            ${Object.entries(specs).map(([k, v]) => `
              <div class="spec-row">
                <span class="spec-key">${k}</span>
                <span class="spec-val">${v}</span>
              </div>`).join('')}
          </div>` : ''}

        <div class="detail-actions">
          <button class="detail-cart-btn ${inCart ? 'in-cart' : ''}"
                  onclick="addToCart(${productId});closeModal()">
            ${inCart ? '✓ В кошику' : '🛒 Додати до кошика'}
          </button>
          <button class="detail-wish-btn ${isFav ? 'active' : ''}"
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
      </div>
    </div>`;

  detailPanel.classList.remove('hidden');
  detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.openProductModal = openProductModal;

export function closeModal() {
  const detailPanel = document.getElementById('productDetailPanel');
  if (detailPanel) detailPanel.classList.add('hidden');
  state.selectedProduct = null;
  ssDel('mkt_selectedProduct');
}
window.closeModal = closeModal;

export function switchDetailImage(src, btn) {
  const img = document.getElementById('detailMainImg');
  if (img) img.src = src;
  document.querySelectorAll('.detail-thumb-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}
window.switchDetailImage = switchDetailImage;

export function switchModalImg(src, thumbEl) {
  const img = document.getElementById('modalMainImg');
  if (img) img.src = src;
  document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
}
window.switchModalImg = switchModalImg;