'use client';
import { useAuthStore } from '@/lib/store';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Welcome back, {user?.fullName}. Here is your trading overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Balance', value: '$0.00', change: null, icon: '💰', note: 'Connect a broker account to see balance' },
          { label: 'Bot Status', value: 'Inactive', change: null, icon: '🤖', note: 'Subscribe to activate' },
          { label: 'Total P&L', value: '$0.00', change: null, icon: '📈', note: 'Start trading to track P&L' },
          { label: 'Subscription', value: 'Free', change: null, icon: '⭐', note: 'Upgrade to start bot' },
        ].map((stat, i) => (
          <div key={i} className="stat-card animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</span>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <div className="text-2xl font-bold font-display text-white mb-1">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.note}</div>
          </div>
        ))}
      </div>

      {/* Getting Started */}
      <div className="glass-card p-8">
        <h2 className="font-display text-lg font-bold text-white mb-6">Get Started with AETHER</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Subscribe to a Plan', desc: 'Choose Starter, Pro, or Enterprise to unlock bot access.', href: '/billing', action: 'View Plans', done: false },
            { step: '2', title: 'Connect Your MT5 Account', desc: 'Link your broker account with MT5 login credentials.', href: '/accounts', action: 'Connect Broker', done: false },
            { step: '3', title: 'Start the AI Bot', desc: 'Select a strategy, configure risk, and hit Start.', href: '/bot', action: 'Configure Bot', done: false },
          ].map((item, i) => (
            <div key={i} className="relative p-6 rounded-xl border border-white/5 bg-white/[0.01]">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold mb-4 ${item.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                {item.done ? '✓' : item.step}
              </div>
              <h3 className="font-display text-sm font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">{item.desc}</p>
              <a href={item.href} className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                {item.action} →
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-8">
        <h2 className="font-display text-lg font-bold text-white mb-4">Recent Activity</h2>
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <p className="text-slate-500 text-sm">No activity yet. Connect a broker account and start your bot to see trades here.</p>
        </div>
      </div>
    </div>
  );
}
