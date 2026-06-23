'use client';

import * as React from 'react';
import Link from 'next/link';
import LayoutShell from '@/components/layout/LayoutShell';

type OrderTab = 'submit' | 'list';
type ServiceType = 'validation' | 'name' | 'phone' | 'address';

interface ModificationOrder {
  reference: string;
  serviceType: string;
  cost: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  date: string;
  details: Record<string, string>;
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = React.useState<OrderTab>('submit');
  const [service, setService] = React.useState<ServiceType>('name');
  const [balance, setBalance] = React.useState(25000);
  const [consentChecked, setConsentChecked] = React.useState(false);

  // Form input states
  const [nin, setNin] = React.useState('');
  const [currentSurname, setCurrentSurname] = React.useState('');
  const [currentFirstName, setCurrentFirstName] = React.useState('');
  const [newSurname, setNewSurname] = React.useState('');
  const [newFirstName, setNewFirstName] = React.useState('');
  const [phone, setPhone] = React.useState('');

  // Sample order listings data
  const [orders, setOrders] = React.useState<ModificationOrder[]>([
    {
      reference: 'ORD_948194_A72',
      serviceType: 'NIN Name Modification',
      cost: 16000,
      status: 'processing',
      date: '18 Jun 2026',
      details: {
        NIN: '12345678901',
        'Current Surname': 'ADEBAYO',
        'New Surname': 'OLUMIDE-ADEBAYO',
        Phone: '08012345678',
      },
    },
    {
      reference: 'ORD_291048_D81',
      serviceType: 'NIN Validation',
      cost: 6000,
      status: 'completed',
      date: '15 Jun 2026',
      details: {
        NIN: '98765432100',
        Status: 'Validation completed successfully by NIMC',
      },
    },
    {
      reference: 'ORD_104812_B11',
      serviceType: 'NIN Phone Modification',
      cost: 16000,
      status: 'rejected',
      date: '10 Jun 2026',
      details: {
        NIN: '55667788990',
        Reason: 'Signature mismatch on uploaded biometric documents.',
      },
    },
  ]);

  const PRICING = {
    validation: 6000,
    name: 16000,
    phone: 16000,
    address: 16000,
  };

  const getServiceLabel = (type: ServiceType) => {
    switch (type) {
      case 'validation':
        return 'NIN Validation';
      case 'name':
        return 'Name Modification';
      case 'phone':
        return 'Phone Modification';
      case 'address':
        return 'Address Modification';
    }
  };

  const isFormValid = () => {
    if (nin.length !== 11 || !consentChecked) return false;
    if (balance < PRICING[service]) return false;

    if (service === 'name') {
      return (
        currentSurname.trim().length > 0 &&
        currentFirstName.trim().length > 0 &&
        newSurname.trim().length > 0 &&
        newFirstName.trim().length > 0
      );
    }
    if (service === 'phone') {
      return phone.trim().length >= 10;
    }
    return true;
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    const cost = PRICING[service];
    setBalance((prev) => prev - cost);

    const ref = `ORD_${Math.floor(100000 + Math.random() * 900000)}_${Math.random().toString(36).substring(7).toUpperCase()}`;
    const newOrder: ModificationOrder = {
      reference: ref,
      serviceType: getServiceLabel(service),
      cost: cost,
      status: 'pending',
      date: 'Today',
      details: {
        NIN: nin,
        ...(service === 'name' && {
          'Current Surname': currentSurname,
          'New Surname': newSurname,
          'Current First Name': currentFirstName,
          'New First Name': newFirstName,
        }),
        ...(service === 'phone' && { Phone: phone }),
      },
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveTab('list');
    setConsentChecked(false);
    setNin('');
    setCurrentSurname('');
    setCurrentFirstName('');
    setNewSurname('');
    setNewFirstName('');
    setPhone('');
    alert(`Order submitted successfully! Reference: ${ref}`);
  };

  return (
    <LayoutShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-heading text-2xl font-bold text-[#0D4C2E]">Modification Orders</h1>
            <p className="text-xs text-[#404942] mt-1">Submit corrections and track validation requests</p>
          </div>
          {/* Balance chip top right */}
          <div className="bg-white px-4 py-2 rounded-full border border-[#E5E7EB] shadow-sm flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A]">
            <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
            <span>₦{balance.toLocaleString()}</span>
          </div>
        </div>

        {/* Tab selection bar */}
        <div className="w-full">
          <div className="flex border-b border-[#E5E7EB] gap-6 text-sm font-bold">
            <button
              onClick={() => setActiveTab('submit')}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'submit'
                  ? 'border-[#0D4C2E] text-[#0D4C2E]'
                  : 'border-transparent text-[#404942] hover:text-[#0D4C2E]'
              }`}
            >
              Submit Order
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'border-[#0D4C2E] text-[#0D4C2E]'
                  : 'border-transparent text-[#404942] hover:text-[#0D4C2E]'
              }`}
            >
              My Orders ({orders.length})
            </button>
          </div>
        </div>

        {/* -------------------- TAB 1: SUBMIT NEW ORDER FORM -------------------- */}
        {activeTab === 'submit' && (
          <div className="max-w-xl mx-auto w-full space-y-6">
            <section className="bg-white rounded-2xl shadow-md border border-[#E5E7EB]/50 p-6 relative overflow-hidden">
              {/* Watermark security lock silhouette */}
              <div className="absolute -top-4 -right-4 opacity-[0.03] pointer-events-none">
                <span className="material-symbols-outlined text-[160px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  edit_document
                </span>
              </div>

              <form onSubmit={handleOrderSubmit} className="relative z-10 space-y-6">
                {/* Service type radio cards selection */}
                <div className="space-y-3">
                  <h3 className="font-label-caps text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">
                    Select Service Type
                  </h3>
                  
                  <div className="space-y-2">
                    {/* NIN Validation card */}
                    <div
                      onClick={() => setService('validation')}
                      className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        service === 'validation'
                          ? 'border-[#0D4C2E] bg-[#0D4C2E]/5 ring-1 ring-[#0D4C2E]'
                          : 'border-[#E5E7EB] hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`material-symbols-outlined text-xl ${
                            service === 'validation' ? 'text-[#0D4C2E]' : 'text-gray-400'
                          }`}
                          style={{ fontVariationSettings: service === 'validation' ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          radio_button_checked
                        </span>
                        <div>
                          <p className="text-sm font-bold text-[#1A1A1A]">NIN Validation</p>
                          <p className="text-[11px] text-[#404942]">Validate NIN digits and date of birth</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#0D4C2E]">₦6,000.00</span>
                    </div>

                    {/* Name modification card */}
                    <div
                      onClick={() => setService('name')}
                      className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        service === 'name'
                          ? 'border-[#0D4C2E] bg-[#0D4C2E]/5 ring-1 ring-[#0D4C2E]'
                          : 'border-[#E5E7EB] hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`material-symbols-outlined text-xl ${
                            service === 'name' ? 'text-[#0D4C2E]' : 'text-gray-400'
                          }`}
                          style={{ fontVariationSettings: service === 'name' ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          radio_button_checked
                        </span>
                        <div>
                          <p className="text-sm font-bold text-[#1A1A1A]">Name Modification</p>
                          <p className="text-[11px] text-[#404942]">Update your name on official NIMC records</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#0D4C2E]">₦16,000.00</span>
                    </div>

                    {/* Phone modification card */}
                    <div
                      onClick={() => setService('phone')}
                      className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        service === 'phone'
                          ? 'border-[#0D4C2E] bg-[#0D4C2E]/5 ring-1 ring-[#0D4C2E]'
                          : 'border-[#E5E7EB] hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`material-symbols-outlined text-xl ${
                            service === 'phone' ? 'text-[#0D4C2E]' : 'text-gray-400'
                          }`}
                          style={{ fontVariationSettings: service === 'phone' ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          radio_button_checked
                        </span>
                        <div>
                          <p className="text-sm font-bold text-[#1A1A1A]">Phone Modification</p>
                          <p className="text-[11px] text-[#404942]">Update associated mobile number on NIMC records</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#0D4C2E]">₦16,000.00</span>
                    </div>
                  </div>
                </div>

                {/* Shared NIN identification input */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-xs font-bold text-[#404942] uppercase tracking-wider ml-1" htmlFor="nin">
                    NIN NUMBER (11 DIGITS)
                  </label>
                  <input
                    id="nin"
                    type="text"
                    maxLength={11}
                    value={nin}
                    onChange={(e) => setNin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Enter 11-digit NIN to modify"
                    className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none font-mono tracking-widest text-[#0D4C2E]"
                  />
                </div>

                {/* Form fields for Name modification */}
                {service === 'name' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">Current Surname</label>
                        <input
                          type="text"
                          value={currentSurname}
                          onChange={(e) => setCurrentSurname(e.target.value.toUpperCase())}
                          placeholder="Current Surname"
                          className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">Current First Name</label>
                        <input
                          type="text"
                          value={currentFirstName}
                          onChange={(e) => setCurrentFirstName(e.target.value.toUpperCase())}
                          placeholder="Current First Name"
                          className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">New Surname</label>
                        <input
                          type="text"
                          value={newSurname}
                          onChange={(e) => setNewSurname(e.target.value.toUpperCase())}
                          placeholder="New Surname"
                          className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-xs font-bold text-[#404942] uppercase tracking-wider ml-1">New First Name</label>
                        <input
                          type="text"
                          value={newFirstName}
                          onChange={(e) => setNewFirstName(e.target.value.toUpperCase())}
                          placeholder="New First Name"
                          className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Form fields for Phone modification */}
                {service === 'phone' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-xs font-bold text-[#404942] uppercase tracking-wider ml-1" htmlFor="phone">
                      New Mobile Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                      placeholder="Enter new 11-digit mobile string"
                      className="w-full h-12 px-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] outline-none font-mono"
                    />
                  </div>
                )}

                {/* Immediate charge warning card */}
                <div className="p-4 bg-[#ffdfa0] text-[#715300] border-l-4 border-red-500 rounded-r-xl text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    <span>Immediate Charge & Processing Terms</span>
                  </p>
                  <p className="leading-normal">
                    Your wallet will be charged <strong>₦{PRICING[service].toLocaleString()}</strong> immediately. Processing takes 24–48 hours. If the NIMC rejected your modification parameters, the full cost is automatically refunded to your wallet.
                  </p>
                </div>

                {/* Consent Checkbox */}
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
                    I confirm I have explicit authorization to submit this modification request for the specified data subject.
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className={`w-full h-14 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all duration-200 cursor-pointer ${
                    isFormValid()
                      ? 'bg-[#0D4C2E] text-white hover:bg-[#00341c]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    send
                  </span>
                  <span>Submit Modification Order</span>
                </button>
              </form>
            </section>
          </div>
        )}

        {/* -------------------- TAB 2: MY SUBMITTED ORDERS LIST -------------------- */}
        {activeTab === 'list' && (
          <div className="max-w-xl mx-auto w-full space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E5E7EB]/50 p-12 text-center space-y-4">
                <span className="material-symbols-outlined text-5xl text-gray-300">receipt_long</span>
                <h3 className="font-bold text-[#1A1A1A]">No Orders Yet</h3>
                <p className="text-xs text-[#404942]">You have not submitted any NIMC modification orders yet.</p>
                <button
                  onClick={() => setActiveTab('submit')}
                  className="bg-[#0D4C2E] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider"
                >
                  Create First Order
                </button>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.reference} className="bg-white rounded-xl shadow-sm border border-[#E5E7EB]/50 p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs text-[#404942] font-semibold">{order.reference}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'completed' && 'bg-green-100 text-green-700'
                      } ${order.status === 'processing' && 'bg-blue-100 text-blue-700'} ${
                        order.status === 'pending' && 'bg-amber-100 text-amber-700'
                      } ${order.status === 'rejected' && 'bg-red-100 text-red-700'}`}
                    >
                      {order.status}
                      {order.status === 'rejected' && ' · Refunded'}
                    </span>
                  </div>

                  <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                    <div>
                      <p className="font-bold text-[#1A1A1A] text-sm">{order.serviceType}</p>
                      <p className="text-[10px] text-[#404942] mt-0.5">Submitted: {order.date}</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#1A1A1A]">₦{order.cost.toLocaleString()}</span>
                  </div>

                  {/* Collapsible Details */}
                  <div className="bg-[#fcf9f8] p-3 rounded-lg text-xs space-y-1">
                    {Object.entries(order.details).map(([key, val]) => (
                      <div key={key} className="flex justify-between font-mono">
                        <span className="text-[#404942] uppercase text-[10px]">{key}:</span>
                        <span className="text-[#1A1A1A] font-bold">{val}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => alert(`Receipt downloaded for ${order.reference}`)}
                    className="w-full h-10 border border-[#D4A017] hover:bg-[#D4A017]/5 text-[#795900] font-label-caps text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Download Receipt (PDF)
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </LayoutShell>
  );
}
