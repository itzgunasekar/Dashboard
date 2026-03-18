'use client';
import { useState } from 'react';

export default function BotManagementPage() {
  const [bots, setBots] = useState<any[]>([]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Bot Control</h1>
        <p className="text-slate-400 text-sm mt-1">Monitor and control all user bot instances. Enable/disable bots, manage commission compliance.</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Running', value: '0', colorClass: 'text-emerald-400' },
          { label: 'Stopped', value: '0', colorClass: 'text-slate-400' },
          { label: 'Disabled (Admin)', value: '0', colorClass: 'text-rose-400' },
          { label: 'Pending Commission', value: '0', colorClass: 'text-amber-400' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold font-display ${s.colorClass}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Bot Instances Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">All Bot Instances</h2>
          <button className="btn-secondary text-sm">Check Commission Compliance</button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Strategy</th>
                <th>Broker / Login</th>
                <th>Status</th>
                <th>Total P&L</th>
                <th>Commission Owed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bots.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">No bot instances yet. Users need to subscribe and start their bots.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commission Auto-Check Info */}
      <div className="glass-card p-6">
        <h3 className="font-display text-base font-semibold text-white mb-2">Automatic Commission Enforcement</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          The system automatically checks all running bot instances for unpaid commissions. If a user&apos;s outstanding commission exceeds $50, their bot is automatically disabled and they receive a notification. You can manually re-enable bots after commission is settled using the controls above, or run a manual compliance check.
        </p>
      </div>
    </div>
  );
}
