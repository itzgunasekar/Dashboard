'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [needs2FA, setNeeds2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login({ email, password, twoFactorCode: needs2FA ? twoFactorCode : undefined });

      if (res.requiresTwoFactor) {
        setNeeds2FA(true);
        setLoading(false);
        return;
      }

      setAuth(res.user, res.accessToken, res.refreshToken);
      router.push(res.user.role === 'ADMIN' || res.user.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center font-black text-white shadow-lg shadow-cyan-500/20">Æ</div>
            <span className="font-display text-2xl font-bold gradient-text">AETHER</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your trading account</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          {!needs2FA ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-glass" placeholder="you@example.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-glass" placeholder="Enter your password" required />
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-400">
                  <input type="checkbox" className="rounded border-slate-600" />
                  Remember me
                </label>
                <Link href="/forgot-password" className="text-cyan-400 hover:text-cyan-300 transition-colors">Forgot password?</Link>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Two-Factor Authentication Code</label>
              <input type="text" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} className="input-glass text-center text-xl tracking-[0.3em] font-mono" placeholder="000000" maxLength={6} required autoFocus />
              <p className="text-xs text-slate-500 mt-2">Enter the 6-digit code from your authenticator app</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5">
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : needs2FA ? 'Verify' : 'Sign In'}
          </button>

          <p className="text-center text-sm text-slate-500">
            New to AETHER?{' '}
            <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">Create account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
