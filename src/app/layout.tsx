import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AETHER | AI-Powered Forex Trading Platform",
  description: "Next-generation automated forex trading with MetaTrader 5 integration. AI bots, copy trading, and real-time analytics.",
  keywords: "forex, trading, MT5, MetaTrader, AI bot, copy trading, automated trading",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <div className="aurora-bg">
          <div className="aurora-orb" />
          <div className="aurora-orb" />
          <div className="aurora-orb" />
        </div>
        <div className="grid-overlay" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
