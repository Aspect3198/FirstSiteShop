import { describe, it, expect } from 'vitest';
import { formatStatusForUI } from '../utils/validators.js';

describe('Status formatter', () => {
  it('maps known statuses to Ukrainian labels', () => {
    expect(formatStatusForUI('pending')).toBe('Очікує');
    expect(formatStatusForUI('replied')).toBe('Відповідено');
    expect(formatStatusForUI('closed')).toBe('Закрито');
  });
});
