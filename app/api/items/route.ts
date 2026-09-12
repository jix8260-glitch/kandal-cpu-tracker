import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ items: [] });
  }

  const { searchParams } = new URL(req.url);
  const location = searchParams.get('location');

  try {
    let query = supabase.from('item_master').select('*').order('code');
    if (location && location !== 'ALL') {
      query = query.eq('location', location);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ items: data || [] });
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
    const itemData = await req.json();
    const { data, error } = await supabase
      .from('item_master')
      .upsert([itemData], { onConflict: 'code' })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, item: data?.[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Item id is required' }, { status: 400 });
  }

  try {
    const { error } = await supabase.from('item_master').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
