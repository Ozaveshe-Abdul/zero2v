'use client';

import * as React from 'react';
import { ConsentCheckbox } from '../verify/ConsentCheckbox';

interface OrderFormProps {
  balance: number;
  onOrderComplete: () => void;
}

const SERVICES = [
  { id: 'nin_validation', label: 'NIN Validation', cost: 6000, desc: 'Validate NIN digits and date of birth' },
  { id: 'nin_name_modification', label: 'Name Modification', cost: 16000, desc: 'Update your name on NIMC record' },
  { id: 'nin_phone_modification', label: 'Phone Modification', cost: 16000, desc: 'Update your phone number on NIMC record' },
  { id: 'nin_address_modification', label: 'Address Modification', cost: 16000, desc: 'Update your address on NIMC record' }
];

export function OrderForm({ balance, onOrderComplete }: OrderFormProps) {
  const [serviceType, setServiceType] = React.useState(SERVICES[1].id);
  const [nin, setNin] = React.useState('');
  const [consent, setConsent] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Dynamic fields
  const [payload, setPayload] = React.useState<Record<string, string>>({});

  const selectedService = SERVICES.find(s => s.id === serviceType)!;
  const isTooExpensive = balance < selectedService.cost;
  const isValid = nin.length === 11 && consent && !isTooExpensive;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    if (!confirm(`Your wallet will be charged ₦${selectedService.cost.toLocaleString()}.\nProceed with order?`)) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_type: serviceType, nin, consent, ...payload })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`Order submitted successfully!\nReference: ${data.reference}`);
      onOrderComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayloadChange = (key: string, value: string) => {
    setPayload(prev => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {error && (
        <div className="bg-[#DC2626]/10 text-[#DC2626] text-sm font-semibold p-4 rounded-xl border border-[#DC2626]/20">
          {error}
        </div>
      )}

      {/* Service Selection */}
      <div className="space-y-3">
        {SERVICES.map(s => {
          const isSelected = serviceType === s.id;
          return (
            <label key={s.id} className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-[#0D4C2E] bg-[#0D4C2E]/5' : 'border-[#E5E7EB] bg-white hover:border-[#0D4C2E]/30'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#0D4C2E]' : 'border-[#E5E7EB]'}`}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#0D4C2E]"></div>}
                  </div>
                  <span className="font-bold text-[#1A1A1A]">{s.label}</span>
                </div>
                <span className="font-mono font-bold text-[#0D4C2E]">₦{s.cost.toLocaleString()}</span>
              </div>
              <p className="text-xs text-[#707971] ml-8 mt-1">{s.desc}</p>
            </label>
          )
        })}
      </div>

      <hr className="border-[#E5E7EB]" />

      {/* Dynamic Fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">NIN Number</label>
          <input
            type="text" value={nin} onChange={(e) => setNin(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="11-digit NIN" disabled={isLoading} required
            className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#0D4C2E]/20 outline-none text-sm font-mono"
          />
        </div>

        {serviceType === 'nin_validation' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">Date of Birth</label>
            <input type="date" onChange={e => handlePayloadChange('dob', e.target.value)} required disabled={isLoading} className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl outline-none" />
          </div>
        )}

        {(serviceType === 'nin_name_modification' || serviceType === 'nin_address_modification' || serviceType === 'nin_phone_modification') && (
           <div className="space-y-1.5">
             <label className="block text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">New Value (Name, Address, or Phone)</label>
             <input type="text" onChange={e => handlePayloadChange('new_value', e.target.value)} required disabled={isLoading} className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl outline-none" placeholder="Enter the corrected value" />
           </div>
        )}
      </div>

      {/* Warning Card */}
      <div className="bg-[#D97706]/10 border-l-4 border-[#D97706] p-4 rounded-r-xl">
        <h3 className="text-[#92400E] font-bold text-sm">⚠ Immediate Deduction</h3>
        <p className="text-[#92400E]/80 text-xs mt-1 leading-relaxed">
          Your wallet will be charged ₦{selectedService.cost.toLocaleString()} immediately upon submission. Processing takes 24–48 hours. Rejected orders are refunded automatically.
        </p>
      </div>

      <ConsentCheckbox checked={consent} onChange={setConsent} disabled={isLoading} label="I confirm I am authorized to submit this modification request." />

      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full h-12 bg-[#0D4C2E] text-white font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-[#00341c] active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {isLoading ? 'Submitting...' : 'Review & Submit'}
      </button>

    </form>
  )
}
