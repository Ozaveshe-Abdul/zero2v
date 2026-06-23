'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';

export function OrderList() {
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const supabase = createClient();

  React.useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('modification_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });

      setOrders(data || []);
    }
    setLoading(false);
  };

  const handleRefreshStatus = async (reference: string) => {
    try {
      const res = await fetch(`/api/orders/${reference}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => prev.map(o => o.reference_id === reference ? { ...o, status: data.status } : o));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="text-center p-8 text-[#707971]">Loading orders...</div>;

  if (orders.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] text-center text-[#707971] text-sm italic">
        No orders yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(o => (
        <div key={o.id} className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-mono text-xs text-[#707971]">{o.reference_id}</span>
              <h3 className="font-bold text-[#1A1A1A] capitalize">{o.service_type.replace(/_/g, ' ')}</h3>
            </div>
            <div className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${
              o.status === 'completed' || o.status === 'approved' ? 'bg-[#059669]/10 text-[#059669]' :
              o.status === 'rejected' ? 'bg-[#DC2626]/10 text-[#DC2626]' :
              'bg-[#D97706]/10 text-[#D97706] animate-pulse'
            }`}>
              {o.status}
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-[#707971] border-t border-[#E5E7EB] pt-3">
            <span>{new Date(o.submitted_at).toLocaleDateString()}</span>
            <span className="font-mono font-bold text-[#0D4C2E]">₦{o.amount_charged.toLocaleString()}</span>
          </div>

          <div className="flex gap-2 pt-2">
             <button onClick={() => handleRefreshStatus(o.reference_id)} className="flex-1 bg-[#F7F5F0] text-[#404942] text-xs font-bold py-2 rounded-lg hover:bg-[#E5E7EB] transition-colors">
               Refresh Status
             </button>
             <button className="flex-1 bg-[#D4A017] text-[#1A1A1A] text-xs font-bold py-2 rounded-lg hover:bg-[#b88a14] transition-colors">
               Export PDF
             </button>
          </div>
        </div>
      ))}
    </div>
  );
}
