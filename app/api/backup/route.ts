import { NextRequest, NextResponse } from 'next/server';
import { createLocalBackup, listLocalBackups, restoreLocalBackup } from '@/lib/local-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const backups = listLocalBackups();
    return NextResponse.json({ success: true, backups });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'CREATE';

    if (action === 'RESTORE') {
      if (!body.filename) {
        return NextResponse.json({ success: false, error: 'Filename is required for restore' }, { status: 400 });
      }
      const restored = restoreLocalBackup(body.filename);
      return NextResponse.json({ success: restored, message: restored ? 'Database restored successfully' : 'Restore failed' });
    }

    const backup = createLocalBackup('ADMIN_DASHBOARD');
    return NextResponse.json({
      success: true,
      message: 'Local backup created successfully',
      backup,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
