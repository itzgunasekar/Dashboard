import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/security/jwt';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const accounts = await prisma.brokerAccount.findMany({
    where: { userId: user.id },
    select: {
      id: true, broker: true, mt5Login: true, mt5Server: true,
      accountType: true, balance: true, equity: true, leverage: true,
      currency: true, status: true, connectedAt: true, lastSyncAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ accounts });
}
