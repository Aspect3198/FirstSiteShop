import { describe, it, expect } from 'vitest';
import { isEmail, validateNonEmptyString } from '../utils/validators.js';

describe('Input validation edge cases', () => {
  it('rejects emails with spaces', () => {
    expect(isEmail('a b@c.com')).toBe(false);
  });

  it('trims non-empty strings', () => {
    expect(validateNonEmptyString('  ')).toBe(false);
    expect(validateNonEmptyString('\n\t text ')).toBe(true);
  });
});
