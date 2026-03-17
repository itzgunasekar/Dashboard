'use client';

export default function TradingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Trade History</h1>
        <p className="text-slate-400 text-sm mt-1">View all trades executed by the AI bot on your accounts.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {['All', 'Open', 'Closed', 'Profitable', 'Loss'].map(f => (
          <button key={f} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${f === 'All' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-white/3 border border-white/5 text-slate-400 hover:text-white'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Trades Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Direction</th>
                <th>Lot Size</th>
                <th>Open Price</th>
                <th>Close Price</th>
                <th>P&L (USD)</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4 text-2xl">📊</div>
                  <p className="text-slate-500 text-sm">No trades yet. Start the AI bot to begin trading.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
