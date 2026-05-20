// =============================================================
// admin/products.js — Admin product table + CRUD form
// Supabase mutations live here; the API layer in products-api.js
// handles the raw DB calls and returns results.
// =============================================================
import { state }                                from '../state/state.js';
import { CAT_LABELS }                           from '../utils/constants.js';
import { trunc }                                from '../utils/helpers.js';
import { normalizeProduct,
         updateProductStock,
         updateProduct,
         insertProduct,
         deleteProductById }                    from '../supabase/products-api.js';
import { applyFiltersAndRender,
         renderCategories }                     from '../components/filters.js';
import { showToast }                            from '../components/ui.js';
import { loadProducts }                         from '../supabase/products-api.js';
import { ssGet, ssSet, ssDel }                  from '../utils/helpers.js';

// ─── Table render ─────────────────────────────────────────────
export function renderAdminProducts() {
  return `
  <div class="adm-toolbar">
    <input type="text" class="adm-search-input"
           placeholder="Пошук товарів…"
           oninput="adminFilterProducts(this.value)"
           id="admProdSearch">
    <div style="display:flex;gap:8px;align-items:center">
      <select class="adm-status-select"
              onchange="adminFilterProductsCat(this.value)">
        <option value="">Всі категорії</option>
        ${Object.entries(CAT_LABELS).map(([k, v]) =>
          `<option value="${k}">${v}</option>`).join('')}
      </select>
      <button class="adm-btn-primary" onclick="openProductForm()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5"  y1="12" x2="19" y2="12"/>
        </svg>
        Додати товар
      </button>
    </div>
  </div>
  <div class="adm-section-box" style="padding:0;overflow:auto">
    <table class="adm-table adm-prod-table">
      <thead>
        <tr>
          <th>Фото</th><th>Назва / Бренд</th><th>Категорія</th>
          <th>Ціна</th><th>Знижка</th><th>Бейдж</th><th>Статус</th><th>Дії</th>
        </tr>
      </thead>
      <tbody id="admProdTbody">${adminProductRows(state.allProducts)}</tbody>
    </table>
  </div>`;
}

export function adminProductRows(products) {
  return products.map(p => `
    <tr id="admPRow_${p.id}">
      <td>
        <img class="adm-prod-thumb" src="${p.image}"
             onerror="this.src='https://picsum.photos/seed/${p.id}/60/60'">
      </td>
      <td>
        <span class="adm-prod-name">${trunc(p.name, 34)}</span>
        <br><small style="color:var(--adm-text3)">${p.brand}</small>
      </td>
      <td><span class="adm-cat-tag">${CAT_LABELS[p.category] || p.category}</span></td>
      <td>
        <strong>${p.price.toLocaleString('uk')} ₴</strong>
        ${p.oldPrice
          ? `<br><small style="text-decoration:line-through;color:var(--adm-text3)">
               ${p.oldPrice.toLocaleString('uk')} ₴</small>` : ''}
      </td>
      <td>${p.discount > 0 ? `<span class="adm-discount-tag">-${p.discount}%</span>` : '—'}</td>
      <td>${p.badge
        ? `<span class="adm-prod-badge badge-${p.badge}">
             ${{ new:'NEW', sale:'SALE', top:'TOP' }[p.badge] || p.badge}</span>` : '—'}</td>
      <td>
        <span class="adm-status-badge ${p.inStock ? 'status-delivered' : 'status-cancelled'}">
          ${p.inStock ? 'В наявності' : 'Немає'}
        </span>
      </td>
      <td class="adm-actions-cell">
        <button class="adm-icon-btn edit"
                onclick="openProductForm(${p.id})" title="Редагувати">✏️</button>
        <button class="adm-icon-btn toggle"
                onclick="adminToggleStock(${p.id})" title="Наявність">📦</button>
        <button class="adm-icon-btn delete"
                onclick="adminDeleteProduct(${p.id})" title="Видалити">🗑️</button>
      </td>
    </tr>`).join('');
}

export function adminFilterProducts(q) {
  const filtered = state.allProducts.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.brand.toLowerCase().includes(q.toLowerCase()),
  );
  const el = document.getElementById('admProdTbody');
  if (el) el.innerHTML = adminProductRows(filtered);
}
window.adminFilterProducts = adminFilterProducts;

export function adminFilterProductsCat(cat) {
  const filtered = cat
    ? state.allProducts.filter(p => p.category === cat)
    : state.allProducts;
  const el = document.getElementById('admProdTbody');
  if (el) el.innerHTML = adminProductRows(filtered);
}
window.adminFilterProductsCat = adminFilterProductsCat;

// ─── Toggle stock ─────────────────────────────────────────────
export async function adminToggleStock(id) {
  const p = state.allProducts.find(x => x.id === id);
  if (!p) return;

  const newStock = !p.inStock;
  const { error } = await updateProductStock(id, newStock);

  if (error) {
    showToast('Помилка', error.message, 'error');
    return;
  }

  p.inStock = newStock;
  window.renderAdminSection?.('products');
  applyFiltersAndRender();
  showToast('Оновлено',
    `${trunc(p.name, 28)} — ${p.inStock ? 'в наявності' : 'немає'}`, 'info');
}
window.adminToggleStock = adminToggleStock;

// ─── Delete ───────────────────────────────────────────────────
export async function adminDeleteProduct(id) {
  const p = state.allProducts.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Видалити "${trunc(p.name, 40)}"?`)) return;

  const { error } = await deleteProductById(id);
  if (error) { showToast('Помилка видалення', error.message, 'error'); return; }

  state.allProducts = state.allProducts.filter(x => x.id !== id);
  state.cart        = state.cart.filter(c => c.id !== id);
  state.favorites   = state.favorites.filter(f => f !== id);

  window.saveAll?.();
  window.renderAdminSection?.('products');
  applyFiltersAndRender();
  showToast('Видалено', trunc(p.name, 34), 'warning');
}
window.adminDeleteProduct = adminDeleteProduct;

// ─── Product form ─────────────────────────────────────────────
export function openProductForm(editId = null) {
  const p = editId ? state.allProducts.find(x => x.id === editId) : null;
  document.getElementById('pformTitle').textContent = p ? 'Редагувати товар' : 'Додати товар';

  const catOpts   = Object.entries(CAT_LABELS)
    .map(([k, v]) => `<option value="${k}" ${p?.category === k ? 'selected' : ''}>${v}</option>`)
    .join('');
  const badgeOpts = ['', 'new', 'sale', 'top']
    .map(b => `<option value="${b}" ${(p?.badge || '') === b ? 'selected' : ''}>${b || '—'}</option>`)
    .join('');

  // If there's a saved draft in session (and we're creating new), restore it
  const draft = !editId && ssGet('mkt_admin_pform');

  document.getElementById('pformBody').innerHTML = `
  <div class="pform-grid">
    <div class="form-group" style="grid-column:1/-1">
      <label>Назва *</label>
      <input id="pf_name" type="text" value="${draft?.name ?? p?.name ?? ''}" placeholder="Назва товару">
    </div>
    <div class="form-group">
      <label>Бренд *</label>
      <input id="pf_brand" type="text" value="${draft?.brand ?? p?.brand ?? ''}" placeholder="Apple, Samsung…">
    </div>
    <div class="form-group">
      <label>Категорія</label>
      <select id="pf_cat">${catOpts}</select>
    </div>
    <div class="form-group">
      <label>Ціна (₴) *</label>
      <input id="pf_price" type="number" value="${draft?.price ?? p?.price ?? ''}" min="0">
    </div>
    <div class="form-group">
      <label>Стара ціна (₴)</label>
      <input id="pf_oldprice" type="number" value="${draft?.oldPrice ?? p?.oldPrice ?? ''}" min="0">
    </div>
    <div class="form-group">
      <label>Знижка (%)</label>
      <input id="pf_discount" type="number" value="${draft?.discount ?? p?.discount ?? 0}" min="0" max="99">
    </div>
    <div class="form-group">
      <label>Рейтинг (1–5)</label>
      <input id="pf_rating" type="number" value="${draft?.rating ?? p?.rating ?? 4.5}" min="1" max="5" step="0.1">
    </div>
    <div class="form-group">
      <label>Відгуків</label>
      <input id="pf_reviews" type="number" value="${draft?.reviews ?? p?.reviews ?? 0}" min="0">
    </div>
    <div class="form-group">
      <label>Бейдж</label>
      <select id="pf_badge">${badgeOpts}</select>
    </div>
    <div class="form-group" style="grid-column:1/-1">
      <label>URL фото *</label>
      <input id="pf_image" type="text" value="${draft?.image ?? p?.image ?? ''}" placeholder="https://…">
      <div id="pf_img_preview" style="margin-top:8px">
        ${p?.image
          ? `<img src="${p.image}"
                  style="height:80px;border-radius:8px;border:1px solid var(--adm-border)"
                  onerror="this.style.display='none'">`
          : ''}
      </div>
    </div>
    <div class="form-group" style="grid-column:1/-1">
      <label>Опис</label>
      <textarea id="pf_desc" rows="3">${draft?.description ?? p?.description ?? ''}</textarea>
    </div>
    <div class="form-group">
      <label class="checkbox-label">
        <input type="checkbox" id="pf_instock" ${((draft?.inStock ?? p?.inStock) !== false) ? 'checked' : ''}>
        <span class="checkmark"></span>В наявності
      </label>
    </div>
  </div>
  <div class="pform-footer">
    <button class="adm-btn-secondary" onclick="closePform()">Скасувати</button>
    <button class="adm-btn-primary" onclick="adminSaveProduct(${editId || 'null'})">
      ${p ? 'Зберегти' : 'Додати товар'}
    </button>
  </div>`;

  // Live image preview
  document.getElementById('pf_image')?.addEventListener('input', function () {
    const prev = document.getElementById('pf_img_preview');
    if (prev) {
      prev.innerHTML = this.value
        ? `<img src="${this.value}"
                style="height:80px;border-radius:8px;border:1px solid var(--adm-border)"
                onerror="this.style.display='none'">`
        : '';
    }
  });

  // Persist draft to sessionStorage on input/change
  const saveDraft = () => {
    const draftData = {
      name:   document.getElementById('pf_name')?.value || '',
      brand:  document.getElementById('pf_brand')?.value || '',
      category: document.getElementById('pf_cat')?.value || '',
      price:  document.getElementById('pf_price')?.value || '',
      oldPrice: document.getElementById('pf_oldprice')?.value || '',
      discount: document.getElementById('pf_discount')?.value || 0,
      rating: document.getElementById('pf_rating')?.value || 4.5,
      reviews: document.getElementById('pf_reviews')?.value || 0,
      badge:  document.getElementById('pf_badge')?.value || '',
      image:  document.getElementById('pf_image')?.value || '',
      description: document.getElementById('pf_desc')?.value || '',
      inStock: document.getElementById('pf_instock')?.checked || false,
    };
    ssSet('mkt_admin_pform', draftData);
    ssSet('mkt_admin_pform_open', true);
  };

  ['pf_name','pf_brand','pf_cat','pf_price','pf_oldprice','pf_discount','pf_rating','pf_reviews','pf_badge','pf_image','pf_desc','pf_instock']
    .forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener(el.tagName === 'INPUT' && el.type === 'checkbox' ? 'change' : 'input', saveDraft);
    });

  // mark form open in session
  ssSet('mkt_admin_pform_open', true);

  document.getElementById('pformModal')?.classList.add('open');
  document.getElementById('pformBackdrop')?.classList.add('active');
}
window.openProductForm = openProductForm;

export function closePform() {
  document.getElementById('pformModal')?.classList.remove('open');
  document.getElementById('pformBackdrop')?.classList.remove('active');
  // clear draft when closing explicitly
  ssDel('mkt_admin_pform');
  ssDel('mkt_admin_pform_open');
}
window.closePform = closePform;

// ─── Save (insert / update) ───────────────────────────────────
export async function adminSaveProduct(editId) {
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

  // DB payload uses Supabase snake_case column names
  const dbPayload = {
    name, brand, category: cat, price,
    old_price:   oldPrice,
    discount,    rating, reviews, badge,
    description: desc,
    in_stock:    inStock,
    image:       image || `https://picsum.photos/seed/${Date.now()}/400/400`,
  };

  if (editId) {
    const existing = state.allProducts.find(x => x.id === editId);
    if (!existing) return;

    // Optimistic update
    Object.assign(existing, normalizeProduct({ ...existing, ...dbPayload }));

    const { error } = await updateProduct(editId, dbPayload);
    if (error) {
      // Revert by reloading from Supabase
      await loadProducts();
      showToast('Помилка збереження', error.message, 'error');
      return;
    }
    showToast('Збережено', trunc(name, 34), 'success');

  } else {
    const dup = state.allProducts.find(
      p => p.name.toLowerCase() === name.toLowerCase() &&
           p.brand.toLowerCase() === brand.toLowerCase(),
    );
    if (dup) { showToast('Дублікат', 'Товар з такою назвою вже є', 'warning'); return; }

    const fullPayload = { ...dbPayload, images: image ? [image] : [], popular: 50, tags: [], specs: {} };
    const { data: inserted, error } = await insertProduct(fullPayload);
    if (error) { showToast('Помилка', error.message, 'error'); return; }

    state.allProducts.unshift(normalizeProduct(inserted));
    showToast('Товар додано', trunc(name, 34), 'success');
  }

  closePform();
  window.renderAdminSection?.('products');
  applyFiltersAndRender();
  renderCategories();
}
window.adminSaveProduct = adminSaveProduct;