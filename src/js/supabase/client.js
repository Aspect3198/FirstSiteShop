// =============================================================
// supabase/client.js — Supabase client (single shared instance)
// =============================================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function makeMissingProxy() {
	const msg = 'Supabase not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local or environment.';
	// Log once so developer sees reason immediately in console
	console.error(msg);
	return new Proxy({}, {
		get() { throw new Error(msg); },
		apply() { throw new Error(msg); },
		construct() { throw new Error(msg); }
	});
}

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
export const db = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_KEY) : makeMissingProxy();