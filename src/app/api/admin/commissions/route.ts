export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/security/jwt';
import { botManager } from '@/lib/bot/bot-manager';
import { chargeCommission } from '@/lib/payments/stripe-client';
import prisma from '@/lib/prisma';

/** GET: View all commission summaries */
export async function GET(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const instances = await prisma.botInstance.findMany({
    include: {
      user: { select: { id: true, email: true, fullName: true } },
      brokerAccount: { select: { broker: true, mt5Login: true } },
    },
  });

  const summaries = await Promise.all(
    instances.map(async (inst) => {
      const pnl = await botManager.calculateCommission(inst.id);
      return {
        userId: inst.userId,
        userEmail: inst.user.email,
        userName: inst.user.fullName,
        broker: inst.brokerAccount.broker,
        mt5Login: inst.brokerAccount.mt5Login,
        botStatus: inst.status,
        commissionRate: inst.commissionRate,
        ...pnl,
      };
    })
  );

  const totalCommission = summaries.reduce((s, i) => s + i.commissionOwed, 0);

  return NextResponse.json({ summaries, totalCommission });
}

/** POST: Charge commission to a user */
export async function POST(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { userId, amount, description } = await req.json();

  try {
    await chargeCommission(userId, amount, description || 'Trading bot profit commission');
    return NextResponse.json({ message: 'Commission charged successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
