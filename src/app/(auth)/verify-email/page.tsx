'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No verification token provided.'); return; }
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setStatus('error'); setMessage(data.error); }
        else { setStatus('success'); setMessage(data.message); }
      })
      .catch(() => { setStatus('error'); setMessage('Verification failed. Please try again.'); });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card p-10 text-center max-w-md">
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-white">Verifying your email...</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="font-display text-xl font-bold text-white mb-2">Email Verified</h2>
            <p className="text-slate-400 text-sm mb-6">{message}</p>
            <Link href="/login" className="btn-primary">Sign In</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h2 className="font-display text-xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-slate-400 text-sm mb-6">{message}</p>
            <Link href="/login" className="btn-secondary">Go to Login</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
