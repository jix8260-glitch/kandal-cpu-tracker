import { NextRequest, NextResponse } from 'next/server';
import { generateExpiringQRToken, detectLocalLanIp } from '@/lib/local-security';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const expiryMinutes = parseInt(searchParams.get('expiry') || '15', 10);
    const customIp = searchParams.get('ip');

    const tokenData = generateExpiringQRToken(expiryMinutes);
    const lanIp = customIp || detectLocalLanIp();
    const qrUrl = `http://${lanIp}:3000/request?token=${encodeURIComponent(tokenData.token)}`;

    // Generate high-quality QR code data URL (PNG)
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 8,
      color: {
        dark: '#0f172a', // slate-900
        light: '#ffffff',
      },
    });

    return NextResponse.json({
      success: true,
      token: tokenData.token,
      expiresAt: tokenData.expiresAt,
      lanIp,
      qrUrl,
      qrDataUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
