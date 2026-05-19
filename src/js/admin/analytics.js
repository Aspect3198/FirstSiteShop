// =============================================================
// admin/analytics.js — Charts and KPI metrics
// =============================================================
import { state }             from '../state/state.js';
import { getOrders }         from '../utils/storage.js';
import { CAT_LABELS, ORDER_STATUS_MAP } from '../utils/constants.js';
import { adminStatusBadge }  from './dashboard.js';

export function renderAdminAnalytics() {
  const products = state.allProducts;
  const orders   = getOrders();

  // Products per category
  const byCat  = {};
  products.forEach(p => { byCat[p.category] = (byCat[p.category] || 0) + 1; });
  const maxCat = Math.max(...Object.values(byCat), 1);

  // Revenue & count per order status
  const byStatus = Object.keys(ORDER_STATUS_MAP).map(s => ({
    status: s,
    label:  ORDER_STATUS_MAP[s].label,
    count:  orders.filter(o => o.status === s).length,
    total:  orders.filter(o => o.status === s).reduce((a, o) => a + o.total, 0),
  }));

  const avgRating    = products.length
    ? (products.reduce((a, p) => a + p.rating, 0) / products.length).toFixed(1) : 0;
  const totalReviews = products.reduce((a, p) => a + (p.reviews || 0), 0);

  return `
  <div class="adm-two-col">
    <div class="adm-section-box">
      <div class="adm-section-head"><h3>Товари по категоріях</h3></div>
      <div class="adm-horiz-bars">
        ${Object.entries(byCat).map(([cat, count]) => `
          <div class="adm-horiz-bar-item">
            <span class="adm-horiz-label">${CAT_LABELS[cat] || cat}</span>
            <div class="adm-horiz-track">
              <div class="adm-horiz-fill"
                   style="width:${Math.round((count / maxCat) * 100)}%"></div>
            </div>
            <span class="adm-horiz-val">${count}</span>
          </div>`).join('')}
      </div>
    </div>

    <div class="adm-section-box">
      <div class="adm-section-head"><h3>Замовлення по статусах</h3></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${byStatus.map(s => `
          <div style="display:flex;align-items:center;justify-content:space-between;
                      padding:8px 0;border-bottom:1px solid var(--adm-border)">
            ${adminStatusBadge(s.status)}
            <span style="font-size:13px;color:var(--adm-text3)">${s.count} замовлень</span>
            <strong style="font-size:13px">${s.total.toLocaleString('uk')} ₴</strong>
          </div>`).join('')}
      </div>
    </div>
  </div>

  <div class="adm-section-box">
    <div class="adm-section-head"><h3>Ключові показники</h3></div>
    <div class="adm-kpi-grid">
      <div class="adm-kpi">
        <span class="adm-kpi-val">${products.filter(p => p.discount > 0).length}</span>
        <span class="adm-kpi-label">Товарів зі знижкою</span>
      </div>
      <div class="adm-kpi">
        <span class="adm-kpi-val">${avgRating}</span>
        <span class="adm-kpi-label">Середній рейтинг</span>
      </div>
      <div class="adm-kpi">
        <span class="adm-kpi-val">${totalReviews.toLocaleString('uk')}</span>
        <span class="adm-kpi-label">Всього відгуків</span>
      </div>
      <div class="adm-kpi">
        <span class="adm-kpi-val">${products.filter(p => !p.inStock).length}</span>
        <span class="adm-kpi-label">Немає в наявності</span>
      </div>
      <div class="adm-kpi">
        <span class="adm-kpi-val">${orders.filter(o => o.status === 'delivered').length}</span>
        <span class="adm-kpi-label">Доставлено</span>
      </div>
      <div class="adm-kpi">
        <span class="adm-kpi-val">
          ${orders.reduce((a, o) => a + o.total, 0).toLocaleString('uk')} ₴
        </span>
        <span class="adm-kpi-label">Загальний оборот</span>
      </div>
    </div>
  </div>`;
}