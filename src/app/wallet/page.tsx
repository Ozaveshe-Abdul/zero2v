'use client';

import * as React from 'react';
import Link from 'next/link';
import LayoutShell from '@/components/layout/LayoutShell';

interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'refund';
  amount: number;
  description: string;
  date: string;
  balanceAfter: number;
}

export default function WalletPage() {
  const [balance, setBalance] = React.useState(1250);
  const [fundAmount, setFundAmount] = React.useState('');

  // Sample transactions statement
  const [transactions, setTransactions] = React.useState<Transaction[]>([
    {
      id: 'tx-1',
      type: 'credit',
      amount: 2000,
      description: 'Wallet top-up via Paystack',
      date: '2 hours ago',
      balanceAfter: 3250,
    },
    {
      id: 'tx-2',
      type: 'debit',
      amount: 150,
      description: 'NIN Verification lookup',
      date: '3 hours ago',
      balanceAfter: 3100,
    },
    {
      id: 'tx-3',
      type: 'debit',
      amount: 250,
      description: 'NIN Phone Search lookup',
      date: 'Yesterday',
      balanceAfter: 2850,
    },
    {
      id: 'tx-4',
      type: 'refund',
      amount: 150,
      description: 'Refund: NIN Verification failed',
      date: '2 days ago',
      balanceAfter: 3000,
    },
  ]);

  const handleQuickFund = (amount: number) => {
    setFundAmount(amount.toString());
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(fundAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert("Please enter a valid funding amount.");
      return;
    }

    // Simulate Paystack integration
    alert(`Redirecting to Paystack checkout to fund ₦${amountVal.toLocaleString()}...`);
    setBalance((prev) => prev + amountVal);

    const newTx: Transaction = {
      id: `tx-${Math.random().toString(36).substring(7)}`,
      type: 'credit',
      amount: amountVal,
      description: 'Wallet top-up via Paystack (Simulated)',
      date: 'Just now',
      balanceAfter: balance + amountVal,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setFundAmount('');
  };

  return (
    <LayoutShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-heading text-2xl font-bold text-[#0D4C2E]">My Wallet</h1>
            <p className="text-xs text-[#404942] mt-1">Manage your verification credits balance</p>
          </div>

          <button
            onClick={() => alert('Generating Statement PDF...')}
            className="text-[#0D4C2E] border border-[#0D4C2E]/30 px-3 py-1.5 rounded-xl hover:bg-[#0D4C2E]/5 font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Export Statement (PDF)
          </button>
        </div>

        {/* Balance card */}
        <section
          className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-md border border-[#E5E7EB]/50"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuAKKJjTtl9ULLqTLNGnAidtItZ965yfSL1LYh4vvZijxwzauuX5srLCpgx4TPB1yRC6MVTO6Gxj8MOqJCgi5pccA5_TiXjlgeHIfjc4xyZXT14eGxkgrKDy1I5cfQK_kLb20HDp2rqrN9iu04zldCHPYPqk1k1i-ncws2Hkg-WuGbL-YYsaQIVNCgBixZdJrlLfE6urjEsWk9HIuZjvgijnq1Ghp9V2CKQneWMhMmBIx0sFy8oXoiYnIzzYOm5yzYY46eUzFTL7-w')`,
            backgroundSize: '150px',
            backgroundPosition: 'top 10px right 10px',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-[#404942] uppercase tracking-wider">Available Wallet Balance</p>
              <div className="group relative flex items-center">
                <span className="material-symbols-outlined text-[16px] text-[#404942] cursor-help">info</span>
                <div className="absolute bottom-full mb-2 left-0 scale-0 group-hover:scale-100 transition-all origin-bottom-left bg-[#0D4C2E] text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                  ₦1 Funded = 1 Credit. Deducted per query call.
                </div>
              </div>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#D4A017] tracking-tight">
              ₦{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
          </div>
        </section>

        {/* Dynamic funding module and Statement side-by-side on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fund Wallet Module */}
          <section className="bg-white rounded-2xl border border-[#E5E7EB]/50 p-6 space-y-4">
            <h3 className="text-[#1A1A1A] font-heading text-sm font-bold uppercase tracking-wider">Fund Wallet</h3>

            <form onSubmit={handlePayment} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-[10px] font-bold text-[#404942] uppercase tracking-wider ml-1" htmlFor="amount">
                  ENTER AMOUNT (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#404942]">₦</span>
                  <input
                    id="amount"
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="Enter amount to fund"
                    className="w-full h-12 pl-8 pr-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none"
                  />
                </div>
              </div>

              {/* Quick Amount Chips */}
              <div className="flex gap-2 flex-wrap">
                {[500, 1000, 2000, 5000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleQuickFund(amount)}
                    className="px-3.5 py-1.5 bg-[#F7F5F0] hover:bg-[#0D4C2E]/10 border border-[#E5E7EB] hover:border-[#0D4C2E] text-xs font-bold text-[#1A1A1A] rounded-full transition-colors cursor-pointer"
                  >
                    ₦{amount.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Pay with Paystack Button */}
              <button
                type="submit"
                className="w-full h-12 bg-[#0D4C2E] text-white font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-[#00341c] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-[20px]">credit_card</span>
                <span>Pay with Paystack</span>
              </button>
            </form>
          </section>

          {/* Transaction statement logs */}
          <section className="space-y-3">
            <h3 className="text-[#1A1A1A] font-heading text-sm font-bold uppercase tracking-wider">Transaction Statement</h3>

            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]/50 overflow-hidden divide-y divide-[#E5E7EB]/60">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-4 hover:bg-[#F7F5F0]/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        tx.type === 'credit' && 'bg-green-50 text-[#059669]'
                      } ${tx.type === 'debit' && 'bg-red-50 text-[#DC2626]'} ${
                        tx.type === 'refund' && 'bg-blue-50 text-[#2563EB]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {tx.type === 'credit' && 'arrow_upward'}
                        {tx.type === 'debit' && 'arrow_downward'}
                        {tx.type === 'refund' && 'replay'}
                      </span>
                    </div>

                    <div>
                      <p className="font-bold text-[#1A1A1A] text-xs md:text-sm">{tx.description}</p>
                      <p className="text-[10px] text-[#404942] mt-0.5">{tx.date} · Balance: ₦{tx.balanceAfter.toLocaleString()}</p>
                    </div>
                  </div>

                  <span
                    className={`font-mono text-xs font-bold ${
                      tx.type === 'credit' && 'text-[#059669]'
                    } ${tx.type === 'debit' && 'text-[#DC2626]'} ${tx.type === 'refund' && 'text-[#2563EB]'}`}
                  >
                    {tx.type === 'debit' ? '-' : '+'}₦{tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </LayoutShell>
  );
}
