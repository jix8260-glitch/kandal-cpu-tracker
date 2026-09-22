import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const keyPrefix = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').slice(0, 20);

  const envKeys = Object.keys(process.env).filter(
    (k) =>
      k.includes('SUPABASE') ||
      k.includes('POSTGRES') ||
      k.includes('DATABASE') ||
      k.includes('KV') ||
      k.includes('STORAGE') ||
      k.includes('VERCEL')
  );

  const tableTests: Record<string, any> = {};

  if (isSupabaseConfigured) {
    const tables = ['stores', 'item_master', 'daily_distributions', 'daily_stock_logs', 'system_settings', 'access_logs'];
    for (const tbl of tables) {
      try {
        const res = await supabase.from(tbl).select('*').limit(1);
        tableTests[tbl] = {
          success: !res.error,
          error: res.error?.message || null,
          dataCount: res.data?.length ?? null,
        };
      } catch (err: any) {
        tableTests[tbl] = {
          success: false,
          error: err.message,
        };
      }
    }
  }

  return NextResponse.json({
    supabaseConfigured: isSupabaseConfigured,
    supabaseUrl: url ? url.replace(/^https?:\/\//, '').split('.')[0] + '.supabase.co' : null,
    keyPrefix,
    envKeys,
    tableTests,
  });
}
