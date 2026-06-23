'use client';

import * as React from 'react';
import Link from 'next/link';
import LayoutShell from '@/components/layout/LayoutShell';

type TabType = 'nin' | 'phone' | 'tracking' | 'demographics';
type ViewState = 'form' | 'result' | 'gate';

export default function VerifyPage() {
  const [activeTab, setActiveTab] = React.useState<TabType>('nin');
  const [viewState, setViewState] = React.useState<ViewState>('form');
  const [consentChecked, setConsentChecked] = React.useState(false);
  const [balance, setBalance] = React.useState(1250);
  
  // Simulated lookup result data
  const [resultData, setResultData] = React.useState({
    fullName: 'JOHN OLUMIDE ADEBAYO',
    nin: '12345678901',
    reportId: 'NIN_251021154942_59E172',
    dob: '15 May 1990',
    gender: 'Male',
    phone: '08012345678',
    state: 'Lagos',
    lga: 'Ikeja',
    town: 'Ikeja',
    residence: '15 Allen Avenue, Ikeja, Lagos',
    birthCountry: 'Nigeria',
    birthState: 'Ogun',
    birthLga: 'Abeokuta North',
    consentTime: '13 Jun 2026, 14:31',
  });

  // Form states
  const [ninNumber, setNinNumber] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [trackingId, setTrackingId] = React.useState('');
  const [demoFirstName, setDemoFirstName] = React.useState('');
  const [demoLastName, setDemoLastName] = React.useState('');
  const [demoGender, setDemoGender] = React.useState('');
  const [demoDob, setDemoDob] = React.useState('');

  const PRICING = {
    nin: 150,
    phone: 250,
    tracking: 200,
    demographics: 250,
  };

  const getCostLabel = () => {
    return `₦${PRICING[activeTab]} per lookup`;
  };

  const isFormValid = () => {
    switch (activeTab) {
      case 'nin':
        return ninNumber.length === 11 && consentChecked;
      case 'phone':
        return phoneNumber.trim().length >= 10 && consentChecked;
      case 'tracking':
        return trackingId.trim().length >= 8 && consentChecked;
      case 'demographics':
        return (
          demoFirstName.trim().length > 0 &&
          demoLastName.trim().length > 0 &&
          demoGender.trim().length > 0 &&
          demoDob.trim().length > 0 &&
          consentChecked
        );
      default:
        return false;
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    const currentCost = PRICING[activeTab];
    if (balance < currentCost) {
      setViewState('gate');
      return;
    }

    // Deduct cost and transition to result screen
    setBalance((prev) => prev - currentCost);
    
    // Customize search results payload dynamically depending on inputs
    setResultData((prev) => ({
      ...prev,
      fullName: activeTab === 'demographics' ? `${demoFirstName.toUpperCase()} ${demoLastName.toUpperCase()}` : prev.fullName,
      nin: activeTab === 'nin' ? ninNumber : prev.nin,
      phone: activeTab === 'phone' ? phoneNumber : prev.phone,
      reportId: `${activeTab.toUpperCase()}_${Math.floor(100000 + Math.random() * 900000)}_TX`,
      consentTime: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    }));
    
    setViewState('result');
  };

  const handleReset = () => {
    setViewState('form');
    setConsentChecked(false);
    setNinNumber('');
    setPhoneNumber('');
    setTrackingId('');
    setDemoFirstName('');
    setDemoLastName('');
    setDemoGender('');
    setDemoDob('');
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setConsentChecked(false);
    if (balance === 0) {
      setViewState('gate');
    } else {
      setViewState('form');
    }
  };

  return (
    <LayoutShell>
      <div className="space-y-6">
        {/* Verification Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-heading text-2xl font-bold text-[#0D4C2E]">Verify Identity</h1>
            <p className="text-xs text-[#404942] mt-1">Direct Secure Connection to National Registry</p>
          </div>
          {/* Balance chip top right */}
          <div className="bg-white px-4 py-2 rounded-full border border-[#E5E7EB] shadow-sm flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A]">
            <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
            <span>₦{balance.toLocaleString()}</span>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="w-full">
          <div className="flex overflow-x-auto gap-2 py-1.5 no-scrollbar">
            {[
              { id: 'nin', label: 'NIN Number' },
              { id: 'phone', label: 'NIN Phone' },
              { id: 'tracking', label: 'NIN Tracking' },
              { id: 'demographics', label: 'Demographics' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabType)}
                className={`whitespace-nowrap px-4 py-2 rounded-full font-label-caps text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#0D4C2E] text-white shadow-sm'
                    : 'bg-white border border-[#E5E7EB] text-[#404942] hover:bg-[#F7F5F0]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-xl mx-auto w-full">
          {/* -------------------- VIEW 1: BATCH FORM VIEW -------------------- */}
          {viewState === 'form' && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl shadow-md border border-[#E5E7EB]/50 p-6 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 opacity-[0.03] pointer-events-none">
                  <span className="material-symbols-outlined text-[160px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    security
                  </span>
                </div>

                <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h2 className="font-heading text-lg font-bold text-[#0D4C2E]">
                        {activeTab === 'nin' && 'NIN Number Lookup'}
                        {activeTab === 'phone' && 'NIN Phone Search'}
                        {activeTab === 'tracking' && 'NIN Tracking Search'}
                        {activeTab === 'demographics' && 'NIN Demographics Lookup'}
                      </h2>
                      <p className="text-xs text-[#404942] mt-0.5">
                        {activeTab === 'nin' && 'Validate 11-digit national identity records.'}
                        {activeTab === 'phone' && 'Search NIN numbers associated with a phone string.'}
                        {activeTab === 'tracking' && 'Query matching records via NIMC tracking reference.'}
                        {activeTab === 'demographics' && 'Query database using personal demographic parameters.'}
                      </p>
                    </div>

                    <div className="bg-[#ffc641]/20 text-[#715300] px-3 py-1.5 rounded-full font-label-caps text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm shrink-0">
                      <span className="material-symbols-outlined text-[14px]">payments</span>
                      <span>{getCostLabel()}</span>
                    </div>
                  </div>

                  <form onSubmit={handleVerify} className="space-y-6">
                    {/* Tab Inputs */}
                    {activeTab === 'nin' && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center ml-1">
                          <label className="font-label-caps text-xs font-bold text-[#404942] uppercase tracking-wider" htmlFor="ninNumber">
                            NIN Number
                          </label>
                          <span className="text-[10px] font-mono text-[#404942]">
                            {ninNumber.length}/11 digits
                          </span>
                        </div>
                        <input
                          id="ninNumber"
                          type="text"
                          maxLength={11}
                          value={ninNumber}
                          onChange={(e) => setNinNumber(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="Enter 11-digit NIN"
                          className="w-full h-14 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl px-4 font-mono text-lg tracking-widest text-[#0D4C2E] focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none transition-all"
                        />
                      </div>
                    )}

                    {activeTab === 'phone' && (
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-xs font-bold text-[#404942] uppercase tracking-wider ml-1" htmlFor="phoneNumber">
                          Phone Number
                        </label>
                        <input
                          id="phoneNumber"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9+]/g, ''))}
                          placeholder="Enter registered mobile number"
                          className="w-full h-14 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl px-4 font-mono text-sm tracking-wide text-[#0D4C2E] focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none transition-all"
                        />
                      </div>
                    )}

                    {activeTab === 'tracking' && (
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-xs font-bold text-[#404942] uppercase tracking-wider ml-1" htmlFor="trackingId">
                          Tracking ID
                        </label>
                        <input
                          id="trackingId"
                          type="text"
                          value={trackingId}
                          onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                          placeholder="Enter Tracking Reference Code"
                          className="w-full h-14 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl px-4 font-mono text-sm tracking-widest text-[#0D4C2E] focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none transition-all"
                        />
                      </div>
                    )}

                    {activeTab === 'demographics' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="font-label-caps text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">First Name</label>
                            <input
                              type="text"
                              value={demoFirstName}
                              onChange={(e) => setDemoFirstName(e.target.value)}
                              placeholder="First Name"
                              className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none transition-all"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="font-label-caps text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">Last Name</label>
                            <input
                              type="text"
                              value={demoLastName}
                              onChange={(e) => setDemoLastName(e.target.value)}
                              placeholder="Last Name"
                              className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="font-label-caps text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">Date of Birth</label>
                            <input
                              type="date"
                              value={demoDob}
                              onChange={(e) => setDemoDob(e.target.value)}
                              className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none transition-all"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="font-label-caps text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">Gender</label>
                            <select
                              value={demoGender}
                              onChange={(e) => setDemoGender(e.target.value)}
                              className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none transition-all"
                            >
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Consent checkbox (CRITICAL - checked default state is false) */}
                    <div className="flex items-start gap-3 p-4 bg-[#F7F5F0] rounded-xl border border-[#E5E7EB]/50">
                      <div className="flex items-center h-5">
                        <input
                          id="consent"
                          type="checkbox"
                          checked={consentChecked}
                          onChange={(e) => setConsentChecked(e.target.checked)}
                          className="w-5 h-5 rounded border-[#E5E7EB] text-[#0D4C2E] focus:ring-[#0D4C2E] cursor-pointer"
                        />
                      </div>
                      <label htmlFor="consent" className="text-xs text-[#404942] leading-tight cursor-pointer">
                        I confirm that the individual whose information I am submitting has explicitly consented to this identity verification in accordance with NDPR rules, and I authorize zero2v to search their NIMC record.
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={!isFormValid()}
                      className={`w-full h-14 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all duration-200 cursor-pointer ${
                        isFormValid()
                          ? 'bg-[#0D4C2E] text-white hover:bg-[#00341c]'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                      <span>Verify Identity</span>
                    </button>
                  </form>
                </div>
              </section>

              {/* Low Balance Warning Bar */}
              {balance < PRICING[activeTab] && (
                <div className="bg-[#ffdfa0] text-[#715300] border border-[#ffc641]/40 px-4 py-3 rounded-xl flex items-center justify-between gap-3 animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">warning</span>
                    <p className="text-xs font-semibold">
                      Insufficient balance (₦{balance}). Fund your wallet to complete this lookup.
                    </p>
                  </div>
                  <Link href="/wallet" className="text-xs font-bold underline hover:opacity-85 shrink-0">
                    Top Up
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* -------------------- VIEW 2: VERIFICATION RESULT VIEW -------------------- */}
          {viewState === 'result' && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl shadow-md border border-[#E5E7EB]/50 p-6 border-l-4 border-l-[#0D4C2E] relative overflow-hidden">
                <div className="absolute -top-4 -right-4 opacity-[0.03] pointer-events-none">
                  <span className="material-symbols-outlined text-[160px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    security
                  </span>
                </div>

                <div className="relative z-10 flex flex-col items-center sm:items-start gap-4">
                  {/* Circular Avatar Placeholder */}
                  <div className="w-16 h-16 rounded-full bg-[#0D4C2E]/10 flex items-center justify-center border border-[#0D4C2E]/20 text-[#0D4C2E] shrink-0">
                    <span className="material-symbols-outlined text-3xl">person</span>
                  </div>

                  {/* Info Blocks */}
                  <div className="flex-1 w-full space-y-4">
                    <div>
                      <h4 className="font-heading text-lg font-bold text-[#1A1A1A]">{resultData.fullName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2.5 py-0.5 bg-[#0D4C2E] text-white font-mono text-[10px] font-bold rounded">
                          NIN: {resultData.nin}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          Report ID: {resultData.reportId}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-b border-gray-100 py-3">
                      <div>
                        <span className="text-[#404942] uppercase text-[9px] block">DOB:</span>
                        <span className="font-semibold text-[#1A1A1A]">{resultData.dob}</span>
                      </div>
                      <div>
                        <span className="text-[#404942] uppercase text-[9px] block">Gender:</span>
                        <span className="font-semibold text-[#1A1A1A]">{resultData.gender}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-[#404942] uppercase text-[9px] block">Phone:</span>
                        <span className="font-semibold text-[#1A1A1A] font-mono">{resultData.phone}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-[#404942] uppercase text-[9px] block">State of Origin:</span>
                        <span className="font-semibold text-[#1A1A1A]">{resultData.state}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-[#404942] uppercase text-[9px] block">LGA:</span>
                        <span className="font-semibold text-[#1A1A1A]">{resultData.lga}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-[#404942] uppercase text-[9px] block">Town:</span>
                        <span className="font-semibold text-[#1A1A1A]">{resultData.town}</span>
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className="text-[#404942] uppercase text-[9px] block">Residential Address:</span>
                      <p className="font-semibold text-[#1A1A1A] mt-0.5 leading-normal">{resultData.residence}</p>
                    </div>

                    <div className="text-xs border-t border-gray-100 pt-3">
                      <span className="text-[#404942] uppercase text-[9px] block">Birth Information:</span>
                      <p className="font-semibold text-[#1A1A1A] mt-0.5">
                        Country: {resultData.birthCountry} · State: {resultData.birthState} · LGA: {resultData.birthLga}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono italic pt-2">
                      <span>Consent Recorded: {resultData.consentTime}</span>
                      <span>Saved to History</span>
                    </div>

                    {/* Actions row */}
                    <div className="pt-4 flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => alert(`Downloading PDF sheet for ${resultData.fullName}`)}
                        className="flex-grow h-12 bg-[#D4A017] hover:bg-[#ffc641] text-[#715300] font-label-caps text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-md flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        <span>Download PDF Result</span>
                      </button>
                      
                      <button
                        onClick={handleReset}
                        className="flex-grow h-12 border border-[#0D4C2E] hover:bg-[#0D4C2E]/5 text-[#0D4C2E] font-label-caps text-xs font-bold rounded-xl cursor-pointer transition-colors text-center"
                      >
                        Verify Another
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* -------------------- VIEW 3: WALLET GATE INTERSTITIAL STATE -------------------- */}
          {viewState === 'gate' && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl shadow-md border border-[#E5E7EB]/50 p-12 text-center space-y-6">
                <span className="material-symbols-outlined text-5xl text-red-500 font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                  credit_card
                </span>
                
                <div className="space-y-2">
                  <h2 className="font-heading text-lg font-bold text-red-600">Insufficient Balance</h2>
                  <p className="text-xs text-[#404942] leading-normal max-w-sm mx-auto">
                    Your wallet is empty (₦0). Please fund your wallet to look up records or start modifications.
                  </p>
                </div>

                <div className="pt-2">
                  <Link href="/wallet" className="block w-full max-w-xs mx-auto">
                    <button className="w-full h-12 bg-[#D4A017] hover:bg-[#ffc641] text-[#715300] font-label-caps text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-md">
                      Fund Wallet
                    </button>
                  </Link>
                </div>

                {/* Inline Pricing Details bottom sheet simulation */}
                <div className="border-t border-gray-100 pt-6 text-left max-w-sm mx-auto space-y-3">
                  <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Service Fee Reference</h3>
                  <div className="divide-y divide-gray-100 text-xs">
                    <div className="flex justify-between py-1.5">
                      <span className="text-[#404942]">NIN Verification:</span>
                      <span className="font-bold text-[#1A1A1A]">₦150</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-[#404942]">NIN Phone Search:</span>
                      <span className="font-bold text-[#1A1A1A]">₦250</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-[#404942]">NIN Tracking Search:</span>
                      <span className="font-bold text-[#1A1A1A]">₦200</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-[#404942]">NIN Demographics:</span>
                      <span className="font-bold text-[#1A1A1A]">₦250</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </LayoutShell>
  );
}
