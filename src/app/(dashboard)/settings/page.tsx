'use client';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState('profile');
  const [qrCode, setQrCode] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [message, setMessage] = useState('');

  async function setup2FA() {
    try {
      const res = await api.get2FASetup();
      setQrCode(res.qrCode);
    } catch (err: any) { setMessage(err.message); }
  }

  async function enable2FA() {
    try {
      await api.enable2FA(twoFACode);
      setMessage('2FA enabled successfully!');
      setQrCode('');
    } catch (err: any) { setMessage(err.message); }
  }

  const tabs = [
    { key: 'profile', label: 'Profile' },
    { key: 'security', label: 'Security' },
    { key: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account, security, and notification preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {message && <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm">{message}</div>}

      {activeTab === 'profile' && (
        <div className="glass-card p-8 space-y-6">
          <h2 className="font-display text-lg font-semibold text-white">Profile Information</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <input type="text" defaultValue={user?.fullName} className="input-glass" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input type="email" defaultValue={user?.email} className="input-glass" disabled />
              <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
            </div>
          </div>
          <button className="btn-primary">Save Changes</button>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Change Password */}
          <div className="glass-card p-8 space-y-5">
            <h2 className="font-display text-lg font-semibold text-white">Change Password</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                <input type="password" className="input-glass" placeholder="Enter current password" />
              </div>
              <div />
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                <input type="password" className="input-glass" placeholder="Min 8 chars with upper, lower, number, special" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                <input type="password" className="input-glass" placeholder="Repeat new password" />
              </div>
            </div>
            <button className="btn-primary">Update Password</button>
          </div>

          {/* 2FA */}
          <div className="glass-card p-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">Two-Factor Authentication</h2>
                <p className="text-sm text-slate-400 mt-1">Add an extra layer of security to your account</p>
              </div>
              <span className={`badge ${user?.twoFactorEnabled ? 'badge-success' : 'badge-warning'}`}>
                {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {!user?.twoFactorEnabled && !qrCode && (
              <button onClick={setup2FA} className="btn-secondary">Enable 2FA</button>
            )}

            {qrCode && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
                <div className="w-48 h-48 bg-white rounded-xl p-2 mx-auto">
                  <img src={qrCode} alt="2FA QR Code" className="w-full h-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Enter 6-digit code to verify</label>
                  <div className="flex gap-3">
                    <input type="text" value={twoFACode} onChange={(e) => setTwoFACode(e.target.value)} className="input-glass max-w-[200px] text-center font-mono text-xl tracking-[0.3em]" placeholder="000000" maxLength={6} />
                    <button onClick={enable2FA} className="btn-primary">Verify & Enable</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Sessions */}
          <div className="glass-card p-8">
            <h2 className="font-display text-lg font-semibold text-white mb-4">Active Sessions</h2>
            <p className="text-sm text-slate-400 mb-4">Manage your logged-in sessions. Revoke any session you don&apos;t recognize.</p>
            <button className="btn-danger text-sm">Revoke All Other Sessions</button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="glass-card p-8 space-y-5">
          <h2 className="font-display text-lg font-semibold text-white">Notification Preferences</h2>
          {[
            { label: 'Trade Notifications', desc: 'Get notified when trades are opened or closed' },
            { label: 'Bot Status Alerts', desc: 'Alert when bot starts, stops, or encounters errors' },
            { label: 'Commission Reminders', desc: 'Reminders about pending commission payments' },
            { label: 'Security Alerts', desc: 'Login attempts and security-related notifications' },
          ].map((n, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div>
                <div className="text-sm font-medium text-white">{n.label}</div>
                <div className="text-xs text-slate-500">{n.desc}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-5 bg-slate-700 peer-checked:bg-cyan-500 rounded-full peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </label>
            </div>
          ))}
          <button className="btn-primary">Save Preferences</button>
        </div>
      )}
    </div>
  );
}
