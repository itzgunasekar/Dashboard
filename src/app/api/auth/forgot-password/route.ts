export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateToken } from '@/lib/security/encryption';
import { sendPasswordResetEmail } from '@/lib/email/mailer';
import { checkRateLimit, AUTH_RATE_LIMIT } from '@/lib/security/rate-limiter';
import { z } from 'zod';

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const { allowed } = checkRateLimit(`forgot:${ip}`, { windowMs: 3600000, maxRequests: 5 });
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });

  // Always return success (prevent email enumeration)
  if (user) {
    const token = generateToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour
      },
    });
    await sendPasswordResetEmail(user.email, token);
  }

  return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
}
