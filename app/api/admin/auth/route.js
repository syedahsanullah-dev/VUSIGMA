import { NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/auth';

const ADMIN_JWT_EXPIRES_IN = '15m';
const MAX_FAILED_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// In-memory rate limiting map for failed login attempts
const failedAttemptsMap = new Map();

function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}

function cleanExpiredRateLimitEntries() {
  const now = Date.now();
  for (const [ip, data] of failedAttemptsMap.entries()) {
    if (now - data.firstAttemptTime > RATE_LIMIT_WINDOW_MS) {
      failedAttemptsMap.delete(ip);
    }
  }
}

// Constant-time string comparison using SHA-256 and timingSafeEqual
function constantTimeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export async function POST(request) {
  try {
    cleanExpiredRateLimitEntries();
    const clientIP = getClientIP(request);
    const now = Date.now();

    // Check rate limit status for this IP
    const rateData = failedAttemptsMap.get(clientIP) || { count: 0, firstAttemptTime: now };
    if (rateData.count >= MAX_FAILED_ATTEMPTS) {
      const timeRemainingMs = RATE_LIMIT_WINDOW_MS - (now - rateData.firstAttemptTime);
      if (timeRemainingMs > 0) {
        const minutesLeft = Math.ceil(timeRemainingMs / 60000);
        return NextResponse.json(
          { error: `Too many failed login attempts. Please try again in ${minutesLeft} minute(s).` },
          { status: 429 }
        );
      } else {
        // Reset window
        failedAttemptsMap.delete(clientIP);
      }
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const expectedEmail = process.env.ADMIN_EMAIL;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    const isEmailMatch = constantTimeCompare(email.trim().toLowerCase(), expectedEmail.trim().toLowerCase());
    const isPasswordMatch = constantTimeCompare(password, expectedPassword);

    if (!isEmailMatch || !isPasswordMatch) {
      // Record failed attempt
      const updatedCount = (failedAttemptsMap.get(clientIP)?.count || 0) + 1;
      failedAttemptsMap.set(clientIP, {
        count: updatedCount,
        firstAttemptTime: failedAttemptsMap.get(clientIP)?.firstAttemptTime || now
      });

      return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
    }

    // Reset rate limit count on successful login
    failedAttemptsMap.delete(clientIP);

    const adminUser = {
      id: 'super_admin',
      name: 'Super Admin',
      email: expectedEmail.trim().toLowerCase(),
      role: 'SUPER_ADMIN'
    };

    // Issue 15-minute JWT Token
    const token = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role },
      JWT_SECRET,
      { expiresIn: ADMIN_JWT_EXPIRES_IN }
    );

    const isProduction = process.env.NODE_ENV === 'production';

    const response = NextResponse.json({ user: adminUser, token });

    // Set 15-minute httpOnly cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 900 // 15 minutes in seconds
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal admin authentication error.' }, { status: 500 });
  }
}
