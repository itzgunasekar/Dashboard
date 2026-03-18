'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const PLANS = [
  { key: 'STARTER', name: 'Starter', price: 29, features: ['1 Bot Instance', '1 Broker Account', 'Basic Analytics', 'Email Support', '25% Profit Commission'] },
  { key: 'PRO', name: 'Pro', price: 79, popular: true, features: ['3 Bot Instances', '3 Broker Accounts', 'Advanced Analytics', 'Priority Support', '20% Profit Commission', 'Custom Risk Settings'] },
  { key: 'ENTERPRISE', name: 'Enterprise', price: 199, features: ['Unlimited Bots', 'Unlimited Accounts', 'Full Analytics Suite', '24/7 Dedicated Support', '15% Profit Commission', 'Custom Strategies', 'API Access'] },
];

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    api.getSubscription().then(setSubscription).catch(() => {});
    api.getInvoices().then((r) => setInvoices(r.invoices || [])).catch(() => {});
  }, []);

  async function handleSubscribe(plan: string) {
    setLoading(plan);
    try {
      const res = await api.createCheckout(plan);
      window.location.href = res.url; // Redirect to Stripe Checkout
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Billing & Subscription</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your subscription plan and payment methods.</p>
      </div>

      {/* Current Plan */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current Plan</div>
            <div className="text-xl font-bold font-display text-white">{subscription?.plan || 'Free'}</div>
            <div className="text-sm text-slate-400 mt-1">
              {subscription?.status === 'ACTIVE' ? `Active since ${new Date(subscription.startDate).toLocaleDateString()}` : 'Upgrade to access AI trading bots'}
            </div>
          </div>
          <span className={`badge ${subscription?.status === 'ACTIVE' ? 'badge-success' : 'badge-info'}`}>
            {subscription?.status === 'ACTIVE' ? subscription.plan : 'Free Tier'}
          </span>
        </div>
      </div>

      {/* Plan Selection */}
      <div className="grid md:grid-cols-3 gap-5">
        {PLANS.map((plan) => (
          <div key={plan.key} className={`glass-card p-7 relative ${plan.popular ? 'border-cyan-500/30 glow-cyan' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-xs font-bold text-white">
                RECOMMENDED
              </div>
            )}
            <h3 className="font-display text-xl font-bold text-white mb-1">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-3xl font-bold font-display text-white">${plan.price}</span>
              <span className="text-slate-500 text-sm">/month</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {plan.features.map((f, j) => (
                <li key={j} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={() => handleSubscribe(plan.key)} disabled={loading === plan.key}
              className={plan.popular ? 'btn-primary w-full' : 'btn-secondary w-full'}>
              {loading === plan.key ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>

      {/* Commission Info */}
      <div className="glass-card p-6">
        <h2 className="font-display text-lg font-semibold text-white mb-3">Profit Commission</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          AETHER charges a percentage of your trading profits as a performance fee. This is only charged when the bot generates profit — if there is no profit, there is no commission. The rate depends on your plan: Starter (25%), Pro (20%), Enterprise (15%). Commissions are calculated on closed profitable trades and billed monthly via your payment method on file.
        </p>
      </div>

      {/* Payment History */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="font-display text-lg font-semibold text-white">Payment History</h2>
        </div>
        {invoices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">No payments yet.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id}>
                  <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td>{inv.description || 'Subscription'}</td>
                  <td className="font-mono">${(inv.amount / 100).toFixed(2)}</td>
                  <td><span className={`badge ${inv.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>{inv.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
