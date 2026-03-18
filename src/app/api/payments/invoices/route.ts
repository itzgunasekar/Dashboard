export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/security/jwt';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
  if (!sub) return NextResponse.json({ invoices: [] });

  const payments = await prisma.payment.findMany({
    where: { subscriptionId: sub.id },
    select: { id: true, amount: true, currency: true, status: true, invoiceUrl: true, description: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ invoices: payments });
}
