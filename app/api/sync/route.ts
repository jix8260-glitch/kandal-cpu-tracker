import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CLOUD_OBJECT_ID = 'ff808181a067127101a09522e8a600ef';
const CLOUD_URL = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;

export async function GET() {
  try {
    const res = await fetch(CLOUD_URL, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ storesByDate: {}, stockByDate: {}, itemPrices: {} });
    }
    const json = await res.json();
    return NextResponse.json(json.data || { storesByDate: {}, stockByDate: {}, itemPrices: {} });
  } catch (error: any) {
    console.error('Failed to fetch from cloud sync:', error);
    return NextResponse.json({ storesByDate: {}, stockByDate: {}, itemPrices: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storesByDate, stockByDate, itemPrices } = body;

    const res = await fetch(CLOUD_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'kandal_commissary_kitchen_store_totals_v1',
        data: {
          storesByDate: storesByDate || {},
          stockByDate: stockByDate || {},
          itemPrices: itemPrices || {},
          lastUpdated: new Date().toISOString(),
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Cloud PUT failed:', errText);
      return NextResponse.json({ success: false, error: errText }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cloud sync error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
