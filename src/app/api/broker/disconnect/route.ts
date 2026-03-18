export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/security/jwt';
import { metaApiClient } from '@/lib/broker/metaapi-client';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({ id: z.string().min(1) });

export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const account = await prisma.brokerAccount.findFirst({
    where: { id: parsed.data.id, userId: user.id },
  });
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  // Check if bot is running
  const botInstance = await prisma.botInstance.findUnique({ where: { brokerAccountId: account.id } });
  if (botInstance?.status === 'RUNNING') {
    return NextResponse.json({ error: 'Stop the bot before disconnecting' }, { status: 400 });
  }

  // Remove from MetaApi
  if (account.metaApiAccountId) {
    try { await metaApiClient.removeAccount(account.metaApiAccountId); } catch (e) { /* log */ }
  }

  await prisma.brokerAccount.update({
    where: { id: account.id },
    data: { status: 'DISCONNECTED', metaApiAccountId: null },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'BROKER_DISCONNECTED', resource: 'BrokerAccount', resourceId: account.id },
  });

  return NextResponse.json({ message: 'Broker account disconnected' });
}
