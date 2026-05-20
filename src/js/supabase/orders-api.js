// =============================================================
// supabase/orders-api.js — Minimal orders API wrapper
// =============================================================
import { db } from './client.js';

/**
 * Deletes an order row by id in Supabase.
 * Returns { data, error } like Supabase client.
 */
export async function deleteOrder(id) {
  if (!id) return { error: new Error('Missing id') };
  try {
    const resp = await db.from('orders').delete().eq('id', id);
    return resp;
  } catch (err) {
    return { error: err };
  }
}
