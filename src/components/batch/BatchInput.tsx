'use client';

import * as React from 'react';
import { ConsentCheckbox } from '../verify/ConsentCheckbox';

interface BatchInputProps {
  onStartJob: (endpoint: string, payload: any[]) => void;
  isLoading: boolean;
  balance: number;
}

const ENDPOINTS = [
  { id: 'nin-verification', label: 'NIN Verification', cost: 150, desc: '11 digits' },
  { id: 'nin-phone', label: 'Phone Search', cost: 250, desc: '080XXXXXXXX' },
  { id: 'nin-tracking', label: 'Tracking ID', cost: 200, desc: 'Alphanumeric' }
];

export function BatchInput({ onStartJob, isLoading, balance }: BatchInputProps) {
  const [endpoint, setEndpoint] = React.useState(ENDPOINTS[0].id);
  const [rawText, setRawText] = React.useState('');
  const [consent, setConsent] = React.useState(false);

  const selectedEndpoint = ENDPOINTS.find(e => e.id === endpoint)!;

  // Simple string split for MVP (could be CSV parse logic)
  const items = rawText
    .split('\n')
    .map(t => t.trim())
    .filter(t => t.length > 0);

  const totalCost = items.length * selectedEndpoint.cost;
  const isTooExpensive = totalCost > balance;
  const isValid = items.length > 0 && items.length <= 50 && consent && !isTooExpensive;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    // Map raw lines to the correct API payload key
    const payload = items.map(item => {
      if (endpoint === 'nin-verification') return { nin: item };
      if (endpoint === 'nin-phone') return { phone: item };
      if (endpoint === 'nin-tracking') return { tracking_id: item };
      return {};
    });

    onStartJob(endpoint, payload);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-md border border-[#E5E7EB] space-y-6">

      {/* Endpoint Selector */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">
          Select Lookup Type
        </label>
        <div className="relative">
          <select
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            disabled={isLoading}
            className="w-full h-12 px-4 appearance-none bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none text-sm font-bold text-[#1A1A1A]"
          >
            {ENDPOINTS.map(e => (
              <option key={e.id} value={e.id}>{e.label} — ₦{e.cost} per item</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#707971]">
            expand_more
          </span>
        </div>
      </div>

      {/* Input Area */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-end ml-1 mb-1">
          <label className="block text-xs font-bold text-[#404942] uppercase tracking-wider">
            Paste Identifiers
          </label>
          <span className="text-[10px] font-mono text-[#707971] bg-[#F7F5F0] px-2 py-0.5 rounded border border-[#E5E7EB]">
            {items.length} / 50 Max
          </span>
        </div>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          disabled={isLoading}
          placeholder={`Paste one per line, e.g.\n${selectedEndpoint.desc}\n${selectedEndpoint.desc}`}
          className="w-full h-40 p-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none text-sm font-mono tracking-wider resize-none"
        ></textarea>
      </div>

      {/* Cost Preview */}
      {items.length > 0 && (
        <div className={`p-4 rounded-xl border ${isTooExpensive ? 'bg-[#DC2626]/10 border-[#DC2626]/30 text-[#DC2626]' : 'bg-[#0D4C2E]/5 border-[#0D4C2E]/20 text-[#0D4C2E]'}`}>
          <div className="flex justify-between items-center font-bold text-sm">
            <span>Total Cost ({items.length} items)</span>
            <span className="font-mono text-lg">₦{totalCost.toLocaleString()}</span>
          </div>
          {isTooExpensive && (
            <p className="text-xs mt-1 font-semibold">
              Insufficient balance. You only have ₦{balance.toLocaleString()}.
            </p>
          )}
        </div>
      )}

      <hr className="border-[#E5E7EB]" />

      <ConsentCheckbox
        checked={consent}
        onChange={setConsent}
        disabled={isLoading || items.length === 0}
        label={`I confirm all ${items.length > 0 ? items.length : 'listed'} individuals have explicitly consented to this verification.`}
      />

      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full h-12 bg-[#0D4C2E] text-white font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-[#00341c] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             Queueing...
          </>
        ) : (
          'Start Batch Job'
        )}
      </button>
    </form>
  );
}
