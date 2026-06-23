'use client';

import * as React from 'react';
import { ConsentCheckbox } from './ConsentCheckbox';

interface DemographyFormProps {
  onSuccess: (data: any) => void;
  onError: (msg: string) => void;
  onLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

export function DemographyForm({ onSuccess, onError, onLoading, isLoading }: DemographyFormProps) {
  const [firstname, setFirstname] = React.useState('');
  const [lastname, setLastname] = React.useState('');
  const [gender, setGender] = React.useState('M');
  const [dob, setDob] = React.useState('');
  const [consent, setConsent] = React.useState(false);

  const isValid = firstname.length >= 2 && lastname.length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(dob) && consent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    onLoading(true);
    try {
      const res = await fetch('/api/verify/nin-demography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstname, lastname, gender, dob, consent }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Search failed');
      }

      onSuccess({
        fullName: `${data.firstname || ''} ${data.middlename || ''} ${data.surname || ''}`.trim() || 'N/A',
        nin: data.nin,
        reportId: data.reportID,
        dob: data.birthdate || dob,
        gender: data.gender || gender,
        phone: data.telephoneno,
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
      setFirstname('');
      setLastname('');
      setDob('');
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
        <span className="text-xs font-bold text-[#0D4C2E] tracking-wider uppercase">Demography Match</span>
        <div className="bg-[#D4A017] text-[#1A1A1A] text-xs font-bold px-2.5 py-1 rounded-md">
          ₦250 / lookup
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">
            First Name
          </label>
          <input
            type="text"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none text-sm text-[#1c1b1b]"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">
            Last Name
          </label>
          <input
            type="text"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none text-sm text-[#1c1b1b]"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">
            Gender
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none text-sm text-[#1c1b1b]"
            disabled={isLoading}
          >
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">
            Date of Birth
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none text-sm text-[#1c1b1b]"
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
        {isLoading ? 'Searching...' : 'Search Records'}
      </button>
    </form>
  );
}
