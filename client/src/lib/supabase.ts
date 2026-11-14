import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://drdoziabudopvgewznvq.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_OHmyWNsWGRemFGjHJMt-Vg_R9XNN7d2";

const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const envAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

const supabaseUrl = envUrl || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = envAnonKey || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

