// =============================================================
// admin/settings.js — Admin settings panel
// =============================================================
import { state }                  from '../state/state.js';
import { ADMIN_SECRET_CODE }      from '../utils/constants.js';
import { getUsers, getOrders }    from '../utils/storage.js';

export function renderAdminSettings() {
  return `
  <div class="adm-two-col">
    <div class="adm-section-box">
      <div class="adm-section-head"><h3>Налаштування магазину</h3></div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="form-group">
          <label style="font-size:12px;font-weight:700;color:var(--adm-text3);text-transform:uppercase">
            Назва магазину
          </label>
          <input type="text" value="WONDERMARKET" class="adm-input">
        </div>
        <div class="form-group">
          <label style="font-size:12px;font-weight:700;color:var(--adm-text3);text-transform:uppercase">
            Email підтримки
          </label>
          <input type="email" value="support@wondermarket.ua" class="adm-input">
        </div>
        <div class="form-group">
          <label style="font-size:12px;font-weight:700;color:var(--adm-text3);text-transform:uppercase">
            Телефон
          </label>
          <input type="tel" value="+380 44 000 0000" class="adm-input">
        </div>
        <div class="form-group">
          <label style="font-size:12px;font-weight:700;color:var(--adm-text3);text-transform:uppercase">
            Мін. сума для безкоштовної доставки (₴)
          </label>
          <input type="number" value="1500" class="adm-input">
        </div>
        <div class="form-group">
          <label style="font-size:12px;font-weight:700;color:var(--adm-text3);text-transform:uppercase">
            Секретний код адміна
          </label>
          <input type="password" value="${ADMIN_SECRET_CODE}" class="adm-input" readonly>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" checked>
            <span class="checkmark"></span>
            Показувати товари без наявності
          </label>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" checked>
            <span class="checkmark"></span>
            Надсилати email після замовлення
          </label>
        </div>
        <button class="adm-btn-primary"
                style="width:fit-content"
                onclick="showToast('Збережено','Налаштування оновлено','success')">
          Зберегти
        </button>
      </div>
    </div>

    <div class="adm-section-box">
      <div class="adm-section-head"><h3>Інформація системи</h3></div>
      <div class="adm-sys-info">
        <div class="adm-sys-row"><span>Версія</span><span>3.0.0</span></div>
        <div class="adm-sys-row">
          <span>Товарів</span><span>${state.allProducts.length}</span>
        </div>
        <div class="adm-sys-row">
          <span>Користувачів</span><span>${getUsers().length}</span>
        </div>
        <div class="adm-sys-row">
          <span>Замовлень</span><span>${getOrders().length}</span>
        </div>
        <div class="adm-sys-row">
          <span>База даних</span>
          <span style="color:var(--adm-green)">Supabase ✓</span>
        </div>
        <div class="adm-sys-row">
          <span>Проект</span>
          <span style="color:var(--adm-text3)">bkldjrcyncxpfmjsegqq</span>
        </div>
        <div class="adm-sys-row">
          <span>Архітектура</span>
          <span style="color:var(--adm-blue)">ES Modules</span>
        </div>
      </div>
      <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px">
        <button class="adm-btn-danger"
                onclick="if(confirm('Видалити всі замовлення?')){
                  localStorage.removeItem('mkt_orders');
                  renderAdminSection('settings');
                  showToast('Очищено','Всі замовлення видалено','warning');
                }">
          Очистити замовлення
        </button>
        <button class="adm-btn-danger"
                style="background:var(--adm-orange)"
                onclick="if(confirm('Скинути всі дані localStorage?')){
                  localStorage.clear();
                  location.reload();
                }">
          Скинути localStorage
        </button>
      </div>
    </div>
  </div>`;
}