'use client';

import * as React from 'react';
import Link from 'next/link';
import LayoutShell from '@/components/layout/LayoutShell';
import { FundWalletForm } from '@/components/wallet/FundWalletForm';

interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'refund';
  amount: number;
  description: string;
  date: string;
  balanceAfter: number;
}

export default function WalletPage() {
  const [balance, setBalance] = React.useState<number | null>(null);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const balanceRes = await fetch('/api/balance');
        const balanceData = await balanceRes.json();
        if (balanceRes.ok) {
          setBalance(balanceData.balance);
        }
      } catch (err) {
        console.error("Failed to fetch wallet data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWalletData();
  }, []);

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#0D4C2E]">My Wallet</h1>
          <button className="text-[#0D4C2E] text-sm font-bold tracking-wider hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span className="hidden sm:inline">Export Statement</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Balance & Funding Side */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#0D4C2E] text-white p-6 md:p-8 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

              <div className="space-y-1 relative z-10">
                <div className="flex items-center gap-2 text-white/80">
                  <span className="text-sm font-bold tracking-wider uppercase">Available Balance</span>
                  <div className="group relative">
                    <span className="material-symbols-outlined text-[16px] cursor-help">info</span>
                    <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      ₦1 = 1 Credit. Verifications deduct credits equal to their naira cost. Failed lookups are refunded automatically.
                    </div>
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold font-mono text-[#D4A017] tracking-tight">
                  {loading ? '...' : `₦${balance !== null ? balance.toLocaleString() : '0'}`}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
              <div className="border-b border-[#E5E7EB] bg-[#F7F5F0] px-6 py-4">
                <h2 className="font-bold tracking-wider text-[#1A1A1A] text-sm uppercase">Fund Wallet</h2>
              </div>
              <div className="p-6 md:p-8">
                 <FundWalletForm />
              </div>
            </div>
          </div>

          {/* Transaction History Side */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="font-heading font-bold text-lg text-[#1A1A1A] ml-1">Recent Transactions</h2>
            
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] text-center text-[#707971] text-sm italic">
                  No recent transactions.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="bg-white p-4 md:p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                    {/* Icon */}
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'credit' ? 'bg-[#059669]/10 text-[#059669]' :
                      tx.type === 'refund' ? 'bg-[#2563EB]/10 text-[#2563EB]' :
                      'bg-[#DC2626]/10 text-[#DC2626]'
                    }`}>
                      <span className="material-symbols-outlined">
                        {tx.type === 'credit' ? 'arrow_downward' :
                         tx.type === 'refund' ? 'undo' :
                         'arrow_upward'}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#1A1A1A] text-sm truncate">{tx.description}</span>
                        <span className={`font-mono font-bold whitespace-nowrap ${
                          tx.type === 'credit' || tx.type === 'refund' ? 'text-[#059669]' : 'text-[#1A1A1A]'
                        }`}>
                          {tx.type === 'credit' || tx.type === 'refund' ? '+' : '−'}₦{tx.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1 text-xs text-[#707971]">
                        <span>{tx.date}</span>
                        <span>Balance after: ₦{tx.balanceAfter.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {transactions.length > 0 && (
              <button className="w-full h-12 mt-4 bg-white border border-[#E5E7EB] text-[#404942] font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-[#F7F5F0] transition-all">
                Load More
              </button>
            )}
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}
