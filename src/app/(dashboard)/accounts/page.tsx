'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const SUPPORTED_BROKERS = [
  { name: 'IC Markets', logo: '🏦', servers: ['ICMarketsSC-Demo', 'ICMarketsSC-Live01', 'ICMarketsSC-Live02', 'ICMarketsSC-Live03'] },
  { name: 'Exness', logo: '🏛️', servers: ['Exness-Real', 'Exness-Real2', 'Exness-Trial'] },
  { name: 'XM', logo: '💹', servers: ['XMGlobal-Real 1', 'XMGlobal-Real 2', 'XMGlobal-Demo 3'] },
  { name: 'Pepperstone', logo: '🔷', servers: ['Pepperstone-Demo', 'Pepperstone-Edge-Live01', 'Pepperstone-Edge-Live02'] },
  { name: 'FXTM', logo: '📊', servers: ['ForexTimeFXTM-Demo01', 'ForexTimeFXTM-Live01'] },
  { name: 'Other', logo: '🌐', servers: [] },
];

export default function AccountsPage() {
  const [showConnect, setShowConnect] = useState(false);
  const [form, setForm] = useState({ broker: '', mt5Login: '', mt5Password: '', mt5Server: '', accountType: 'LIVE' as const });
  const [customServer, setCustomServer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    api.getBrokerAccounts().then((r) => setAccounts(r.accounts || [])).catch(() => {});
  }, []);

  async function handleDisconnect(id: string) {
    if (!confirm('Are you sure you want to disconnect this account? Running bots will be stopped.')) return;
    try {
      await api.disconnectBroker(id);
      setAccounts(accounts.filter(a => a.id !== id));
      setSuccess('Account disconnected successfully');
    } catch (err: any) {
      setError(err.message);
    }
  }

  const selectedBroker = SUPPORTED_BROKERS.find(b => b.name === form.broker);
  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const server = form.mt5Server || customServer;
      if (!server) throw new Error('Select or enter a server');
      const res = await api.connectBroker({ ...form, mt5Server: server });
      setSuccess(res.message);
      setAccounts([...accounts, res.account]);
      setShowConnect(false);
      setForm({ broker: '', mt5Login: '', mt5Password: '', mt5Server: '', accountType: 'LIVE' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Broker Accounts</h1>
          <p className="text-slate-400 text-sm mt-1">Connect your MetaTrader 5 broker accounts to enable bot trading.</p>
        </div>
        <button onClick={() => setShowConnect(!showConnect)} className="btn-primary">
          + Connect Account
        </button>
      </div>

      {success && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{success}</div>}
      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      {/* IB Partner Banner */}
      <div className="glass-card p-6 border-cyan-500/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-2xl">🤝</div>
          <div className="flex-1">
            <h3 className="font-display text-sm font-semibold text-white">Open a New Trading Account via AETHER</h3>
            <p className="text-xs text-slate-400 mt-0.5">Get reduced spreads and commission rebates when you open through our IB partner link.</p>
          </div>
          <a href={process.env.NEXT_PUBLIC_IB_ACCOUNT_URL || '#'} target="_blank" rel="noopener" className="btn-secondary text-sm">
            Open Account →
          </a>
        </div>
      </div>

      {/* Connect Form */}
      {showConnect && (
        <form onSubmit={handleConnect} className="glass-card p-8 space-y-5 animate-fade-in-up">
          <h2 className="font-display text-lg font-semibold text-white">Connect MT5 Account</h2>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Broker</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {SUPPORTED_BROKERS.map((b) => (
                <button key={b.name} type="button" onClick={() => setForm({ ...form, broker: b.name, mt5Server: '' })}
                  className={`p-3 rounded-xl border text-center transition-all ${form.broker === b.name ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-white/5 hover:border-white/10'}`}>
                  <div className="text-2xl mb-1">{b.logo}</div>
                  <div className="text-xs text-slate-400">{b.name}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedBroker && selectedBroker.servers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Server</label>
              <select value={form.mt5Server} onChange={update('mt5Server')} className="input-glass">
                <option value="">Select server...</option>
                {selectedBroker.servers.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {(form.broker === 'Other' || (selectedBroker && selectedBroker.servers.length === 0)) && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Custom Server Name</label>
              <input type="text" value={customServer} onChange={(e) => setCustomServer(e.target.value)} className="input-glass" placeholder="e.g. BrokerName-Live01" />
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">MT5 Login (Account Number)</label>
              <input type="text" value={form.mt5Login} onChange={update('mt5Login')} className="input-glass font-mono" placeholder="e.g. 12345678" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">MT5 Password</label>
              <input type="password" value={form.mt5Password} onChange={update('mt5Password')} className="input-glass" placeholder="Your MT5 password" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Account Type</label>
            <div className="flex gap-3">
              {['LIVE', 'DEMO'].map(t => (
                <button key={t} type="button" onClick={() => setForm({ ...form, accountType: t as any })}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${form.accountType === t ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 border' : 'bg-white/3 border border-white/5 text-slate-400'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <p className="text-xs text-amber-400">🔒 Your credentials are encrypted with AES-256 and transmitted securely via MetaApi cloud. We never store raw passwords.</p>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Connect Account'}
            </button>
            <button type="button" onClick={() => setShowConnect(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {/* Connected Accounts */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="font-display text-lg font-semibold text-white">Connected Accounts</h2>
        </div>
        {accounts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4 text-2xl">🔗</div>
            <p className="text-slate-500 text-sm">No broker accounts connected yet.</p>
            <p className="text-slate-600 text-xs mt-1">Click &quot;Connect Account&quot; to link your MT5 account.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Broker</th><th>Login</th><th>Balance</th><th>Equity</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td className="font-medium text-white">{a.broker}</td>
                  <td className="font-mono">{a.mt5Login}</td>
                  <td className="font-mono">${a.balance?.toFixed(2)}</td>
                  <td className="font-mono">${a.equity?.toFixed(2)}</td>
                  <td><span className="badge badge-success">Connected</span></td>
                  <td><button onClick={() => handleDisconnect(a.id)} className="text-xs text-red-400 hover:text-red-300">Disconnect</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
