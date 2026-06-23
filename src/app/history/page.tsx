'use client';

import * as React from 'react';
import Link from 'next/link';
import LayoutShell from '@/components/layout/LayoutShell';

interface HistoryItem {
  id: string;
  type: 'nin' | 'phone' | 'tracking' | 'demographics' | 'batch' | 'orders';
  label: string;
  identifier: string;
  dateTime: string;
  cost: number;
  status: 'success' | 'failed';
  expanded?: boolean;
  checked?: boolean;
  // Detail payload
  details?: {
    fullName: string;
    nin: string;
    reportId: string;
    dob: string;
    gender: string;
    phone: string;
    state: string;
    lga: string;
    town: string;
    residence: string;
    consentTime: string;
  };
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState<string>('all');
  const [bulkMode, setBulkMode] = React.useState(false);

  // Sample verification audit trails
  const [history, setHistory] = React.useState<HistoryItem[]>([
    {
      id: 'audit-1',
      type: 'nin',
      label: 'NIN Verification',
      identifier: 'NIN: 12345678901',
      dateTime: '13 Jun 2026 · 14:32',
      cost: 150,
      status: 'success',
      expanded: true, // Default expanded state in mockup view
      checked: false,
      details: {
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
        consentTime: '13 Jun 2026, 14:31',
      },
    },
    {
      id: 'audit-2',
      type: 'phone',
      label: 'NIN Phone Search',
      identifier: 'Phone: 08012345678',
      dateTime: '12 Jun 2026 · 11:15',
      cost: 250,
      status: 'success',
      checked: false,
      details: {
        fullName: 'SARAH CHINEYE OKEKE',
        nin: '98765432100',
        reportId: 'PHONE_849204_C91',
        dob: '08 Oct 1993',
        gender: 'Female',
        phone: '08012345678',
        state: 'Anambra',
        lga: 'Awka South',
        town: 'Awka',
        residence: '40 Zik Avenue, Awka, Anambra',
        consentTime: '12 Jun 2026, 11:14',
      },
    },
    {
      id: 'audit-3',
      type: 'tracking',
      label: 'NIN Tracking Search',
      identifier: 'Track ID: TRACK84920A',
      dateTime: '10 Jun 2026 · 09:40',
      cost: 200,
      status: 'success',
      checked: false,
    },
    {
      id: 'audit-4',
      type: 'demographics',
      label: 'NIN Demographics Search',
      identifier: 'Name: KABIRU ALIYU',
      dateTime: '08 Jun 2026 · 16:05',
      cost: 250,
      status: 'failed',
      checked: false,
    },
  ]);

  const handleToggleExpand = (id: string) => {
    setHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, expanded: !item.expanded } : item))
    );
  };

  const handleToggleCheck = (id: string) => {
    setHistory((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item));
      const hasChecked = next.some((item) => item.checked);
      setBulkMode(hasChecked);
      return next;
    });
  };

  const handleClearSelection = () => {
    setHistory((prev) => prev.map((item) => ({ ...item, checked: false })));
    setBulkMode(false);
  };

  const handleSelectAll = () => {
    setHistory((prev) => prev.map((item) => ({ ...item, checked: true })));
    setBulkMode(true);
  };

  const checkedCount = history.filter((i) => i.checked).length;

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.details?.fullName && item.details.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <LayoutShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-heading text-2xl font-bold text-[#0D4C2E]">Audit Trail History</h1>
            <p className="text-xs text-[#404942] mt-1">Export statement receipts and verify logged lookups</p>
          </div>
        </div>

        {/* Bulk Action Bar (Slides down from top when items checked) */}
        {bulkMode && (
          <div className="bg-[#0D4C2E] text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-md transition-all duration-300 animate-in slide-in-from-top">
            <div className="flex items-center gap-3">
              <button onClick={handleClearSelection} className="text-[#80bc95] hover:text-white cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
              <span className="text-xs font-bold font-mono">{checkedCount} selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => alert(`Bulk exporting PDF for ${checkedCount} items...`)}
                className="bg-[#D4A017] hover:bg-[#ffdfa0] text-[#715300] px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Export PDF
              </button>
              <button
                onClick={() => alert(`Bulk exporting CSV statement for ${checkedCount} items...`)}
                className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-white/10 transition-all cursor-pointer"
              >
                Export CSV
              </button>
            </div>
          </div>
        )}

        {/* Search Bar & Filter Options */}
        <div className="space-y-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707971] text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by NIN, phone, report ID or name..."
              className="w-full h-12 pl-12 pr-4 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none"
            />
          </div>

          {/* Horizontally scrollable pill filter layout */}
          <div className="flex overflow-x-auto gap-2 py-1 no-scrollbar">
            {[
              { id: 'all', label: 'All Operations' },
              { id: 'nin', label: 'NIN Verify' },
              { id: 'phone', label: 'NIN Phone' },
              { id: 'tracking', label: 'Tracking' },
              { id: 'demographics', label: 'Demographics' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full font-label-caps text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-[#0D4C2E] text-white shadow-sm'
                    : 'bg-white border border-[#E5E7EB] text-[#404942] hover:bg-[#F7F5F0]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* History Log Records List */}
        <section className="space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB]/50 p-12 text-center space-y-4">
              <span className="material-symbols-outlined text-5xl text-gray-300">history</span>
              <h3 className="font-bold text-[#1A1A1A]">No Records Found</h3>
              <p className="text-xs text-[#404942]">We couldn't find any transaction history matches for your filter selection.</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-[#E5E7EB]/50 overflow-hidden transition-all duration-300"
              >
                {/* Regular Row Summary Item */}
                <div className="flex items-center justify-between p-4 hover:bg-[#F7F5F0]/30 transition-colors">
                  <div className="flex items-center gap-3">
                    {/* Checkbox trigger selection */}
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleToggleCheck(item.id)}
                      className="w-4 h-4 rounded border-[#E5E7EB] text-[#0D4C2E] focus:ring-[#0D4C2E] cursor-pointer"
                    />

                    {/* Circular Icon badge */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center relative shrink-0 ${
                        item.type === 'nin' && 'bg-green-50 text-[#059669]'
                      } ${item.type === 'phone' && 'bg-blue-50 text-[#2563EB]'} ${
                        item.type === 'tracking' && 'bg-amber-50 text-[#D97706]'
                      } ${item.type === 'demographics' && 'bg-purple-50 text-purple-700'}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {item.type === 'nin' && 'fingerprint'}
                        {item.type === 'phone' && 'phone_android'}
                        {item.type === 'tracking' && 'track_changes'}
                        {item.type === 'demographics' && 'contacts'}
                      </span>
                      {/* Success / Failure micro status dot */}
                      <span
                        className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                          item.status === 'success' ? 'bg-[#059669]' : 'bg-[#DC2626]'
                        }`}
                      ></span>
                    </div>

                    <div>
                      <p onClick={() => handleToggleExpand(item.id)} className="font-bold text-[#1A1A1A] text-sm hover:underline cursor-pointer">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-[#404942] font-mono mt-0.5">{item.identifier}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{item.dateTime}</p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <div>
                      <span
                        className={`font-mono text-xs font-bold ${
                          item.status === 'success' ? 'text-[#DC2626]' : 'text-gray-400'
                        }`}
                      >
                        {item.status === 'success' ? `-₦${item.cost}` : '₦0 (Refunded)'}
                      </span>
                    </div>

                    {/* Collapsible toggle expand button */}
                    <button
                      onClick={() => handleToggleExpand(item.id)}
                      className="p-1 text-[#707971] hover:text-[#0D4C2E] cursor-pointer"
                    >
                      <span className="material-symbols-outlined transition-transform duration-200">
                        {item.expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Expanded Inline Result Card Details */}
                {item.expanded && item.details && (
                  <div className="border-t border-[#E5E7EB] bg-[#fcf9f8] p-5 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB]/50 p-4 border-l-4 border-l-[#0D4C2E] relative overflow-hidden">
                      <div className="absolute top-4 right-4 opacity-[0.03] pointer-events-none">
                        <span className="material-symbols-outlined text-[100px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          security
                        </span>
                      </div>

                      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-[#0D4C2E]/10 flex items-center justify-center border border-[#0D4C2E]/20 text-[#0D4C2E] shrink-0">
                          <span className="material-symbols-outlined text-3xl">person</span>
                        </div>

                        {/* Details grid columns */}
                        <div className="flex-1 space-y-4">
                          <div>
                            <h4 className="font-heading text-base font-bold text-[#1A1A1A]">{item.details.fullName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 bg-[#0D4C2E]/10 text-[#0D4C2E] font-mono text-[10px] font-bold rounded">
                                NIN: {item.details.nin}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                ID: {item.details.reportId}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-b border-gray-100 py-3">
                            <div>
                              <span className="text-[#404942] uppercase text-[9px] block">DOB:</span>
                              <span className="font-semibold text-[#1A1A1A]">{item.details.dob}</span>
                            </div>
                            <div>
                              <span className="text-[#404942] uppercase text-[9px] block">Gender:</span>
                              <span className="font-semibold text-[#1A1A1A]">{item.details.gender}</span>
                            </div>
                            <div className="mt-1">
                              <span className="text-[#404942] uppercase text-[9px] block">Phone:</span>
                              <span className="font-semibold text-[#1A1A1A] font-mono">{item.details.phone}</span>
                            </div>
                            <div className="mt-1">
                              <span className="text-[#404942] uppercase text-[9px] block">State of Origin:</span>
                              <span className="font-semibold text-[#1A1A1A]">{item.details.state}</span>
                            </div>
                          </div>

                          <div className="text-xs">
                            <span className="text-[#404942] uppercase text-[9px] block">Residential Address:</span>
                            <p className="font-semibold text-[#1A1A1A] mt-0.5 leading-normal">{item.details.residence}</p>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono italic pt-1">
                            <span>Consent: Recorded {item.details.consentTime}</span>
                            <span>Saved automatically</span>
                          </div>

                          {/* Detail download PDF button */}
                          <div className="pt-2 flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => alert(`Downloading PDF for ${item.details?.fullName}`)}
                              className="flex-grow h-10 bg-[#D4A017] hover:bg-[#ffc641] text-[#715300] font-label-caps text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[16px]">download</span>
                              <span>Download Result (PDF)</span>
                            </button>
                            <button
                              onClick={() => handleToggleExpand(item.id)}
                              className="px-4 h-10 border border-[#E5E7EB] hover:bg-gray-100 text-[#404942] font-label-caps text-xs rounded-lg cursor-pointer transition-colors text-center"
                            >
                              Collapse Card
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </section>

        {/* Load More Button */}
        {filteredHistory.length > 0 && (
          <div className="text-center pt-2">
            <button
              onClick={() => alert('Loading next 20 logged verification rows...')}
              className="px-6 py-2.5 bg-white border border-[#E5E7EB] hover:bg-[#F7F5F0] text-xs font-bold uppercase tracking-wider text-[#404942] rounded-xl transition-all cursor-pointer"
            >
              Load 20 More Records
            </button>
          </div>
        )}
      </div>
    </LayoutShell>
  );
}
