import { describe, it, expect } from 'vitest';
import { formatSupabaseError } from '../utils/helpers.js';

describe('formatSupabaseError', () => {
  it('detects RLS-like messages', () => {
    const err = { message: 'permission denied for relation contact_requests' };
    const out = formatSupabaseError(err);
    expect(out).toContain('Supabase RLS policy');
  });

  it('returns raw message for non-RLS errors', () => {
    const err = { message: 'some network error' };
    const out = formatSupabaseError(err);
    expect(out).toBe('some network error');
  });
});
