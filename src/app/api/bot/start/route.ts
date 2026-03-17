import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/security/jwt';
import { botManager } from '@/lib/bot/bot-manager';
import { z } from 'zod';

const schema = z.object({
  brokerAccountId: z.string().min(1),
  strategyId: z.string().min(1),
  lotMultiplier: z.number().min(0.01).max(10).optional(),
  maxRiskPercent: z.number().min(0.1).max(10).optional(),
});

export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const result = await botManager.startBot({
    userId: user.id,
    brokerAccountId: parsed.data.brokerAccountId,
    strategyId: parsed.data.strategyId,
    lotMultiplier: parsed.data.lotMultiplier,
    maxRiskPercent: parsed.data.maxRiskPercent,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
