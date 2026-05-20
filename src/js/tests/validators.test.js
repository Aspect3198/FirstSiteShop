import { describe, it, expect } from 'vitest';
import { isEmail, sanitizeStatus, formatStatusForUI, validateNonEmptyString } from '../utils/validators.js';

describe('Validators', () => {
  it('validates emails correctly', () => {
    expect(isEmail('a@b.com')).toBe(true);
    expect(isEmail('invalid@')).toBe(false);
  });

  it('sanitizes status values', () => {
    expect(sanitizeStatus(' RePlIed ')).toBe('replied');
    expect(sanitizeStatus(null)).toBe('');
  });

  it('formats status for UI', () => {
    expect(formatStatusForUI('pending')).toBe('Очікує');
    expect(formatStatusForUI('unknown')).toBe('unknown');
  });

  it('non-empty string validator', () => {
    expect(validateNonEmptyString('  x ')).toBe(true);
    expect(validateNonEmptyString('')).toBe(false);
  });
});
