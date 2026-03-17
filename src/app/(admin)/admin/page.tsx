'use client';

export default function AdminOverview() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Admin Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Platform-wide metrics and control panel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: '0', icon: '👥', color: 'cyan' },
          { label: 'Active Bots', value: '0', icon: '🤖', color: 'emerald' },
          { label: 'Total Revenue', value: '$0.00', icon: '💰', color: 'amber' },
          { label: 'Pending Commission', value: '$0.00', icon: '📊', color: 'violet' },
        ].map((s, i) => (
          <div key={i} className="stat-card animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{s.label}</span>
              <span className="text-xl">{s.icon}</span>
            </div>
            <div className="text-2xl font-bold font-display text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-8">
        <h2 className="font-display text-lg font-semibold text-white mb-6">Quick Actions</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: 'Manage Users', href: '/admin/users', icon: '👥' },
            { label: 'Bot Control', href: '/admin/bot-management', icon: '🤖' },
            { label: 'Collect Commission', href: '/admin/commissions', icon: '💳' },
            { label: 'System Settings', href: '/admin/system', icon: '⚙️' },
          ].map((a, i) => (
            <a key={i} href={a.href} className="p-5 rounded-xl border border-white/5 hover:border-cyan-500/20 hover:bg-cyan-500/5 transition-all text-center">
              <div className="text-3xl mb-2">{a.icon}</div>
              <div className="text-sm font-medium text-slate-300">{a.label}</div>
            </a>
          ))}
        </div>
      </div>

      {/* IB Commission Tracking */}
      <div className="glass-card p-8">
        <h2 className="font-display text-lg font-semibold text-white mb-3">IB Commission Summary</h2>
        <p className="text-sm text-slate-400 mb-4">Track commissions earned from accounts opened through your IB referral link.</p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="text-xs text-slate-500 mb-1">Accounts Opened via IB</div>
            <div className="text-xl font-bold font-display text-white">0</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="text-xs text-slate-500 mb-1">IB Rebate Earned</div>
            <div className="text-xl font-bold font-display text-emerald-400">$0.00</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="text-xs text-slate-500 mb-1">Bot Profit Commission</div>
            <div className="text-xl font-bold font-display text-emerald-400">$0.00</div>
          </div>
        </div>
      </div>
    </div>
  );
}
