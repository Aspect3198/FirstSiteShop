import { describe, it, expect, beforeEach } from 'vitest';
import { lsGet, lsSet, lsDel, ssGet, ssSet, ssDel } from '../utils/helpers.js';

describe('Storage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('localStorage set/get/delete', () => {
    lsSet('x', { a: 1 });
    expect(lsGet('x')).toEqual({ a: 1 });
    lsDel('x');
    expect(lsGet('x')).toBeNull();
  });

  it('sessionStorage set/get/delete', () => {
    ssSet('y', [1,2,3]);
    expect(ssGet('y')).toEqual([1,2,3]);
    ssDel('y');
    expect(ssGet('y')).toBeNull();
  });
});
