import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/security/jwt';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
    select: {
      plan: true, status: true, currentPeriodStart: true,
      currentPeriodEnd: true, cancelAtPeriodEnd: true, trialEndsAt: true,
    },
  });

  return NextResponse.json({ subscription: subscription || { plan: 'FREE', status: 'INACTIVE' } });
}
