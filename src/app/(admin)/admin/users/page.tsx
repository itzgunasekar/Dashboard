'use client';

export default function AdminUsersPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">View and manage all registered users.</p>
        </div>
        <div className="flex gap-3">
          <input type="text" placeholder="Search users..." className="input-glass max-w-[240px] !py-2.5 text-sm" />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Plan</th><th>Status</th><th>Broker Accounts</th><th>Bot Status</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr><td colSpan={8} className="text-center py-12 text-slate-500">No users yet. Users will appear here as they register.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
