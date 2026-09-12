import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getNormalizedStarterItems } from '@/lib/starter-items';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: 'Supabase credentials are not configured in .env.local' },
      { status: 400 }
    );
  }

  try {
    const itemsToSeed = getNormalizedStarterItems();
    const { data, error } = await supabase
      .from('item_master')
      .upsert(itemsToSeed, { onConflict: 'code' })
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${data?.length || itemsToSeed.length} items into Supabase item_master table!`,
      items: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Database seeding error' },
      { status: 500 }
    );
  }
}
