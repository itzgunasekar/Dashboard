export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stripe, handleWebhookEvent } from '@/lib/payments/stripe-client';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    await handleWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 });
  }
}

// In App Router, body parsing is not automatic for route handlers
// so no config needed - req.text() handles raw body already
