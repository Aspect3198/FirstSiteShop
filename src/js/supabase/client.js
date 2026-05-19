// =============================================================
// supabase/client.js — Supabase client (single shared instance)
// =============================================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bkldjrcyncxpfmjsegqq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Kqe1m9DtX81brGFAXOa00A_53n-DtK-';

export const db = createClient(SUPABASE_URL, SUPABASE_KEY);