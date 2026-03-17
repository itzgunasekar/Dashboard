'use client';

export default function CommissionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Commissions</h1>
        <p className="text-slate-400 text-sm mt-1">Track and collect profit commissions from users. All amounts in USD.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="text-xs text-slate-500 mb-1">Total Earned (All Time)</div>
          <div className="text-2xl font-bold font-display text-emerald-400">$0.00</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-slate-500 mb-1">Pending Collection</div>
          <div className="text-2xl font-bold font-display text-amber-400">$0.00</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-slate-500 mb-1">This Month</div>
          <div className="text-2xl font-bold font-display text-white">$0.00</div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="font-display text-lg font-semibold text-white">Commission Breakdown by User</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>User</th><th>Plan</th><th>Rate</th><th>Total P&L</th><th>Commission Owed</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr><td colSpan={7} className="text-center py-12 text-slate-500">No commission data yet.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
