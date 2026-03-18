export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/security/encryption';
import { generateAccessToken, generateRefreshToken } from '@/lib/security/jwt';
import { checkRateLimit, AUTH_RATE_LIMIT } from '@/lib/security/rate-limiter';
import { z } from 'zod';
import speakeasy from 'speakeasy';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFactorCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = checkRateLimit(`login:${ip}`, AUTH_RATE_LIMIT);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    const { email, password, twoFactorCode } = parsed.data;

    // Find user
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check status
    if (user.status === 'BANNED') {
      return NextResponse.json({ error: 'Account has been suspended' }, { status: 403 });
    }

    // Verify password
    if (!verifyPassword(password, user.passwordHash)) {
      await prisma.auditLog.create({
        data: { userId: user.id, action: 'LOGIN_FAILED', resource: 'User', ipAddress: ip },
      });
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check 2FA
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!twoFactorCode) {
        return NextResponse.json({ requiresTwoFactor: true }, { status: 200 });
      }
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 1,
      });
      if (!verified) {
        return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 });
      }
    }

    // Check email verification
    if (user.status === 'PENDING_VERIFICATION') {
      return NextResponse.json({ error: 'Please verify your email first' }, { status: 403 });
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: require('crypto').randomBytes(32).toString('hex'),
        refreshToken: require('crypto').randomBytes(32).toString('hex'),
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') || '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Generate tokens
    const payload = { userId: user.id, email: user.email, role: user.role, sessionId: session.id };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN_SUCCESS', resource: 'User', ipAddress: ip },
    });

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
