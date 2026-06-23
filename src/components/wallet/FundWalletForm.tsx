'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

export function FundWalletForm() {
  const [amount, setAmount] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const presetAmounts = [500, 1000, 2000, 5000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount, 10);

    if (isNaN(numAmount) || numAmount < 100) {
      setError('Minimum funding amount is ₦100');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/wallet/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-[#DC2626]/10 text-[#DC2626] text-sm font-semibold p-3 rounded-xl border border-[#DC2626]/20">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">
          Amount to Fund
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#707971] font-bold text-lg">
            ₦
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000"
            className="w-full h-14 pl-10 pr-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] transition-all outline-none text-lg font-bold text-[#1c1b1b]"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {presetAmounts.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount(preset.toString())}
            disabled={isLoading}
            className="flex-1 min-w-[70px] h-10 bg-white border border-[#E5E7EB] text-[#1A1A1A] text-sm font-bold rounded-lg hover:bg-[#F7F5F0] hover:border-[#0D4C2E]/50 active:scale-95 transition-all"
          >
            ₦{preset.toLocaleString()}
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={!amount || isLoading}
        className="w-full h-14 bg-[#0D4C2E] text-white font-bold tracking-wider uppercase rounded-xl shadow-md hover:bg-[#00341c] hover:shadow-lg active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-[20px]">
          {isLoading ? 'hourglass_empty' : 'payments'}
        </span>
        {isLoading ? 'Processing...' : 'Pay with Paystack'}
      </button>
    </form>
  );
}
