import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ logs: [] });
  }

  const { searchParams } = new URL(req.url);
  const entry_date = searchParams.get('entry_date');

  try {
    let query = supabase.from('daily_stock_logs').select('*');
    if (entry_date) {
      query = query.eq('entry_date', entry_date);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ logs: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: 'Supabase credentials are not configured in .env.local' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'No logs provided' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('daily_stock_logs')
      .upsert(updates, { onConflict: 'item_id,entry_date' })
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: data?.length || updates.length,
      logs: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
