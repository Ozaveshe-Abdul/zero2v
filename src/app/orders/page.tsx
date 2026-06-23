'use client';

import * as React from 'react';
import LayoutShell from '@/components/layout/LayoutShell';
import { OrderForm } from '@/components/orders/OrderForm';
import { OrderList } from '@/components/orders/OrderList';

type OrderTab = 'submit' | 'list';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = React.useState<OrderTab>('submit');
  const [balance, setBalance] = React.useState(0);

  React.useEffect(() => {
    fetch('/api/balance').then(res => res.json()).then(data => setBalance(data.balance || 0));
  }, [activeTab]);

  return (
    <LayoutShell>
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#0D4C2E]">Modification Orders</h1>
          <div className="flex bg-[#F7F5F0] p-1 rounded-xl">
            <button onClick={() => setActiveTab('submit')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'submit' ? 'bg-white shadow-sm text-[#0D4C2E]' : 'text-[#707971]'}`}>Submit Order</button>
            <button onClick={() => setActiveTab('list')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'list' ? 'bg-white shadow-sm text-[#0D4C2E]' : 'text-[#707971]'}`}>My Orders</button>
          </div>
        </div>

        {activeTab === 'submit' ? (
          <div className="bg-white p-5 md:p-8 rounded-2xl shadow-lg border border-[#E5E7EB]/50">
            <div className="mb-6 flex justify-between items-center bg-[#F7F5F0] p-4 rounded-xl border border-[#E5E7EB]">
              <span className="text-sm font-bold text-[#404942]">Current Balance</span>
              <span className="font-mono text-lg font-bold text-[#0D4C2E]">₦{balance.toLocaleString()}</span>
            </div>
            <OrderForm balance={balance} onOrderComplete={() => setActiveTab('list')} />
          </div>
        ) : (
          <OrderList />
        )}

      </div>
    </LayoutShell>
  );
}
