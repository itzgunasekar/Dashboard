export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/security/jwt';
import { botManager } from '@/lib/bot/bot-manager';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  action: z.enum(['disable', 'enable']),
  brokerAccountId: z.string().min(1),
  reason: z.string().optional(),
});

/** Admin: Enable/Disable user bots */
export async function POST(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { action, brokerAccountId, reason } = parsed.data;

  if (action === 'disable') {
    await botManager.adminDisableBot(brokerAccountId, reason || 'Admin action');
  } else {
    await botManager.adminEnableBot(brokerAccountId);
  }

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: `ADMIN_BOT_${action.toUpperCase()}`,
      resource: 'BotInstance',
      resourceId: brokerAccountId,
      details: { reason },
    },
  });

  return NextResponse.json({ message: `Bot ${action}d successfully` });
}

/** Admin: Get all bot instances */
export async function GET(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const instances = await prisma.botInstance.findMany({
    include: {
      user: { select: { id: true, email: true, fullName: true } },
      brokerAccount: { select: { broker: true, mt5Login: true, balance: true, equity: true } },
      strategy: { select: { name: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ instances });
}
