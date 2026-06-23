'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LayoutShellProps {
  children: React.ReactNode;
}

export default function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname() || '';

  // Determine active tab
  const getActiveTab = () => {
    if (pathname.startsWith('/dashboard')) return 'dashboard';
    if (pathname.startsWith('/verify')) return 'verify';
    if (pathname.startsWith('/batch')) return 'batch';
    if (pathname.startsWith('/orders')) return 'orders';
    if (pathname.startsWith('/history')) return 'history';
    if (pathname.startsWith('/wallet')) return 'wallet';
    return '';
  };

  const activeTab = getActiveTab();

  // Material Symbols Outlined Icon Helper
  const Icon = ({ name, active = false }: { name: string; active?: boolean }) => (
    <span
      className="material-symbols-outlined text-[24px] transition-all"
      style={{ fontVariationSettings: active ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 400" }}
    >
      {name}
    </span>
  );

  return (
    <div className="relative min-h-screen bg-[#F7F5F0] text-[#1A1A1A] font-sans antialiased flex">
      {/* ----------------- DESKTOP SIDEBAR ----------------- */}
      <aside className="hidden lg:flex flex-col w-64 h-screen bg-[#0D4C2E] text-white fixed left-0 top-0 py-8 z-50 shadow-xl border-r border-[#00341c]/25">
        <div className="px-6 mb-8">
          <h1 className="font-heading text-2xl font-bold text-white tracking-tight">zero2v</h1>
          <p className="text-[#80bc95] text-[10px] uppercase font-bold tracking-widest font-label-caps opacity-80 mt-0.5">
            Sovereign Trust Identity
          </p>
        </div>

        {/* Quick Action Button in Sidebar */}
        <Link href="/verify" className="mx-6 mb-6">
          <button className="w-full bg-[#ffc641] text-[#715300] hover:bg-[#ffdfa0] py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-md cursor-pointer active:scale-95">
            <span className="material-symbols-outlined text-[20px] font-bold">add_circle</span>
            <span className="text-xs uppercase tracking-wider font-label-caps">New Verification</span>
          </button>
        </Link>

        {/* Desktop Sidebar Navigation Links */}
        <nav className="flex-1 space-y-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 pl-5 py-3 text-sm font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'text-[#ffc641] border-l-4 border-[#ffc641] bg-[#00341c]/30'
                : 'text-[#80bc95] hover:text-white hover:bg-[#00341c]/20'
            }`}
          >
            <Icon name="dashboard" active={activeTab === 'dashboard'} />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/verify"
            className={`flex items-center gap-3 pl-5 py-3 text-sm font-semibold transition-all ${
              activeTab === 'verify'
                ? 'text-[#ffc641] border-l-4 border-[#ffc641] bg-[#00341c]/30'
                : 'text-[#80bc95] hover:text-white hover:bg-[#00341c]/20'
            }`}
          >
            <Icon name="verified_user" active={activeTab === 'verify'} />
            <span>NIN Verification</span>
          </Link>

          <Link
            href="/batch"
            className={`flex items-center gap-3 pl-5 py-3 text-sm font-semibold transition-all ${
              activeTab === 'batch'
                ? 'text-[#ffc641] border-l-4 border-[#ffc641] bg-[#00341c]/30'
                : 'text-[#80bc95] hover:text-white hover:bg-[#00341c]/20'
            }`}
          >
            <Icon name="layers" active={activeTab === 'batch'} />
            <span>Batch Processing</span>
          </Link>

          <Link
            href="/orders"
            className={`flex items-center gap-3 pl-5 py-3 text-sm font-semibold transition-all ${
              activeTab === 'orders'
                ? 'text-[#ffc641] border-l-4 border-[#ffc641] bg-[#00341c]/30'
                : 'text-[#80bc95] hover:text-white hover:bg-[#00341c]/20'
            }`}
          >
            <Icon name="receipt_long" active={activeTab === 'orders'} />
            <span>Modification Orders</span>
          </Link>

          <Link
            href="/history"
            className={`flex items-center gap-3 pl-5 py-3 text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'text-[#ffc641] border-l-4 border-[#ffc641] bg-[#00341c]/30'
                : 'text-[#80bc95] hover:text-white hover:bg-[#00341c]/20'
            }`}
          >
            <Icon name="history" active={activeTab === 'history'} />
            <span>Transactions History</span>
          </Link>

          <Link
            href="/wallet"
            className={`flex items-center gap-3 pl-5 py-3 text-sm font-semibold transition-all ${
              activeTab === 'wallet'
                ? 'text-[#ffc641] border-l-4 border-[#ffc641] bg-[#00341c]/30'
                : 'text-[#80bc95] hover:text-white hover:bg-[#00341c]/20'
            }`}
          >
            <Icon name="account_balance_wallet" active={activeTab === 'wallet'} />
            <span>Wallet & Funding</span>
          </Link>
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-[#00341c]/30 pt-6 space-y-1">
          <Link
            href="/settings"
            className="flex items-center gap-3 pl-5 py-2.5 text-xs text-[#80bc95] hover:text-white transition-all"
          >
            <Icon name="settings" />
            <span>Settings</span>
          </Link>
          <Link
            href="/auth/login"
            className="flex items-center gap-3 pl-5 py-2.5 text-xs text-[#80bc95] hover:text-red-400 transition-all"
          >
            <Icon name="logout" />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {/* ----------------- WORKSPACE INNER CONTAINER ----------------- */}
      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen pb-20 lg:pb-8">
        {/* Top App Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] h-16 flex justify-between items-center px-6 shadow-sm">
          {/* Header left: Title or Search */}
          <div className="flex items-center gap-3">
            {/* Mobile Branding (Sidebar-hidden) */}
            <div className="flex lg:hidden items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#0D4C2E]/10 flex items-center justify-center text-[#0D4C2E] border border-[#0D4C2E]/20">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified_user
                </span>
              </div>
              <h1 className="font-heading font-bold text-lg text-[#0D4C2E]">zero2v</h1>
            </div>

            {/* Desktop search bar */}
            <div className="hidden lg:flex relative w-64 xl:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#707971] text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search NIN, phone, transaction..."
                className="w-full pl-10 pr-4 py-2 bg-[#F7F5F0] border border-[#E5E7EB] rounded-full focus:ring-2 focus:ring-[#0D4C2E]/20 text-xs outline-none text-[#1c1b1b]"
              />
            </div>
          </div>

          {/* Header right: Actions & Profile */}
          <div className="flex items-center gap-4">
            <Link
              href="/wallet"
              className="text-[#0D4C2E] hover:text-[#00341c] font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span className="material-symbols-outlined text-md">add_circle</span>
              <span>Fund Wallet</span>
            </Link>

            <button className="w-8 h-8 flex items-center justify-center text-[#404942] hover:bg-[#F7F5F0] rounded-full transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>

            {/* Profile Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#E5E7EB]">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyK2GJOQCDK6-l52haB6aLqmfPuX6dfHsBVosSsE9kmsqdjZSPPFKpDZuJLFyDdQ6nUokqfy7L6nTOVt9SGg6vsuYUMqOIQUGvbbs_MUyfUTGdprJuxVUNFVf--TT0XRpmcUwznsI1QiTb3pd4ipp9Gve4zG3WRgFAC0-XvfnSjkBsBKLgISffkf0KNKcKyuc28Xu9HqlvMXtSpnhw8CFVkZN6Qe5YUF6DV0Osr9icYImsl_kQrPIGkq7SzcLw38aQpLWGb1xm9Q"
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Page Content Canvas */}
        <main className="flex-grow p-6 lg:p-8 max-w-6xl w-full mx-auto relative z-10">
          {children}
        </main>
      </div>

      {/* ----------------- MOBILE PERSISTENT BOTTOM NAV ----------------- */}
      <nav className="fixed bottom-0 left-0 w-full z-50 lg:hidden flex justify-around items-center px-4 py-2 bg-white/90 backdrop-blur-md border-t border-[#E5E7EB] shadow-[0px_-4px_12px_rgba(0,52,28,0.06)]">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'dashboard'
              ? 'bg-[#0D4C2E]/10 text-[#0D4C2E] scale-105'
              : 'text-[#404942] hover:text-[#0D4C2E]'
          }`}
        >
          <Icon name="home" active={activeTab === 'dashboard'} />
          <span className="font-label-caps text-[9px] mt-0.5 font-bold uppercase tracking-wider">Home</span>
        </Link>

        <Link
          href="/verify"
          className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'verify'
              ? 'bg-[#0D4C2E]/10 text-[#0D4C2E] scale-105'
              : 'text-[#404942] hover:text-[#0D4C2E]'
          }`}
        >
          <Icon name="verified_user" active={activeTab === 'verify'} />
          <span className="font-label-caps text-[9px] mt-0.5 font-bold uppercase tracking-wider">Verify</span>
        </Link>

        <Link
          href="/batch"
          className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'batch'
              ? 'bg-[#0D4C2E]/10 text-[#0D4C2E] scale-105'
              : 'text-[#404942] hover:text-[#0D4C2E]'
          }`}
        >
          <Icon name="layers" active={activeTab === 'batch'} />
          <span className="font-label-caps text-[9px] mt-0.5 font-bold uppercase tracking-wider">Batch</span>
        </Link>

        <Link
          href="/orders"
          className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'orders'
              ? 'bg-[#0D4C2E]/10 text-[#0D4C2E] scale-105'
              : 'text-[#404942] hover:text-[#0D4C2E]'
          }`}
        >
          <Icon name="receipt_long" active={activeTab === 'orders'} />
          <span className="font-label-caps text-[9px] mt-0.5 font-bold uppercase tracking-wider">Orders</span>
        </Link>

        <Link
          href="/history"
          className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'history'
              ? 'bg-[#0D4C2E]/10 text-[#0D4C2E] scale-105'
              : 'text-[#404942] hover:text-[#0D4C2E]'
          }`}
        >
          <Icon name="history" active={activeTab === 'history'} />
          <span className="font-label-caps text-[9px] mt-0.5 font-bold uppercase tracking-wider">History</span>
        </Link>
      </nav>
    </div>
  );
}
