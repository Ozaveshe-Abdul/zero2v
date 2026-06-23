'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';

interface ResultData {
  fullName: string;
  nin?: string;
  reportId?: string;
  dob?: string;
  gender?: string;
  phone?: string;
  state?: string;
  lga?: string;
  town?: string;
  residence?: string;
  birthCountry?: string;
  birthState?: string;
  birthLga?: string;
  consentTime?: string;
  photoBase64?: string;
  cost?: number;
}

interface ResultCardProps {
  data: ResultData;
  onReset: () => void;
}

export function ResultCard({ data, onReset }: ResultCardProps) {
  const handleDownloadPDF = () => {
    alert('PDF Export coming soon!');
    // This will connect to src/lib/pdfExport.ts in Phase 8
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      <button
        onClick={onReset}
        className="text-[#0D4C2E] text-sm font-bold flex items-center gap-1 hover:underline"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        New Lookup
      </button>

      <Card className="relative overflow-hidden bg-white border border-[#E5E7EB] shadow-md rounded-xl p-0">
        {/* Left Green Accent Stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0D4C2E]"></div>

        <div className="p-6 md:p-8 space-y-6 ml-1.5">
          {/* Header section */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 shrink-0 rounded-full bg-[#F7F5F0] border border-[#E5E7EB] flex items-center justify-center overflow-hidden">
              {data.photoBase64 ? (
                <img src={`data:image/jpeg;base64,${data.photoBase64}`} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-3xl text-[#0D4C2E]">person</span>
              )}
            </div>
            <div className="space-y-1">
              <h2 className="font-heading font-bold text-lg md:text-xl text-[#1A1A1A] uppercase">
                {data.fullName}
              </h2>
              {data.nin && (
                <div className="inline-flex items-center px-2 py-0.5 bg-[#0D4C2E] text-white text-xs font-mono font-medium rounded">
                  NIN: {data.nin}
                </div>
              )}
              {data.reportId && (
                <div className="text-[10px] font-mono text-[#707971] tracking-tight mt-1">
                  ID: {data.reportId}
                </div>
              )}
            </div>
          </div>

          <hr className="border-[#E5E7EB]" />

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
            <div>
              <div className="text-[10px] font-bold text-[#707971] uppercase tracking-wider mb-0.5">DOB</div>
              <div className="text-[#1A1A1A]">{data.dob || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#707971] uppercase tracking-wider mb-0.5">Gender</div>
              <div className="text-[#1A1A1A]">{data.gender || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#707971] uppercase tracking-wider mb-0.5">Phone</div>
              <div className="text-[#1A1A1A] font-mono">{data.phone || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#707971] uppercase tracking-wider mb-0.5">State</div>
              <div className="text-[#1A1A1A]">{data.state || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#707971] uppercase tracking-wider mb-0.5">LGA</div>
              <div className="text-[#1A1A1A]">{data.lga || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#707971] uppercase tracking-wider mb-0.5">Town</div>
              <div className="text-[#1A1A1A]">{data.town || '—'}</div>
            </div>
          </div>

          <hr className="border-[#E5E7EB]" />

          {/* Residence */}
          {data.residence && (
            <div>
              <div className="text-[10px] font-bold text-[#707971] uppercase tracking-wider mb-0.5">Residence</div>
              <div className="text-[#1A1A1A] text-sm leading-snug">{data.residence}</div>
            </div>
          )}

          {/* Birth Info */}
          <div className="bg-[#F7F5F0] rounded-lg p-3 text-xs border border-[#E5E7EB]/50">
            <div className="text-[10px] font-bold text-[#707971] uppercase tracking-wider mb-1.5">Birth Information</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span><span className="text-[#707971]">Country:</span> {data.birthCountry || '—'}</span>
              <span><span className="text-[#707971]">State:</span> {data.birthState || '—'}</span>
              <span><span className="text-[#707971]">LGA:</span> {data.birthLga || '—'}</span>
            </div>
          </div>

          {/* Footer Status */}
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0D4C2E]">
              <span className="material-symbols-outlined text-[16px] text-[#059669]">check_circle</span>
              Verified · ₦{data.cost || 150} Deducted
            </div>
            {data.consentTime && (
              <div className="text-[10px] text-[#707971]">
                Consent recorded: {data.consentTime}
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <p className="text-xs text-center text-[#707971] italic flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[14px]">history</span>
          Saved to your History automatically
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-1">
          <button
            onClick={handleDownloadPDF}
            className="flex-1 h-12 bg-[#D4A017] text-[#1A1A1A] font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-[#b88a14] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">download</span>
            Download PDF
          </button>
          <button
            onClick={onReset}
            className="flex-1 h-12 bg-white border border-[#0D4C2E] text-[#0D4C2E] font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-[#0D4C2E]/5 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">search</span>
            Verify Another
          </button>
        </div>
      </div>
    </div>
  );
}
