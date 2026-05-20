// Simple validators used by admin and tests
export function isEmail(s) {
  if (!s || typeof s !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export function sanitizeStatus(s) {
  if (s == null) return '';
  return String(s).trim().toLowerCase();
}

export function formatStatusForUI(s) {
  const v = sanitizeStatus(s);
  const map = { pending: 'Очікує', replied: 'Відповідено', closed: 'Закрито' };
  return map[v] || s;
}

export function validateNonEmptyString(s) {
  return typeof s === 'string' && s.trim().length > 0;
}
