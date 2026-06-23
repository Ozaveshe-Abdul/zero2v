'use client';

import * as React from 'react';
import Link from 'next/link';
import LayoutShell from '@/components/layout/LayoutShell';

type BatchState = 'input' | 'processing' | 'complete';
type EndpointType = 'nin' | 'phone' | 'tracking' | 'demographics';

interface BatchItem {
  id: string;
  identifier: string;
  status: 'pending' | 'success' | 'failed';
  resultName?: string;
  error?: string;
}

export default function BatchPage() {
  const [batchState, setBatchState] = React.useState<BatchState>('input');
  const [endpoint, setEndpoint] = React.useState<EndpointType>('nin');
  const [inputText, setInputText] = React.useState('');
  const [consentChecked, setConsentChecked] = React.useState(false);
  const [balance, setBalance] = React.useState(5000);

  // Running progress state
  const [items, setItems] = React.useState<BatchItem[]>([]);
  const [completedCount, setCompletedCount] = React.useState(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Pricing (No BVN endpoints)
  const PRICING = {
    nin: 150,
    phone: 250,
    tracking: 200,
    demographics: 250,
  };

  const ENDPOINT_LABELS = {
    nin: 'NIN Verification (₦150/each)',
    phone: 'NIN Phone Search (₦250/each)',
    tracking: 'NIN Tracking Lookup (₦200/each)',
    demographics: 'NIN Demographics Lookup (₦250/each)',
  };

  // Parsing input items (one per line, filter empty)
  const getParsedItems = () => {
    return inputText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  };

  const parsedCount = getParsedItems().length;
  const totalCost = parsedCount * PRICING[endpoint];
  const hasSubstantialBalance = balance >= totalCost;

  const isStartDisabled = parsedCount === 0 || !consentChecked || !hasSubstantialBalance;

  // Handle start batch execution simulation
  const handleStartBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStartDisabled) return;

    // Deduct total reserved cost upfront
    setBalance((prev) => prev - totalCost);

    // Prepare items list
    const parsedList = getParsedItems();
    const batchItems: BatchItem[] = parsedList.map((item, idx) => ({
      id: `item-${idx}`,
      identifier: item,
      status: 'pending',
    }));

    setItems(batchItems);
    setCompletedCount(0);
    setBatchState('processing');

    // Simulate processing item by item with delay
    let currentIdx = 0;
    const processNextItem = () => {
      if (currentIdx >= batchItems.length) {
        setBatchState('complete');
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      setItems((prev) => {
        const next = [...prev];
        // Simulate 90% success, 10% fail
        const isSuccess = Math.random() > 0.1;
        next[currentIdx] = {
          ...next[currentIdx],
          status: isSuccess ? 'success' : 'failed',
          resultName: isSuccess ? `JOHN ADEBAYO ${currentIdx + 1}` : undefined,
          error: isSuccess ? undefined : 'Registry record not found',
        };
        return next;
      });

      currentIdx++;
      setCompletedCount(currentIdx);
    };

    timerRef.current = setInterval(processNextItem, 1200);
  };

  // Clean up timers on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const successCount = items.filter((i) => i.status === 'success').length;
  const failedCount = items.filter((i) => i.status === 'failed').length;
  const pendingCount = items.filter((i) => i.status === 'pending').length;

  return (
    <LayoutShell>
      <div className="space-y-6">
        {/* Header section */}
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#0D4C2E]">Batch Operations</h1>
          <p className="text-xs text-[#404942] mt-1">Bulk Identity verification via sequential queues</p>
        </div>

        {/* -------------------- STATE 1: BATCH INPUT FORM -------------------- */}
        {batchState === 'input' && (
          <div className="max-w-xl mx-auto w-full">
            <section className="bg-white rounded-2xl shadow-md border border-[#E5E7EB]/50 p-6 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 opacity-[0.03] pointer-events-none">
                <span className="material-symbols-outlined text-[160px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  layers
                </span>
              </div>

              <form onSubmit={handleStartBatch} className="relative z-10 space-y-6">
                {/* Endpoint selection dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">
                    Select Endpoint Service
                  </label>
                  <select
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value as EndpointType)}
                    className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none"
                  >
                    <option value="nin">{ENDPOINT_LABELS.nin}</option>
                    <option value="phone">{ENDPOINT_LABELS.phone}</option>
                    <option value="tracking">{ENDPOINT_LABELS.tracking}</option>
                    <option value="demographics">{ENDPOINT_LABELS.demographics}</option>
                  </select>
                </div>

                {/* Input Textarea Mode */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="font-label-caps text-xs font-bold text-[#404942] uppercase tracking-wider">
                      Paste List (one per line)
                    </label>
                    <span className="bg-[#0D4C2E]/10 text-[#0D4C2E] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {parsedCount} items detected
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      endpoint === 'nin'
                        ? '12345678901\n98765432100\n...'
                        : endpoint === 'phone'
                        ? '08012345678\n09087654321\n...'
                        : 'TRACK11893\nTRACK22894\n...'
                    }
                    className="w-full bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl p-4 font-mono text-sm tracking-wide focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none resize-none"
                  />
                </div>

                {/* Pricing / Wallet status strips */}
                {parsedCount > 0 && (
                  <div
                    className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold ${
                      hasSubstantialBalance
                        ? 'bg-[#0D4C2E]/5 border-[#0D4C2E]/20 text-[#0D4C2E]'
                        : 'bg-red-50 border-red-200 text-[#DC2626]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">
                        {hasSubstantialBalance ? 'check_circle' : 'error'}
                      </span>
                      <span>
                        Total Cost: ₦{totalCost.toLocaleString()} (Bal: ₦{balance.toLocaleString()})
                      </span>
                    </div>
                    {!hasSubstantialBalance && (
                      <Link href="/wallet" className="underline font-bold hover:opacity-80">
                        Fund Wallet
                      </Link>
                    )}
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
                    I confirm all {parsedCount || 'listed'} individuals have explicitly consented to this lookup validation under NDPR guidelines.
                  </label>
                </div>

                {/* Start Button */}
                <button
                  type="submit"
                  disabled={isStartDisabled}
                  className={`w-full h-14 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all duration-200 cursor-pointer ${
                    isStartDisabled
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                      : 'bg-[#0D4C2E] text-white hover:bg-[#00341c]'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    play_arrow
                  </span>
                  <span>Start Batch Job</span>
                </button>
              </form>
            </section>
          </div>
        )}

        {/* -------------------- STATE 2: RUNNING BATCH PROGRESS -------------------- */}
        {(batchState === 'processing' || batchState === 'complete') && (
          <div className="max-w-xl mx-auto w-full space-y-6">
            <section className="bg-white rounded-2xl shadow-md border border-[#E5E7EB]/50 p-6 relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                {/* Header state */}
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-[#0D4C2E] flex items-center gap-2">
                      {batchState === 'processing' ? (
                        <>
                          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
                          <span>Processing Batch...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-green-500 text-xl font-bold">check_circle</span>
                          <span>Batch Completed</span>
                        </>
                      )}
                    </h2>
                    <p className="text-xs text-[#404942] mt-0.5">
                      Service: {ENDPOINT_LABELS[endpoint].split(' (')[0]} · {items.length} items
                    </p>
                  </div>

                  <span className="text-xs font-bold text-[#D4A017] bg-[#D4A017]/10 px-3 py-1 rounded-full">
                    {completedCount} of {items.length} done
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-[#D4A017] transition-all duration-300 rounded-full"
                    style={{ width: `${(completedCount / items.length) * 100}%` }}
                  ></div>
                </div>

                {/* Status counts widgets */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#0D4C2E]/5 p-2 rounded-xl border border-[#0D4C2E]/10">
                    <p className="text-[10px] font-bold text-[#0D4C2E] uppercase">Success</p>
                    <p className="text-lg font-bold text-[#0D4C2E]">{successCount}</p>
                  </div>
                  <div className="bg-red-50 p-2 rounded-xl border border-red-100">
                    <p className="text-[10px] font-bold text-red-600 uppercase">Failed</p>
                    <p className="text-lg font-bold text-red-600">{failedCount}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Pending</p>
                    <p className="text-lg font-bold text-gray-500">{pendingCount}</p>
                  </div>
                </div>

                {/* Processing list details */}
                <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-xl pr-2 no-scrollbar">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 text-xs">
                      <div className="flex items-center gap-2">
                        {item.status === 'pending' && (
                          <span className="material-symbols-outlined text-gray-300 animate-spin text-[16px]">
                            sync
                          </span>
                        )}
                        {item.status === 'success' && (
                          <span className="material-symbols-outlined text-green-500 text-[16px] font-bold">
                            check_circle
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <span className="material-symbols-outlined text-red-500 text-[16px] font-bold">
                            cancel
                          </span>
                        )}

                        <span className="font-mono text-gray-600">{item.identifier}</span>
                      </div>

                      <div className="text-right">
                        {item.status === 'success' && (
                          <span className="text-green-700 font-bold">{item.resultName}</span>
                        )}
                        {item.status === 'failed' && <span className="text-red-500 font-medium">{item.error}</span>}
                        {item.status === 'pending' && <span className="text-gray-400 font-medium">Queued...</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Simulated processing message */}
                {batchState === 'processing' && (
                  <p className="text-[11px] text-[#404942] italic text-center leading-normal">
                    📁 Safe to leave this page; the process will complete server-side and automatically log records.
                  </p>
                )}

                {/* Action buttons (Complete vs partial) */}
                <div className="flex flex-col gap-2">
                  {batchState === 'processing' ? (
                    <button
                      onClick={() => alert('Simulating downloading partial CSV data')}
                      className="w-full h-12 border border-[#D4A017] text-[#795900] hover:bg-[#D4A017]/5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                    >
                      Download Partial CSV
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => alert('Simulating downloading full CSV report')}
                        className="w-full h-12 bg-[#0D4C2E] text-white hover:bg-[#00341c] font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        <span>Download Results (CSV)</span>
                      </button>

                      <button
                        onClick={() => setBatchState('input')}
                        className="w-full h-12 border border-[#0D4C2E] text-[#0D4C2E] hover:bg-[#0D4C2E]/5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                      >
                        Start Another Batch
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </LayoutShell>
  );
}
