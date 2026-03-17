'use client';

export default function SystemPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">System Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure platform-wide settings, API keys, and integrations.</p>
      </div>

      {/* MetaApi Config */}
      <div className="glass-card p-8 space-y-5">
        <h2 className="font-display text-lg font-semibold text-white">MetaApi Configuration</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">MetaApi Token</label>
            <input type="password" placeholder="••••••••••••••••" className="input-glass font-mono" disabled />
            <p className="text-xs text-slate-500 mt-1">Set via METAAPI_TOKEN environment variable</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Master Bot Account ID</label>
            <input type="text" placeholder="Provider account ID" className="input-glass font-mono" disabled />
            <p className="text-xs text-slate-500 mt-1">The MT5 account running the master strategy</p>
          </div>
        </div>
      </div>

      {/* Stripe Config */}
      <div className="glass-card p-8 space-y-5">
        <h2 className="font-display text-lg font-semibold text-white">Stripe Configuration</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Stripe Mode</label>
            <div className="badge badge-warning">Configure via environment variables</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Webhook Status</label>
            <div className="badge badge-info">Endpoint: /api/payments/webhook</div>
          </div>
        </div>
      </div>

      {/* IB Settings */}
      <div className="glass-card p-8 space-y-5">
        <h2 className="font-display text-lg font-semibold text-white">IB Partner Settings</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">IB Referral Code</label>
            <input type="text" placeholder="AETHER-IB-001" className="input-glass font-mono" disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Account Opening URL</label>
            <input type="text" placeholder="https://broker.com/open?ref=..." className="input-glass font-mono" disabled />
          </div>
        </div>
      </div>

      {/* Commission Settings */}
      <div className="glass-card p-8 space-y-5">
        <h2 className="font-display text-lg font-semibold text-white">Commission Configuration</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { plan: 'Starter', rate: '25%' },
            { plan: 'Pro', rate: '20%' },
            { plan: 'Enterprise', rate: '15%' },
          ].map((c, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="text-sm font-medium text-white mb-1">{c.plan} Plan</div>
              <div className="text-2xl font-bold font-display text-cyan-400">{c.rate}</div>
              <div className="text-xs text-slate-500">of trading profit</div>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
          <p className="text-xs text-amber-400">Commission rates are set in the bot-manager.ts configuration. Auto-disable threshold: $50 unpaid commission.</p>
        </div>
      </div>

      {/* Security */}
      <div className="glass-card p-8">
        <h2 className="font-display text-lg font-semibold text-white mb-4">Security Status</h2>
        <div className="space-y-3">
          {[
            { label: 'AES-256-GCM Encryption', status: true },
            { label: 'PBKDF2 Password Hashing (100K iterations)', status: true },
            { label: 'JWT Token Authentication', status: true },
            { label: 'Rate Limiting (Auth: 10/15min, API: 60/min)', status: true },
            { label: 'CSRF Protection', status: true },
            { label: 'Security Headers (CSP, X-Frame, etc.)', status: true },
            { label: '2FA Support (TOTP)', status: true },
            { label: 'Audit Logging', status: true },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${s.status ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className="text-sm text-slate-300">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
