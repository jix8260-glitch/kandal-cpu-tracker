import { NextRequest, NextResponse } from 'next/server';
import {
  createScanRequest,
  getScanRequests,
  getScanRequestById,
  updateScanRequestStatus,
  RequestStatus,
} from '@/lib/local-db';
import { verifyQRToken } from '@/lib/local-security';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status') as RequestStatus | null;

    if (id) {
      const record = getScanRequestById(id);
      if (!record) {
        return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, request: record });
    }

    const list = getScanRequests(status || undefined);
    return NextResponse.json({
      success: true,
      requests: list,
      pendingCount: list.filter((r) => r.status === 'PENDING').length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requesterName, department, actionType, payloadJson, token } = body;

    if (!requesterName || !actionType || !payloadJson) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (requesterName, actionType, payloadJson)' },
        { status: 400 }
      );
    }

    // If a token was provided, verify its cryptographic integrity & expiry
    if (token) {
      const tokenVerification = verifyQRToken(token);
      if (!tokenVerification.valid) {
        return NextResponse.json(
          { success: false, error: tokenVerification.reason || 'Invalid QR Token' },
          { status: 403 }
        );
      }
    }

    const newRequest = createScanRequest({
      requesterName,
      department: department || 'General Store',
      actionType,
      payloadJson,
      ttlMinutes: 60,
    });

    return NextResponse.json({
      success: true,
      message: 'Request submitted successfully. Awaiting Admin Approval.',
      request: newRequest,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, reviewedBy, rejectionNote } = body;

    if (!id || !status || !reviewedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (id, status, reviewedBy)' },
        { status: 400 }
      );
    }

    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return NextResponse.json({ success: false, error: 'Status must be APPROVED or REJECTED' }, { status: 400 });
    }

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';

    const result = updateScanRequestStatus({
      id,
      status,
      reviewedBy,
      rejectionNote,
      ipAddress,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Request ${status.toLowerCase()} successfully`,
      request: result.request,
      ledgerRecord: result.ledgerRecord,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
