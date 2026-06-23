'use client';

import * as React from 'react';
import { useBatchJob } from '@/hooks/useBatchJob';

export function BatchProgress({ batchId, onReset }: { batchId: string; onReset: () => void }) {
  const { job, error } = useBatchJob(batchId);

  if (error) {
    return (
      <div className="bg-[#DC2626]/10 p-6 rounded-xl text-center space-y-4">
        <span className="material-symbols-outlined text-[#DC2626] text-4xl">error</span>
        <h3 className="text-[#DC2626] font-bold">Failed to load batch</h3>
        <p className="text-sm text-[#707971]">{error}</p>
        <button onClick={onReset} className="text-[#0D4C2E] font-bold hover:underline text-sm">
          ← Start New Batch
        </button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-8 h-8 border-4 border-[#0D4C2E]/20 border-t-[#0D4C2E] rounded-full animate-spin"></div>
        <p className="text-sm text-[#707971] font-bold animate-pulse">Initializing Batch Engine...</p>
      </div>
    );
  }

  const processedCount = job.completed_items + job.failed_items;
  const progressPercent = Math.round((processedCount / job.total_items) * 100);
  const isDone = job.status === 'completed' || job.status === 'partial' || job.status === 'failed';

  return (
    <div className="bg-white rounded-2xl shadow-md border border-[#E5E7EB] p-6 md:p-8 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-heading font-bold text-lg text-[#1A1A1A] flex items-center gap-2">
            {isDone ? 'Batch Complete' : 'Batch Running'}
            {!isDone && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#059669] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#059669]"></span>
              </span>
            )}
          </h2>
          <p className="text-sm text-[#707971] mt-1">
            Endpoint: <span className="font-mono">{job.endpoint}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-[#0D4C2E]">
            {processedCount} <span className="text-[#707971] text-lg">/ {job.total_items}</span>
          </div>
          <p className="text-[10px] uppercase font-bold text-[#707971] tracking-wider mt-0.5">Items Processed</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-[#E5E7EB] rounded-full h-3 overflow-hidden flex">
           {/* Success Bar */}
           <div
            className="bg-[#059669] h-full transition-all duration-500 ease-out"
            style={{ width: `${(job.completed_items / job.total_items) * 100}%` }}
           ></div>
           {/* Fail Bar */}
           <div
            className="bg-[#DC2626] h-full transition-all duration-500 ease-out"
            style={{ width: `${(job.failed_items / job.total_items) * 100}%` }}
           ></div>
        </div>
        <div className="flex justify-between text-xs font-bold text-[#707971]">
          <span>{progressPercent}% Complete</span>
          <span className="text-[#059669]">{job.completed_items} Success</span>
          <span className="text-[#DC2626]">{job.failed_items} Failed</span>
        </div>
      </div>

      <hr className="border-[#E5E7EB]" />

      {/* Info / Logs block */}
      <div className="bg-[#F7F5F0] p-4 rounded-xl text-sm text-[#404942] space-y-2 font-mono">
        <div className="flex justify-between">
          <span>Total Cost Reserved:</span>
          <span>₦{job.total_cost.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Credits Refunded (Failed):</span>
          <span className="text-[#DC2626]">₦{(job.failed_items * (job.total_cost / job.total_items)).toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold text-[#0D4C2E] border-t border-[#E5E7EB] pt-2 mt-2">
          <span>Actual Cost:</span>
          <span>₦{(job.completed_items * (job.total_cost / job.total_items)).toLocaleString()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-2">
        {isDone ? (
          <>
            <button className="w-full h-12 bg-[#0D4C2E] text-white font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-[#00341c] flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">description</span>
              Download CSV Results
            </button>
            <button onClick={onReset} className="w-full h-12 bg-white text-[#0D4C2E] border border-[#0D4C2E] font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-[#F7F5F0] flex items-center justify-center gap-2">
              Start New Batch
            </button>
          </>
        ) : (
          <p className="text-center text-xs text-[#707971] italic py-2">
            Safe to leave this page. Running in background...
          </p>
        )}
      </div>

    </div>
  );
}
