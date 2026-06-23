'use client';

import * as React from 'react';
import Link from 'next/link';
import LayoutShell from '@/components/layout/LayoutShell';

export default function DashboardPage() {
  const [balance, setBalance] = React.useState(1250);

  // Format currency helpers
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount).replace('NGN', '₦');
  };

  return (
    <LayoutShell>
      <div className="space-y-6">
        {/* Available Balance Hero Card */}
        <section
          className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-md border border-[#E5E7EB]/50"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuAKKJjTtl9ULLqTLNGnAidtItZ965yfSL1LYh4vvZijxwzauuX5srLCpgx4TPB1yRC6MVTO6Gxj8MOqJCgi5pccA5_TiXjlgeHIfjc4xyZXT14eGxkgrKDy1I5cfQK_kLb20HDp2rqrN9iu04zldCHPYPqk1k1i-ncws2Hkg-WuGbL-YYsaQIVNCgBixZdJrlLfE6urjEsWk9HIuZjvgijnq1Ghp9V2CKQneWMhMmBIx0sFy8oXoiYnIzzYOm5yzYY46eUzFTL7-w')`,
            backgroundSize: '150px',
            backgroundPosition: 'top 10px right 10px',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-[#404942] uppercase tracking-wider">Available Balance</p>
                <div className="group relative flex items-center">
                  <span className="material-symbols-outlined text-[16px] text-[#404942] cursor-help" style={{ fontVariationSettings: "'wght' 500" }}>
                    info
                  </span>
                  <div className="absolute bottom-full mb-2 left-0 scale-0 group-hover:scale-100 transition-all origin-bottom-left bg-[#0D4C2E] text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                    1 Naira = 1 Credit. Refunds are automatic on failure.
                  </div>
                </div>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#D4A017] tracking-tight">
                {formatNaira(balance)}
              </h2>
            </div>
            
            <div className="flex gap-2">
              <Link href="/wallet">
                <button className="bg-[#0D4C2E] text-white hover:bg-[#00341c] px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95">
                  Fund Wallet
                </button>
              </Link>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <span className="px-3 py-1 bg-[#0D4C2E]/10 text-[#0D4C2E] text-[10px] rounded-full font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                security
              </span>
              Licensed Sovereign Trustee
            </span>
          </div>
        </section>

        {/* Quick Stats Grid */}
        <section className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E7EB]/50 flex flex-col justify-between">
            <p className="text-[#404942] text-[10px] uppercase font-bold tracking-wider">Today's Calls</p>
            <p className="text-2xl font-bold text-[#0D4C2E] mt-1">5</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E7EB]/50 flex flex-col justify-between">
            <p className="text-[#404942] text-[10px] uppercase font-bold tracking-wider">This Month</p>
            <p className="text-2xl font-bold text-[#0D4C2E] mt-1">23</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E7EB]/50 flex flex-col justify-between">
            <p className="text-[#404942] text-[10px] uppercase font-bold tracking-wider">Spent MTD</p>
            <p className="text-sm md:text-base font-bold text-[#0D4C2E] mt-1">₦3,450.00</p>
          </div>
        </section>

        {/* Quick Actions & Recent Activity Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Actions Panel */}
          <section className="space-y-3">
            <h3 className="text-[#1A1A1A] font-heading text-lg font-bold">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/verify?tab=nin">
                <button className="w-full flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-[#E5E7EB]/50 hover:bg-[#F7F5F0] transition-all cursor-pointer active:scale-95">
                  <div className="w-12 h-12 bg-[#0D4C2E]/10 text-[#0D4C2E] rounded-full flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      verified_user
                    </span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">NIN Verify</span>
                </button>
              </Link>

              <Link href="/verify?tab=phone">
                <button className="w-full flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-[#E5E7EB]/50 hover:bg-[#F7F5F0] transition-all cursor-pointer active:scale-95">
                  <div className="w-12 h-12 bg-[#ffc641]/10 text-[#715300] rounded-full flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined text-[28px]">phone_iphone</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">NIN Phone</span>
                </button>
              </Link>

              <Link href="/batch">
                <button className="w-full flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-[#E5E7EB]/50 hover:bg-[#F7F5F0] transition-all cursor-pointer active:scale-95">
                  <div className="w-12 h-12 bg-[#2563EB]/10 text-[#2563EB] rounded-full flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined text-[28px]">layers</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">Batch Lookup</span>
                </button>
              </Link>

              <Link href="/orders">
                <button className="w-full flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-[#E5E7EB]/50 hover:bg-[#F7F5F0] transition-all cursor-pointer active:scale-95">
                  <div className="w-12 h-12 bg-[#795900]/10 text-[#795900] rounded-full flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined text-[28px]">receipt_long</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">Orders</span>
                </button>
              </Link>
            </div>
          </section>

          {/* Recent Activity Panel */}
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-[#1A1A1A] font-heading text-lg font-bold">Recent Activity</h3>
              <Link href="/history" className="text-[#0D4C2E] hover:underline text-xs font-bold uppercase tracking-wider">
                View All →
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-[#E5E7EB]/60 border border-[#E5E7EB]/50">
              {/* Row 1 */}
              <div className="flex items-center justify-between p-4 hover:bg-[#F7F5F0]/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#059669]" title="Success"></div>
                  <div>
                    <p className="font-bold text-[#1A1A1A] text-sm">Standard NIN Lookup</p>
                    <p className="text-[11px] text-[#404942] font-mono">NIN: 1234567****</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs font-bold text-[#DC2626]">-₦150.00</p>
                  <p className="text-[10px] text-[#404942] mt-0.5">2m ago</p>
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex items-center justify-between p-4 hover:bg-[#F7F5F0]/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#059669]" title="Success"></div>
                  <div>
                    <p className="font-bold text-[#1A1A1A] text-sm">NIN Phone Search</p>
                    <p className="text-[11px] text-[#404942] font-mono">Phone: 0801234****</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs font-bold text-[#DC2626]">-₦250.00</p>
                  <p className="text-[10px] text-[#404942] mt-0.5">15m ago</p>
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex items-center justify-between p-4 hover:bg-[#F7F5F0]/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" title="Refunded"></div>
                  <div>
                    <p className="font-bold text-[#1A1A1A] text-sm">NIN Demographics Search</p>
                    <p className="text-[11px] text-[#404942] font-mono">Report ID: DEMO_118231</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs font-bold text-[#2563EB]">+₦0.00 (Refunded)</p>
                  <p className="text-[10px] text-[#404942] mt-0.5">1h ago</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </LayoutShell>
  );
}
