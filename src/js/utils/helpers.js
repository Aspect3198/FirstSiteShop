// =============================================================
// utils/helpers.js — Pure utility functions (no side-effects)
// =============================================================

/** Truncate string to n chars, appending ellipsis if needed */
export function trunc(s, n) {
  return s && s.length > n ? s.slice(0, n) + '…' : (s || '');
}

/** Wrap regex match in a <mark> highlight span */
export function hilite(text, query) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(`(${escaped})`, 'gi'),
    '<mark style="background:var(--accent-light);color:var(--accent)">$1</mark>',
  );
}

// ─── localStorage helpers ────────────────────────────────────
export function lsGet(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

export function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

export function lsDel(key) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}