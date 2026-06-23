'use client';

import * as React from 'react';
import { ConsentCheckbox } from './ConsentCheckbox';

interface NINPhoneFormProps {
  onSuccess: (data: any) => void;
  onError: (msg: string) => void;
  onLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

export function NINPhoneForm({ onSuccess, onError, onLoading, isLoading }: NINPhoneFormProps) {
  const [phone, setPhone] = React.useState('');
  const [consent, setConsent] = React.useState(false);

  const isValid = phone.length === 11 && /^(070|080|081|090|091)\d{8}$/.test(phone) && consent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    onLoading(true);
    try {
      const res = await fetch('/api/verify/nin-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, consent }),
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
        phone: data.telephoneno || phone,
        state: data.residence_state,
        lga: data.residence_lga,
        town: data.residence_Town,
        residence: data.residence_AdressLine1,
        birthCountry: data.birthcountry,
        birthState: data.birthstate,
        birthLga: data.birthlga,
        photoBase64: data.photo,
        cost: 250,
      });
      setPhone('');
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
        <span className="text-xs font-bold text-[#0D4C2E] tracking-wider uppercase">Phone Search</span>
        <div className="bg-[#D4A017] text-[#1A1A1A] text-xs font-bold px-2.5 py-1 rounded-md">
          ₦250 / lookup
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">
          Phone Number
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="080XXXXXXXX"
            className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] transition-all outline-none text-sm font-mono tracking-widest text-[#1c1b1b]"
            disabled={isLoading}
          />
        </div>
      </div>

      <hr className="border-[#E5E7EB] my-2" />

      <ConsentCheckbox checked={consent} onChange={setConsent} disabled={isLoading} />

      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full h-12 bg-[#0D4C2E] text-white font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-[#00341c] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? 'Searching...' : 'Search by Phone'}
      </button>
    </form>
  );
}
