'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match');
    if (!token) return setError('Invalid reset link');
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-10 text-center max-w-md">
          <h2 className="font-display text-xl font-bold text-white mb-2">Invalid Reset Link</h2>
          <p className="text-slate-400 text-sm mb-6">This password reset link is invalid or has expired.</p>
          <Link href="/forgot-password" className="btn-primary">Request New Link</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-10 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-2">Password Reset</h2>
          <p className="text-slate-400 text-sm mb-6">Your password has been updated. You can now sign in.</p>
          <Link href="/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center font-black text-white">Æ</div>
            <span className="font-display text-2xl font-bold gradient-text">AETHER</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-white">Set New Password</h1>
        </div>
        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-glass" placeholder="Min 8 chars, upper, lower, number, special" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="input-glass" placeholder="Repeat password" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5">
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
