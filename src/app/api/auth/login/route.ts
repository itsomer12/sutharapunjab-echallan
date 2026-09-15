import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/db';
import { signToken } from '@/lib/auth';

// In-memory rate limiting
type RateLimitInfo = { count: number; firstAttempt: number };
const rateLimitMap = new Map<string, RateLimitInfo>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const now = Date.now();
    
    // Check rate limit
    const rateInfo = rateLimitMap.get(ip);
    if (rateInfo) {
      if (now - rateInfo.firstAttempt < LOCKOUT_MS) {
        if (rateInfo.count >= MAX_ATTEMPTS) {
          return NextResponse.json(
            { success: false, error: 'Too many failed login attempts. Please try again later.' },
            { status: 429 }
          );
        }
      } else {
        // Reset after lockout period has passed
        rateLimitMap.delete(ip);
      }
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    // Look up user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      const updatedRateInfo = rateLimitMap.get(ip) ?? { count: 0, firstAttempt: now };
      updatedRateInfo.count += 1;
      rateLimitMap.set(ip, updatedRateInfo);
      
      return NextResponse.json(
        { success: false, error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    // Verify password with bcrypt
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      const updatedRateInfo = rateLimitMap.get(ip) ?? { count: 0, firstAttempt: now };
      updatedRateInfo.count += 1;
      rateLimitMap.set(ip, updatedRateInfo);
      
      return NextResponse.json(
        { success: false, error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    // Clear rate limit on successful authentication
    rateLimitMap.delete(ip);

    // Check ACTIVE status
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Your account is inactive. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // Sign JWT
    const token = signToken({ userId: user.id, role: user.role });

    // Set httpOnly cookie and return
    const response = NextResponse.json({
      success: true,
      role: user.role,
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
