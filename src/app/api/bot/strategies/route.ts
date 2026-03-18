export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/security/jwt';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const strategies = await prisma.botStrategy.findMany({
    where: { isActive: true },
    select: {
      id: true, name: true, description: true, type: true,
      riskLevel: true, maxDrawdown: true, defaultLotSize: true,
      symbols: true, timeframes: true, totalPnl: true,
      winRate: true, totalTrades: true, monthlyReturn: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ strategies });
}
