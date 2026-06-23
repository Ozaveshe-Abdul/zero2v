'use client';

import * as React from 'react';
import Link from 'next/link';
import LayoutShell from '@/components/layout/LayoutShell';

export default function WalletCallbackPage() {
  const [status, setStatus] = React.useState<'loading' | 'success' | 'failed'>('loading');

  React.useEffect(() => {
    // Simulate transaction status lookup
    const timer = setTimeout(() => {
      setStatus('success');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LayoutShell>
      <div className="max-w-xl mx-auto w-full">
        <section className="bg-white rounded-2xl shadow-md border border-[#E5E7EB]/50 p-12 text-center space-y-6">
          {status === 'loading' && (
            <div className="space-y-4">
              <span className="material-symbols-outlined text-5xl text-blue-500 animate-spin">
                autorenew
              </span>
              <h2 className="font-heading text-lg font-bold text-[#1A1A1A]">Verifying Top Up...</h2>
              <p className="text-xs text-[#404942]">Please hold on while we secure your payment verification signature from Paystack.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <span className="material-symbols-outlined text-5xl text-green-500 font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <h2 className="font-heading text-lg font-bold text-[#0D4C2E]">Funding Successful!</h2>
              <p className="text-xs text-[#404942] leading-normal">
                Your payment transaction has been captured. The credited naira has been added to your available wallet balance.
              </p>
              <div className="pt-4 flex gap-3 max-w-xs mx-auto">
                <Link href="/wallet" className="flex-1">
                  <button className="w-full h-11 bg-[#0D4C2E] hover:bg-[#00341c] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer">
                    Back to Wallet
                  </button>
                </Link>
                <Link href="/dashboard" className="flex-1">
                  <button className="w-full h-11 border border-[#0D4C2E] text-[#0D4C2E] hover:bg-[#0D4C2E]/5 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer">
                    Dashboard
                  </button>
                </Link>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="space-y-4">
              <span className="material-symbols-outlined text-5xl text-red-500 font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                cancel
              </span>
              <h2 className="font-heading text-lg font-bold text-red-600">Verification Failed</h2>
              <p className="text-xs text-[#404942] leading-normal">
                We were unable to verify your top-up request. Please contact support if your account was charged.
              </p>
              <div className="pt-4 max-w-xs mx-auto">
                <Link href="/wallet" className="block w-full">
                  <button className="w-full h-11 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer">
                    Return to Wallet
                  </button>
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </LayoutShell>
  );
}
