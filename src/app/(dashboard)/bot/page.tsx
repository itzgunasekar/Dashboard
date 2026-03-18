'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const STRATEGIES = [
  { id: 'scalping-ai', name: 'AI Scalper', type: 'SCALPING', risk: 'MEDIUM', pairs: ['EURUSD', 'GBPUSD', 'USDJPY'], tf: 'M5-M15', desc: 'High-frequency scalping using AI pattern recognition. Targets 5-15 pip moves with tight stop losses.', winRate: 0, monthlyReturn: 0 },
  { id: 'trend-rider', name: 'Trend Rider', type: 'TREND_FOLLOWING', risk: 'LOW', pairs: ['EURUSD', 'GBPUSD', 'AUDUSD', 'USDCHF'], tf: 'H1-H4', desc: 'Follows major trends with dynamic trailing stops. Lower frequency, higher R:R ratio.', winRate: 0, monthlyReturn: 0 },
  { id: 'grid-master', name: 'Grid Master', type: 'GRID', risk: 'HIGH', pairs: ['EURUSD', 'USDJPY'], tf: 'M15-H1', desc: 'Grid-based strategy for ranging markets. Higher risk but consistent returns in sideways conditions.', winRate: 0, monthlyReturn: 0 },
];

export default function BotPage() {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [lotMultiplier, setLotMultiplier] = useState(1.0);
  const [maxRisk, setMaxRisk] = useState(2.0);
  const [botRunning, setBotRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [brokerAccounts, setBrokerAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');

  useEffect(() => {
    api.getBrokerAccounts().then((r) => {
      const accts = r.accounts || [];
      setBrokerAccounts(accts);
      if (accts.length > 0) setSelectedAccount(accts[0].id);
    }).catch(() => {});
    api.getBotInstances().then((r) => {
      const instances = r.instances || [];
      if (instances.some((i: any) => i.status === 'RUNNING')) setBotRunning(true);
    }).catch(() => {});
  }, []);

  async function handleStartBot() {
    if (!selectedStrategy) return setError('Select a strategy first');
    setLoading(true);
    setError('');
    try {
      if (!selectedAccount) return setError('Connect a broker account first');
      const res = await api.startBot({
        brokerAccountId: selectedAccount,
        strategyId: selectedStrategy,
        lotMultiplier,
        maxRiskPercent: maxRisk,
      });
      if (res.success) setBotRunning(true);
      else setError(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStopBot() {
    setLoading(true);
    try {
      await api.stopBot(selectedAccount);
      setBotRunning(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">AI Trading Bot</h1>
        <p className="text-slate-400 text-sm mt-1">Select a strategy, configure risk parameters, and start automated trading.</p>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      {/* Bot Status */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${botRunning ? 'bg-emerald-500/10' : 'bg-slate-800/50'}`}>
              <span className="text-2xl">{botRunning ? '🟢' : '⚫'}</span>
            </div>
            <div>
              <div className="text-lg font-semibold text-white">Bot Status: {botRunning ? 'Running' : 'Stopped'}</div>
              <div className="text-sm text-slate-400">{botRunning ? 'AI bot is actively trading on your account' : 'Start the bot to begin automated trading'}</div>
            </div>
          </div>
          {botRunning && <div className="pulse-dot" />}
        </div>
      </div>

      {/* Strategies */}
      <div>
        <h2 className="font-display text-lg font-semibold text-white mb-4">Select Strategy</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {STRATEGIES.map((s) => (
            <button key={s.id} onClick={() => setSelectedStrategy(s.id)}
              className={`glass-card p-6 text-left transition-all ${selectedStrategy === s.id ? 'border-cyan-500/30 glow-cyan' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="badge badge-info">{s.type.replace('_', ' ')}</span>
                <span className={`badge ${s.risk === 'LOW' ? 'badge-success' : s.risk === 'HIGH' ? 'badge-danger' : 'badge-warning'}`}>{s.risk}</span>
              </div>
              <h3 className="font-display text-base font-semibold text-white mb-2">{s.name}</h3>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">{s.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {s.pairs.map((p) => <span key={p} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 font-mono">{p}</span>)}
              </div>
              <div className="text-[10px] text-slate-500 mt-2">Timeframe: {s.tf}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Broker Account Selection */}
      <div className="glass-card p-6">
        <h2 className="font-display text-lg font-semibold text-white mb-4">Trading Account</h2>
        {brokerAccounts.length === 0 ? (
          <div className="text-sm text-slate-400">
            No broker accounts connected. <a href="/accounts" className="text-cyan-400 hover:text-cyan-300">Connect one first →</a>
          </div>
        ) : (
          <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className="input-glass max-w-md">
            {brokerAccounts.map((a: any) => (
              <option key={a.id} value={a.id}>{a.broker} — {a.mt5Login} ({a.accountType})</option>
            ))}
          </select>
        )}
      </div>

      {/* Risk Configuration */}
      <div className="glass-card p-6">
        <h2 className="font-display text-lg font-semibold text-white mb-4">Risk Configuration</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Lot Multiplier: {lotMultiplier}x</label>
            <input type="range" min="0.1" max="5" step="0.1" value={lotMultiplier}
              onChange={(e) => setLotMultiplier(parseFloat(e.target.value))}
              className="w-full accent-cyan-500" />
            <div className="flex justify-between text-xs text-slate-500 mt-1"><span>0.1x (Conservative)</span><span>5x (Aggressive)</span></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Max Risk Per Trade: {maxRisk}%</label>
            <input type="range" min="0.5" max="10" step="0.5" value={maxRisk}
              onChange={(e) => setMaxRisk(parseFloat(e.target.value))}
              className="w-full accent-cyan-500" />
            <div className="flex justify-between text-xs text-slate-500 mt-1"><span>0.5% (Safe)</span><span>10% (High Risk)</span></div>
          </div>
        </div>
      </div>

      {/* Start/Stop */}
      <div className="flex gap-4">
        {!botRunning ? (
          <button onClick={handleStartBot} disabled={loading || !selectedStrategy} className="btn-primary !py-3.5 !px-10">
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '▶ Start Bot'}
          </button>
        ) : (
          <button onClick={handleStopBot} disabled={loading} className="btn-danger !py-3.5 !px-10">
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '⏹ Stop Bot'}
          </button>
        )}
      </div>
    </div>
  );
}
