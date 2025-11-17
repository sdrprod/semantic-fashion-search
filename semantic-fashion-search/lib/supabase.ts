import { createClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
let supabaseAdmin: ReturnType<typeof createClient> | null = null;
let supabaseClient: ReturnType<typeof createClient> | null = null;
let initialized = false;

function initializeClients() {
  if (initialized) return;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  initialized = true;
}

export { supabaseAdmin, supabaseClient };

// Helper to get the appropriate client
export function getSupabaseClient(isServer: boolean = false) {
  initializeClients();

  if (isServer) {
    if (!supabaseAdmin) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for server-side operations');
    }
    return supabaseAdmin;
  }

  if (!supabaseClient) {
    throw new Error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY for client-side operations');
  }
  return supabaseClient;
}

// Database types
export interface ProductRow {
  id: string;
  brand: string;
  title: string;
  description: string;
  tags: string[];
  price: number | null;
  currency: string;
  image_url: string;
  product_url: string;
  combined_text: string;
  embedding: number[];
  similarity?: number;
  created_at: string;
  updated_at: string;
}
