'use client';

import * as React from 'react';
import Link from 'next/link';
import LayoutShell from '@/components/layout/LayoutShell';
import { NINForm } from '@/components/verify/NINForm';
import { NINPhoneForm } from '@/components/verify/NINPhoneForm';
import { NINTrackingForm } from '@/components/verify/NINTrackingForm';
import { DemographyForm } from '@/components/verify/DemographyForm';
import { ResultCard } from '@/components/verify/ResultCard';

type TabType = 'nin' | 'phone' | 'tracking' | 'demographics';
type ViewState = 'form' | 'result' | 'gate';

export default function VerifyPage() {
  const [activeTab, setActiveTab] = React.useState<TabType>('nin');
  const [viewState, setViewState] = React.useState<ViewState>('form');
  const [balance, setBalance] = React.useState(1250); // Will be hooked up to DB via useBalance later
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [resultData, setResultData] = React.useState<any>(null);

  const TABS: { id: TabType; label: string; icon: string; minCost: number }[] = [
    { id: 'nin', label: 'NIN Number', icon: 'badge', minCost: 150 },
    { id: 'phone', label: 'NIN Phone', icon: 'smartphone', minCost: 250 },
    { id: 'tracking', label: 'Tracking ID', icon: 'qr_code_scanner', minCost: 200 },
    { id: 'demographics', label: 'Demographics', icon: 'manage_search', minCost: 250 },
  ];

  const activeTabDetails = TABS.find((t) => t.id === activeTab)!;

  const handleSuccess = (data: any) => {
    setResultData(data);
    setViewState('result');
    setErrorMsg(null);
  };

  const handleError = (msg: string) => {
    setErrorMsg(msg);
  };

  const handleReset = () => {
    setViewState('form');
    setResultData(null);
    setErrorMsg(null);
  };

  return (
    <LayoutShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#0D4C2E]">Verify Identity</h1>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#E5E7EB] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
            <span className="text-xs font-bold font-mono tracking-wider text-[#1A1A1A]">
              ₦ {balance.toLocaleString()}
            </span>
          </div>
        </div>

        {viewState === 'form' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Scrollable Tabs */}
            <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 -mx-4 px-4 md:mx-0 md:px-0">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setErrorMsg(null);
                    }}
                    className={`shrink-0 h-10 px-4 rounded-full text-sm font-bold tracking-wide transition-all duration-200 flex items-center gap-2 ${
                      isActive
                        ? 'bg-[#0D4C2E] text-white shadow-md'
                        : 'bg-white text-[#707971] border border-[#E5E7EB] hover:bg-[#F7F5F0]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {tab.icon}
                    </span>
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="bg-[#DC2626]/10 text-[#DC2626] text-sm font-semibold p-4 rounded-xl border border-[#DC2626]/20 flex items-start gap-3">
                <span className="material-symbols-outlined shrink-0">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Balance Warning Gate */}
            {balance < activeTabDetails.minCost ? (
              <div className="bg-[#D97706]/10 border-l-4 border-[#D97706] p-4 rounded-r-xl">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#D97706] shrink-0">account_balance_wallet</span>
                  <div>
                    <h3 className="text-[#92400E] font-bold text-sm">Insufficient Balance</h3>
                    <p className="text-[#92400E]/80 text-xs mt-1 leading-relaxed">
                      Your balance (₦{balance}) is too low for this action. This lookup requires ₦{activeTabDetails.minCost}.
                    </p>
                    <Link href="/wallet" className="inline-block mt-3 text-xs font-bold text-[#D97706] uppercase tracking-wider hover:underline">
                      Fund your wallet →
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* Active Form Card */
              <div className="bg-white p-5 md:p-8 rounded-2xl shadow-lg border border-[#E5E7EB]/50 transition-all duration-300">
                {activeTab === 'nin' && <NINForm onSuccess={handleSuccess} onError={handleError} onLoading={setIsLoading} isLoading={isLoading} />}
                {activeTab === 'phone' && <NINPhoneForm onSuccess={handleSuccess} onError={handleError} onLoading={setIsLoading} isLoading={isLoading} />}
                {activeTab === 'tracking' && <NINTrackingForm onSuccess={handleSuccess} onError={handleError} onLoading={setIsLoading} isLoading={isLoading} />}
                {activeTab === 'demographics' && <DemographyForm onSuccess={handleSuccess} onError={handleError} onLoading={setIsLoading} isLoading={isLoading} />}
              </div>
            )}
          </div>
        )}

        {viewState === 'result' && resultData && (
          <ResultCard data={resultData} onReset={handleReset} />
        )}

        {viewState === 'gate' && (
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#E5E7EB]/50 text-center space-y-6">
            <div className="w-16 h-16 bg-[#D97706]/10 rounded-full flex items-center justify-center mx-auto text-[#D97706]">
              <span className="material-symbols-outlined text-3xl">credit_card_off</span>
            </div>
            <div className="space-y-2">
              <h2 className="font-heading font-bold text-xl text-[#1A1A1A]">Wallet is empty</h2>
              <p className="text-[#707971] text-sm">Fund your wallet to start verifying identities.</p>
            </div>
            <Link href="/wallet" className="block w-full h-12 bg-[#D4A017] text-[#1A1A1A] font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-[#b88a14] active:scale-[0.98] transition-all duration-200 flex items-center justify-center">
              Fund Wallet
            </Link>
          </div>
        )}
      </div>
    </LayoutShell>
  );
}
