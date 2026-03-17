/**
 * AETHER - Stripe Payment Integration
 *
 * Handles:
 * - Subscription creation (Starter/Pro/Enterprise)
 * - Webhook processing (payment success/failure)
 * - Commission collection via Stripe Invoices
 * - Customer portal for billing management
 */

import Stripe from 'stripe';
import prisma from '@/lib/prisma';

// Lazy init to avoid build-time errors when env vars aren't set
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
    _stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' as any });
  }
  return _stripe;
}
const stripe = new Proxy({} as Stripe, {
  get(_, prop) { return (getStripe() as any)[prop]; }
});

// Plan pricing (USD/month)
export const PLAN_PRICES = {
  STARTER: { amount: 29, name: 'Starter', features: ['1 Bot Instance', '1 Broker Account', 'Basic Analytics', 'Email Support'] },
  PRO: { amount: 79, name: 'Pro', features: ['3 Bot Instances', '3 Broker Accounts', 'Advanced Analytics', 'Priority Support', 'Lower Commission'] },
  ENTERPRISE: { amount: 199, name: 'Enterprise', features: ['Unlimited Bots', 'Unlimited Accounts', 'Full Analytics', '24/7 Support', 'Lowest Commission', 'Custom Strategies'] },
} as const;

/** Create or get Stripe customer */
export async function getOrCreateCustomer(userId: string, email: string, name: string): Promise<string> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (sub?.stripeCustomerId) return sub.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });

  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, stripeCustomerId: customer.id },
    update: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/** Create checkout session for subscription */
export async function createCheckoutSession(params: {
  userId: string;
  email: string;
  name: string;
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const customerId = await getOrCreateCustomer(params.userId, params.email, params.name);

  const priceIdMap: Record<string, string> = {
    STARTER: process.env.STRIPE_STARTER_PRICE_ID || '',
    PRO: process.env.STRIPE_PRO_PRICE_ID || '',
    ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
  };

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceIdMap[params.plan], quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { userId: params.userId, plan: params.plan },
    subscription_data: {
      metadata: { userId: params.userId, plan: params.plan },
    },
    allow_promotion_codes: true,
  });

  return session.url!;
}

/** Create customer portal session (manage billing) */
export async function createPortalSession(customerId: string, returnUrl: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

/** Handle Stripe webhook events */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan as any;
      if (!userId) break;

      await prisma.subscription.update({
        where: { userId },
        data: {
          plan,
          status: 'ACTIVE',
          stripeSubId: session.subscription as string,
        },
      });

      await prisma.auditLog.create({
        data: { userId, action: 'SUBSCRIPTION_CREATED', resource: 'Subscription', details: { plan } },
      });
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.subscription as string;
      const sub = await prisma.subscription.findUnique({ where: { stripeSubId: subId } });
      if (!sub) break;

      await prisma.payment.create({
        data: {
          subscriptionId: sub.id,
          amount: (invoice.amount_paid || 0) / 100,
          currency: invoice.currency.toUpperCase(),
          status: 'SUCCEEDED',
          stripePaymentId: invoice.payment_intent as string,
          invoiceUrl: invoice.hosted_invoice_url || undefined,
          description: `Subscription payment - ${sub.plan}`,
        },
      });

      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: 'ACTIVE',
          currentPeriodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : undefined,
          currentPeriodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : undefined,
        },
      });
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.subscription as string;
      const sub = await prisma.subscription.findUnique({ where: { stripeSubId: subId } });
      if (!sub) break;

      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'PAST_DUE' },
      });

      await prisma.notification.create({
        data: {
          userId: sub.userId,
          type: 'SUBSCRIPTION',
          title: 'Payment Failed',
          message: 'Your subscription payment failed. Please update your payment method to continue using AETHER.',
        },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const sub = await prisma.subscription.findUnique({ where: { stripeSubId: subscription.id } });
      if (!sub) break;

      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'CANCELED', plan: 'FREE' },
      });
      break;
    }
  }
}

/** Charge commission as a one-time invoice item */
export async function chargeCommission(userId: string, amount: number, description: string): Promise<void> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.stripeCustomerId) throw new Error('No Stripe customer');

  await stripe.invoiceItems.create({
    customer: sub.stripeCustomerId,
    amount: Math.round(amount * 100), // cents
    currency: 'usd',
    description,
  });

  const invoice = await stripe.invoices.create({
    customer: sub.stripeCustomerId,
    auto_advance: true,
    collection_method: 'charge_automatically',
  });

  await stripe.invoices.finalizeInvoice(invoice.id);

  await prisma.transaction.create({
    data: {
      userId,
      type: 'COMMISSION_EARNED',
      amount,
      currency: 'USD',
      description,
      status: 'PENDING',
      reference: invoice.id,
    },
  });
}

export { stripe };
