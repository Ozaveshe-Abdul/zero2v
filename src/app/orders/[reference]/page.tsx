'use client';

import * as React from 'react';
import Link from 'next/link';
import LayoutShell from '@/components/layout/LayoutShell';

export default function OrderDetailsPage({ params }: { params: Promise<{ reference: string }> }) {
  // Unwrap parameters
  const resolvedParams = React.use(params);
  const reference = resolvedParams.reference;

  return (
    <LayoutShell>
      <div className="space-y-6 max-w-xl mx-auto">
        <div className="flex items-center gap-2">
          <Link href="/orders" className="text-[#0D4C2E] hover:underline flex items-center text-xs font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Orders</span>
          </Link>
        </div>

        <section className="bg-white rounded-2xl shadow-md border border-[#E5E7EB]/50 p-6 space-y-6">
          <div className="flex justify-between items-start border-b border-gray-100 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400">Order Reference</span>
              <h2 className="font-mono text-lg font-bold text-[#1A1A1A] mt-0.5">{reference}</h2>
            </div>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Processing
            </span>
          </div>

          <div className="space-y-4">
            <h3 className="font-label-caps text-xs font-bold text-[#404942] uppercase tracking-wider">Order Specifications</h3>

            <div className="bg-[#fcf9f8] p-4 rounded-xl space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span className="text-[#404942]">Service Type:</span>
                <span className="text-[#1A1A1A] font-bold">NIN Name Modification</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span className="text-[#404942]">Submitted Date:</span>
                <span className="text-[#1A1A1A] font-bold">18 Jun 2026, 14:20</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span className="text-[#404942]">Total Paid:</span>
                <span className="text-[#1A1A1A] font-bold">₦16,000.00</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span className="text-[#404942]">NIN Number:</span>
                <span className="text-[#1A1A1A] font-bold">12345678901</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span className="text-[#404942]">Current Surname:</span>
                <span className="text-[#1A1A1A] font-bold">ADEBAYO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#404942]">New Surname:</span>
                <span className="text-[#1A1A1A] font-bold">OLUMIDE-ADEBAYO</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => alert(`Receipt downloaded for ${reference}`)}
              className="w-full h-12 bg-[#0D4C2E] hover:bg-[#00341c] text-white font-label-caps text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Download PDF Receipt</span>
            </button>

            <button
              onClick={() => alert('Refreshing order verification status...')}
              className="w-full h-12 border border-[#0D4C2E] hover:bg-[#0D4C2E]/5 text-[#0D4C2E] font-label-caps text-xs font-bold rounded-xl cursor-pointer transition-colors text-center"
            >
              Refresh Status
            </button>
          </div>
        </section>
      </div>
    </LayoutShell>
  );
}
