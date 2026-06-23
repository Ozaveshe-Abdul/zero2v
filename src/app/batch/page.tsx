'use client';

import * as React from 'react';
import LayoutShell from '@/components/layout/LayoutShell';
import { BatchInput } from '@/components/batch/BatchInput';
import { BatchProgress } from '@/components/batch/BatchProgress';

type ViewState = 'input' | 'progress';

export default function BatchPage() {
  const [viewState, setViewState] = React.useState<ViewState>('input');
  const [batchId, setBatchId] = React.useState<string | null>(null);
  const [balance, setBalance] = React.useState(5000);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    // Fetch wallet balance
    fetch('/api/balance')
      .then(res => res.json())
      .then(data => {
        if (data.balance !== undefined) setBalance(data.balance);
      })
      .catch(console.error);
  }, []);

  const handleStartJob = async (endpoint: string, items: any[]) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/batch/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, consent: true }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to start batch');

      setBatchId(data.batch_id);
      setViewState('progress');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setViewState('input');
    setBatchId(null);
  };

  return (
    <LayoutShell>
      <div className="max-w-3xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#0D4C2E]">Batch Mode</h1>
            <p className="text-sm text-[#707971] mt-1">Verify multiple identities sequentially.</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#E5E7EB] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
            <span className="text-xs font-bold font-mono tracking-wider text-[#1A1A1A]">
              ₦ {balance.toLocaleString()}
            </span>
          </div>
        </div>

        {viewState === 'input' ? (
          <BatchInput onStartJob={handleStartJob} isLoading={isSubmitting} balance={balance} />
        ) : (
          batchId && <BatchProgress batchId={batchId} onReset={handleReset} />
        )}
      </div>
    </LayoutShell>
  );
}
