'use client';

import * as React from 'react';
import { ConsentCheckbox } from './ConsentCheckbox';

interface NINFormProps {
  onSuccess: (data: any) => void;
  onError: (msg: string) => void;
  onLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

export function NINForm({ onSuccess, onError, onLoading, isLoading }: NINFormProps) {
  const [nin, setNin] = React.useState('');
  const [consent, setConsent] = React.useState(false);

  const isValid = nin.length === 11 && /^\d+$/.test(nin) && consent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    onLoading(true);
    try {
      const res = await fetch('/api/verify/nin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nin, consent }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      onSuccess({
        fullName: `${data.firstname || ''} ${data.middlename || ''} ${data.surname || ''}`.trim() || 'N/A',
        nin: data.nin,
        reportId: data.reportID,
        dob: data.birthdate,
        gender: data.gender,
        phone: data.telephoneno,
        state: data.residence_state,
        lga: data.residence_lga,
        town: data.residence_Town,
        residence: data.residence_AdressLine1,
        birthCountry: data.birthcountry,
        birthState: data.birthstate,
        birthLga: data.birthlga,
        photoBase64: data.photo,
        cost: 150,
      });
      setNin('');
      setConsent(false);
    } catch (err: any) {
      onError(err.message);
    } finally {
      onLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold text-[#0D4C2E] tracking-wider uppercase">NIN Number Lookup</span>
        <div className="bg-[#D4A017] text-[#1A1A1A] text-xs font-bold px-2.5 py-1 rounded-md">
          ₦150 / lookup
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">
          NIN Number
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={nin}
            onChange={(e) => setNin(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="Enter 11-digit NIN"
            className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] transition-all outline-none text-sm font-mono tracking-widest text-[#1c1b1b]"
            disabled={isLoading}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#707971]">
            {nin.length}/11
          </div>
        </div>
      </div>

      <hr className="border-[#E5E7EB] my-2" />

      <ConsentCheckbox checked={consent} onChange={setConsent} disabled={isLoading} />

      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full h-12 bg-[#0D4C2E] text-white font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-[#00341c] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? 'Verifying...' : 'Verify NIN'}
      </button>
    </form>
  );
}
