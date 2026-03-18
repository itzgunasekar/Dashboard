export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/security/jwt';
import { metaApiClient } from '@/lib/broker/metaapi-client';
import { encrypt } from '@/lib/security/encryption';
import { z } from 'zod';

const connectSchema = z.object({
  broker: z.string().min(1),
  mt5Login: z.string().min(1),
  mt5Password: z.string().min(1),
  mt5Server: z.string().min(1),
  accountType: z.enum(['DEMO', 'LIVE']).default('LIVE'),
});

export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = connectSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const { broker, mt5Login, mt5Password, mt5Server, accountType } = parsed.data;

  // Check subscription limits
  const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
  const existingAccounts = await prisma.brokerAccount.count({ where: { userId: user.id } });
  const limits: Record<string, number> = { FREE: 0, STARTER: 1, PRO: 3, ENTERPRISE: 99 };
  const limit = limits[sub?.plan || 'FREE'] || 0;

  if (existingAccounts >= limit) {
    return NextResponse.json({ error: `Your plan allows ${limit} broker accounts` }, { status: 403 });
  }

  // Check for duplicate
  const dup = await prisma.brokerAccount.findFirst({
    where: { mt5Login, mt5Server },
  });
  if (dup) return NextResponse.json({ error: 'This MT5 account is already connected' }, { status: 409 });

  try {
    // Connect to MetaApi Cloud
    const metaApiAccountId = await metaApiClient.connectAccount({
      login: mt5Login,
      password: mt5Password,
      serverName: mt5Server,
      platform: 'mt5',
    });

    // Get account info
    const accountInfo = await metaApiClient.getAccountInfo(metaApiAccountId);

    // Store broker account (password encrypted)
    const brokerAccount = await prisma.brokerAccount.create({
      data: {
        userId: user.id,
        broker,
        mt5Login,
        mt5Server,
        metaApiAccountId,
        accountType: accountType as any,
        balance: accountInfo.balance,
        equity: accountInfo.equity,
        leverage: accountInfo.leverage,
        currency: accountInfo.currency,
        status: 'CONNECTED',
        ibReferralCode: process.env.IB_REFERRAL_CODE,
        connectedAt: new Date(),
        lastSyncAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'BROKER_CONNECTED',
        resource: 'BrokerAccount',
        resourceId: brokerAccount.id,
        details: { broker, mt5Login, mt5Server },
      },
    });

    return NextResponse.json({
      message: 'Broker account connected successfully',
      account: {
        id: brokerAccount.id,
        broker,
        mt5Login,
        balance: accountInfo.balance,
        equity: accountInfo.equity,
        currency: accountInfo.currency,
        status: 'CONNECTED',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: `Connection failed: ${error.message}` }, { status: 500 });
  }
}
