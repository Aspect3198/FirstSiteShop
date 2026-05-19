// =============================================================
// components/price-range.js — Dual-handle price range slider
// =============================================================
import { state } from '../state/state.js';

export function initPriceRange() {
  const rMin = document.getElementById('rangeMin');
  const rMax = document.getElementById('rangeMax');
  if (!rMin || !rMax) return;
  const maxVal = Math.max(...state.allProducts.map(p => p.price), 100000);
  rMin.max = maxVal;
  rMax.max = maxVal;
  rMax.value = maxVal;
  updateRangeFill();
}

export function updateRangeFill() {
  const rMin = document.getElementById('rangeMin');
  const rMax = document.getElementById('rangeMax');
  const fill = document.getElementById('rangeFill');
  if (!rMin || !rMax || !fill) return;

  const mn  = +rMin.value;
  const mx  = +rMax.value;
  const max = +rMax.max || 100000;
  fill.style.left  = (mn / max * 100) + '%';
  fill.style.width = ((mx - mn) / max * 100) + '%';

  const pMin = document.getElementById('priceMin');
  const pMax = document.getElementById('priceMax');
  if (pMin) pMin.value = mn;
  if (pMax) pMax.value = mx;
}
window.updateRangeFill = updateRangeFill;