export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/security/jwt';
import { createCheckoutSession } from '@/lib/payments/stripe-client';
import { z } from 'zod';

const schema = z.object({
  plan: z.enum(['STARTER', 'PRO', 'ENTERPRISE']),
});

export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const url = await createCheckoutSession({
      userId: user.id,
      email: user.email,
      name: user.fullName,
      plan: parsed.data.plan,
      successUrl: `${appUrl}/dashboard/billing?success=true`,
      cancelUrl: `${appUrl}/dashboard/billing?canceled=true`,
    });

    return NextResponse.json({ url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
