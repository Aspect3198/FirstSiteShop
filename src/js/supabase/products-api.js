// =============================================================
// supabase/products-api.js — All Supabase CRUD for "products"
// Pure data layer: no UI calls, no state mutations here.
// =============================================================
import { db }    from './client.js';
import { state } from '../state/state.js';

// ─── Normalisation ───────────────────────────────────────────
/**
 * Maps a raw Supabase row (snake_case) to the camelCase shape
 * the rest of the app uses, and provides safe defaults for every
 * optional column.
 *
 * Supabase column  →  App property
 *   old_price      →  oldPrice
 *   in_stock       →  inStock
 */
export function normalizeProduct(row) {
  return {
    ...row,
    oldPrice:    row.old_price    ?? row.oldPrice    ?? null,
    inStock:     row.in_stock     ?? row.inStock     ?? true,
    brand:       row.brand        ?? '',
    discount:    row.discount     ?? 0,
    reviews:     row.reviews      ?? 0,
    popular:     row.popular      ?? 50,
    description: row.description  ?? '',
    images:      row.images       ?? [],
    tags:        row.tags         ?? [],
    specs:       row.specs        ?? {},
  };
}

// ─── READ ─────────────────────────────────────────────────────
/**
 * Fetches all products from Supabase, normalises them,
 * and assigns to state.allProducts.
 * Throws on Supabase error so the caller (init) can handle it.
 */
export async function loadProducts() {
  console.log('[WONDERMARKET] Fetching products from Supabase…');

  const { data, error } = await db
    .from('products')
    .select('*')
    .order('rating', { ascending: false });

  if (error) throw new Error(`Supabase: ${error.message}`);
  if (!Array.isArray(data)) throw new Error('Supabase: unexpected response — expected array');

  state.allProducts = data.map(normalizeProduct);
  console.log(`[WONDERMARKET] ✅ Loaded ${state.allProducts.length} products`);
}

// ─── UPDATE ──────────────────────────────────────────────────
/**
 * Toggles in_stock for a single product.
 * Returns { error } — caller handles UI.
 */
export async function updateProductStock(id, newStock) {
  return db.from('products').update({ in_stock: newStock }).eq('id', id);
}

/**
 * Full product update via admin form.
 * Returns { error } — caller handles UI.
 */
export async function updateProduct(id, dbPayload) {
  return db.from('products').update(dbPayload).eq('id', id);
}

// ─── INSERT ──────────────────────────────────────────────────
/**
 * Inserts a new product row.
 * Returns { data, error } — caller handles state + UI.
 */
export async function insertProduct(dbPayload) {
  return db.from('products').insert(dbPayload).select().single();
}

// ─── DELETE ──────────────────────────────────────────────────
/**
 * Hard-deletes a product by id.
 * Returns { error } — caller handles state + UI.
 */
export async function deleteProductById(id) {
  return db.from('products').delete().eq('id', id);
}