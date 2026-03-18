export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/security/encryption';
import { checkRateLimit, AUTH_RATE_LIMIT } from '@/lib/security/rate-limiter';
import { sendVerificationEmail } from '@/lib/email/mailer';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters').regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    'Must include uppercase, lowercase, number, and special character'
  ),
  fullName: z.string().min(2, 'Name required'),
  phone: z.string().optional(),
  referralCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = checkRateLimit(`register:${ip}`, AUTH_RATE_LIMIT);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, password, fullName, phone, referralCode } = parsed.data;

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Verify referral code if provided
    let referredBy: string | undefined;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } });
      if (referrer) referredBy = referrer.id;
    }

    // Create user
    const passwordHash = hashPassword(password);
    const emailVerifyToken = generateToken();
    const userReferralCode = generateToken(8);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        phone,
        status: 'PENDING_VERIFICATION',
        emailVerifyToken,
        referralCode: userReferralCode,
        referredBy,
      },
    });

    // Create free subscription
    await prisma.subscription.create({
      data: { userId: user.id, plan: 'FREE', status: 'INACTIVE' },
    });

    // Send verification email
    await sendVerificationEmail(email, emailVerifyToken);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        resource: 'User',
        resourceId: user.id,
        ipAddress: ip,
      },
    });

    return NextResponse.json({
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
