import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/security/jwt';
import { botManager } from '@/lib/bot/bot-manager';
import { z } from 'zod';

const schema = z.object({ brokerAccountId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const result = await botManager.stopBot(user.id, parsed.data.brokerAccountId);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
