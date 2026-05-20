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

// ─── sessionStorage helpers ───────────────────────────────────
export function ssGet(key) {
  try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; }
}

export function ssSet(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

export function ssDel(key) {
  try { sessionStorage.removeItem(key); } catch { /* ignore */ }
}

/**
 * Format Supabase errors into user-friendly messages, with RLS detection.
 * Returns a descriptive string safe to show to end users.
 */
export function formatSupabaseError(err) {
  if (!err) return 'Unknown Supabase error';
  const message = err.message || err.msg || err.error_description || JSON.stringify(err);
  const lower = String(message).toLowerCase();
  const isRls = lower.includes('policy') || lower.includes('permission denied') || lower.includes('row-level') || lower.includes('rls') || lower.includes('not authorized');
  if (isRls) {
    return `Supabase RLS policy blocked this action. Check permissions and review docs/supabase.md — details: ${message}`;
  }
  return message;
}
