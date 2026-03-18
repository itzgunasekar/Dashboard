import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/security/jwt';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const instances = await prisma.botInstance.findMany({
    where: { userId: user.id },
    include: {
      strategy: { select: { name: true, type: true, riskLevel: true } },
      brokerAccount: { select: { broker: true, mt5Login: true, balance: true, equity: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ instances });
}
