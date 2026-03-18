import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid token' }, { status: 400 });

  const user = await prisma.user.findFirst({
    where: { emailVerifyToken: parsed.data.token, emailVerified: false },
  });

  if (!user) return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyToken: null, status: 'ACTIVE' },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'EMAIL_VERIFIED', resource: 'User' },
  });

  return NextResponse.json({ message: 'Email verified successfully. You can now log in.' });
}
