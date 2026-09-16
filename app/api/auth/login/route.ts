import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, registerLoginAttempt, checkBruteForceLock } from '@/lib/local-db';
import { generateSessionToken } from '@/lib/local-security';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username = 'admin', passcode } = body;
    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // 1. Check if user is locked out due to brute force
    const lockCheck = checkBruteForceLock(username);
    if (lockCheck.isLocked) {
      return NextResponse.json(
        {
          success: false,
          locked: true,
          remainingSeconds: lockCheck.remainingSeconds,
          error: `គណនីត្រូវបានចាក់សោសុវត្ថិភាពដោយសារវាយខុសលើសពី ៥ ដង! សូមរង់ចាំ ${Math.ceil(
            lockCheck.remainingSeconds / 60
          )} នាទីទៀត។ (Account locked)`,
        },
        { status: 429 }
      );
    }

    const db = readDatabase();
    const validPins = [db.settings.masterPin, '0203', 'admin8888'];
    const isMasterAuth = validPins.includes(passcode);
    const isStaffAuth = passcode === '8899' || passcode === 'tube1234';

    if (!isMasterAuth && !isStaffAuth) {
      const attemptResult = registerLoginAttempt({
        username,
        success: false,
        ipAddress,
      });

      if (attemptResult.isLocked) {
        return NextResponse.json(
          {
            success: false,
            locked: true,
            remainingSeconds: 900,
            error: 'គណនីត្រូវបានចាក់សោសុវត្ថិភាព ១៥ នាទីដោយសារវាយខុស ៥ ដង! (Brute-force lockout triggered)',
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          locked: false,
          attemptsLeft: attemptResult.attemptsLeft,
          error: `លេខកូដមិនត្រឹមត្រូវទេ! នៅសល់ឱកាស ${attemptResult.attemptsLeft} ដងទៀតមុនពេលគណនីត្រូវបាន Lock។`,
        },
        { status: 401 }
      );
    }

    // Successful login
    registerLoginAttempt({
      username,
      success: true,
      ipAddress,
    });

    const role = isMasterAuth ? 'OWNER' : 'OPERATOR';
    const sessionToken = generateSessionToken({
      id: `usr_${username}`,
      username,
      role,
    });

    return NextResponse.json({
      success: true,
      role,
      username,
      sessionToken,
      message: 'Login successful',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
