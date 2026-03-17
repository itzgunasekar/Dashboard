'use client';

export default function RevenuePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Revenue Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Track all revenue streams: subscriptions, commissions, and IB rebates.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: 'Subscription Revenue', value: '$0.00', icon: '💳' },
          { label: 'Bot Commissions', value: '$0.00', icon: '🤖' },
          { label: 'IB Rebates', value: '$0.00', icon: '🤝' },
          { label: 'Total Revenue', value: '$0.00', icon: '💰' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500">{s.label}</span>
              <span className="text-xl">{s.icon}</span>
            </div>
            <div className="text-2xl font-bold font-display text-white">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="glass-card p-8">
        <h2 className="font-display text-lg font-semibold text-white mb-4">Revenue Breakdown</h2>
        <p className="text-sm text-slate-400">Revenue charts will populate as users subscribe and the bot generates profits. All revenue is tracked in real-time via Stripe and the MetaApi trade history.</p>
        <div className="mt-6 p-12 rounded-xl bg-white/[0.01] border border-white/5 text-center">
          <p className="text-slate-600 text-sm">Charts will appear once revenue data is available</p>
        </div>
      </div>

      {/* Transaction Log */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="font-display text-lg font-semibold text-white">Transaction Log</h2>
        </div>
        <table className="data-table">
          <thead><tr><th>Date</th><th>Type</th><th>User</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td colSpan={5} className="text-center py-12 text-slate-500">No transactions yet.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
