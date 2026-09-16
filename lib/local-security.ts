import crypto from 'crypto';
import os from 'os';

const SECRET_KEY = process.env.LOCAL_SECURITY_SECRET || 'kandal-commissary-secure-local-vault-2026-key';

// ==============================================================================
// 1. LAN IP DETECTION (Detects local Wi-Fi IP automatically)
// ==============================================================================
export function detectLocalLanIp(): string {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        // Skip internal (127.0.0.1) and non-IPv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (err) {
    console.warn('Could not detect LAN IP, falling back to localhost:', err);
  }
  return '192.168.1.44';
}

// ==============================================================================
// 2. CRYPTOGRAPHIC SIGNED EXPIRING QR CODES
// ==============================================================================
export interface QRTokenPayload {
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

export function generateExpiringQRToken(expiryMinutes = 15): {
  token: string;
  expiresAt: number;
  qrUrl: string;
} {
  const now = Date.now();
  const expiresAt = now + expiryMinutes * 60 * 1000;
  const nonce = crypto.randomBytes(8).toString('hex');

  const payload: QRTokenPayload = {
    issuedAt: now,
    expiresAt,
    nonce,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payloadBase64)
    .digest('base64url');

  const token = `${payloadBase64}.${signature}`;
  const lanIp = detectLocalLanIp();
  const qrUrl = `http://${lanIp}:3000/request?token=${encodeURIComponent(token)}`;

  return {
    token,
    expiresAt,
    qrUrl,
  };
}

export function verifyQRToken(tokenString: string): { valid: boolean; reason?: string } {
  if (!tokenString || !tokenString.includes('.')) {
    return { valid: false, reason: 'Invalid token format' };
  }

  const [payloadBase64, providedSig] = tokenString.split('.');
  const expectedSig = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payloadBase64)
    .digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(providedSig), Buffer.from(expectedSig))) {
    return { valid: false, reason: 'Cryptographic signature mismatch (Tampered token)' };
  }

  try {
    const payload: QRTokenPayload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
    const now = Date.now();
    if (now > payload.expiresAt) {
      return { valid: false, reason: 'QR Code session has expired. Please ask Admin to refresh the QR code.' };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Malformed payload' };
  }
}

// ==============================================================================
// 3. ADMIN SESSION MANAGEMENT WITH INACTIVITY TIMEOUT
// ==============================================================================
export interface SessionData {
  userId: string;
  username: string;
  role: 'OWNER' | 'ADMIN' | 'OPERATOR';
  loginTime: number;
  lastActiveTime: number;
}

export function generateSessionToken(user: { id: string; username: string; role: 'OWNER' | 'ADMIN' | 'OPERATOR' }): string {
  const session: SessionData = {
    userId: user.id,
    username: user.username,
    role: user.role,
    loginTime: Date.now(),
    lastActiveTime: Date.now(),
  };

  const serialized = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(serialized).digest('base64url');
  return `${serialized}.${signature}`;
}

export function verifySessionToken(token: string, maxInactivityMinutes = 15): { valid: boolean; session?: SessionData; reason?: string } {
  if (!token || !token.includes('.')) {
    return { valid: false, reason: 'No session token provided' };
  }

  const [payloadBase64, sig] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(payloadBase64).digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return { valid: false, reason: 'Invalid session signature' };
  }

  try {
    const session: SessionData = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
    const now = Date.now();
    const timeoutMs = maxInactivityMinutes * 60 * 1000;

    if (now - session.lastActiveTime > timeoutMs) {
      return { valid: false, reason: 'Session timed out due to 15 minutes of inactivity' };
    }

    return { valid: true, session };
  } catch {
    return { valid: false, reason: 'Invalid session payload' };
  }
}
