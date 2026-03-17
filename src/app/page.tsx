'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const FEATURES = [
  { icon: '⚡', title: 'AI Trading Bot', desc: 'Our proprietary AI engine analyzes markets 24/7, executing trades with sub-second precision across multiple forex pairs.' },
  { icon: '🔗', title: 'MT5 Integration', desc: 'Direct MetaTrader 5 connection. Link your existing broker account and let our bot trade on your behalf automatically.' },
  { icon: '🛡️', title: 'Military-Grade Security', desc: 'AES-256 encryption, 2FA authentication, rate limiting, and end-to-end encrypted broker connections.' },
  { icon: '📊', title: 'Real-Time Analytics', desc: 'Live P&L tracking, trade history, risk metrics, and performance dashboards updated in real-time.' },
  { icon: '🤝', title: 'IB Partnership', desc: 'Open your trading account through our portal and benefit from reduced spreads and commission rebates.' },
  { icon: '💳', title: 'Transparent Billing', desc: 'Simple subscription plans with profit-based commissions. Pay only when you profit. No hidden fees.' },
];

const PLANS = [
  { name: 'Starter', price: 29, features: ['1 Bot Instance', '1 Broker Account', 'Basic Analytics', 'Email Support', '25% Profit Commission'], color: 'cyan' },
  { name: 'Pro', price: 79, features: ['3 Bot Instances', '3 Broker Accounts', 'Advanced Analytics', 'Priority Support', '20% Profit Commission', 'Custom Risk Settings'], color: 'violet', popular: true },
  { name: 'Enterprise', price: 199, features: ['Unlimited Bots', 'Unlimited Accounts', 'Full Analytics Suite', '24/7 Dedicated Support', '15% Profit Commission', 'Custom Strategies', 'API Access'], color: 'emerald' },
];

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <span className="font-mono">{val.toLocaleString()}{suffix}</span>;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card" style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center font-black text-sm text-white shadow-lg shadow-cyan-500/20">Æ</div>
            <span className="font-display text-xl font-bold gradient-text">AETHER</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</a>
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="btn-primary text-sm !py-2.5 !px-5">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 text-xs font-medium text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Trading Active — 2,847 trades executed today
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
            <span className="text-white">Trade Smarter with</span><br />
            <span className="gradient-text">AI-Powered</span>{' '}
            <span className="gradient-text-violet">Automation</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect your MetaTrader 5 account. Start our AI bot. Watch it trade the forex market with precision
            — while you focus on what matters. Real broker integration. Real profits. Real-time control.
          </p>
          <div className="flex items-center justify-center gap-4 mb-16">
            <Link href="/register" className="btn-primary text-base !py-3.5 !px-8">
              Start Trading Now
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <a href="#features" className="btn-secondary text-base !py-3.5 !px-8">Learn More</a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { label: 'Active Traders', value: 4200, suffix: '+' },
              { label: 'Monthly Volume', value: 82, suffix: 'M' },
              { label: 'Win Rate', value: 73, suffix: '%' },
              { label: 'Avg Monthly Return', value: 12, suffix: '%' },
            ].map((s, i) => (
              <div key={i} className="stat-card text-center p-5">
                <div className="text-2xl font-bold text-white font-display mb-1">
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">Built for Serious Traders</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Everything you need to automate your forex trading with institutional-grade technology.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="glass-card p-7 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-400">Start free. Upgrade when you're ready. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <div key={i} className={`glass-card p-8 relative ${plan.popular ? 'border-cyan-500/30 glow-cyan' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-xs font-bold text-white">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="font-display text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold font-display text-white">${plan.price}</span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-slate-300">
                      <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={plan.popular ? 'btn-primary w-full' : 'btn-secondary w-full'}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center glass-card p-12">
          <h2 className="font-display text-3xl font-bold text-white mb-4">Ready to Automate Your Trading?</h2>
          <p className="text-slate-400 mb-8">Join thousands of traders who trust AETHER to execute their forex strategy 24/7.</p>
          <Link href="/register" className="btn-primary text-base !py-3.5 !px-8">Create Free Account</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-600">
          <span>&copy; {new Date().getFullYear()} AETHER Trading Platform. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
