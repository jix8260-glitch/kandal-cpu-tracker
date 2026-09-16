import { NextResponse } from 'next/server';
import { readDatabase } from '@/lib/local-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = readDatabase();
    return NextResponse.json({
      success: true,
      auditLogs: db.auditLogs.slice(0, 100),
      totalCount: db.auditLogs.length,
      settings: db.settings,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
