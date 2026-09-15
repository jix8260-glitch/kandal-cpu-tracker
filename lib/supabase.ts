import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const defaultKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabaseCredentials(): { url: string; key: string; isConfigured: boolean } {
  let url = defaultUrl;
  let key = defaultKey;

  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem('supabase_cloud_url');
    const localKey = localStorage.getItem('supabase_cloud_key');
    if (localUrl && localKey) {
      url = localUrl;
      key = localKey;
    }
  }

  const isConfigured = Boolean(url && key && url.startsWith('http'));
  return { url, key, isConfigured };
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;
  if (!cachedClient || lastUsedUrl !== url || lastUsedKey !== key) {
    cachedClient = createClient(url, key);
    lastUsedUrl = url;
    lastUsedKey = key;
  }
  return cachedClient;
}

export const isSupabaseConfigured = Boolean(defaultUrl && defaultKey && defaultUrl.startsWith('http'));

export const supabase = createClient(
  isSupabaseConfigured ? defaultUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? defaultKey : 'placeholder-anon-key'
);
