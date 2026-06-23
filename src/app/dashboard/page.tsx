'use client';

import * as React from 'react';
import Link from 'next/link';
import LayoutShell from '@/components/layout/LayoutShell';
import { createClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const [balance, setBalance] = React.useState<number | null>(null);
  const [recentCalls, setRecentCalls] = React.useState<any[]>([]);
  const supabase = createClient();

  React.useEffect(() => {
    fetch('/api/balance').then(res => res.json()).then(data => setBalance(data.balance));

    const fetchRecent = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('api_calls').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);
        setRecentCalls(data || []);
      }
    };
    fetchRecent();
  }, [supabase]);

  return (
    <LayoutShell>
      <div className="space-y-6">

        {/* Balance Card */}
        <div className="bg-[#0D4C2E] text-white p-6 md:p-8 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2 text-white/80">
              <span className="text-sm font-bold tracking-wider uppercase">Wallet Balance</span>
            </div>
            <div className="text-4xl md:text-5xl font-bold font-mono text-[#D4A017] tracking-tight mb-4 inline-block">
              {balance !== null ? `₦${balance.toLocaleString()}` : '...'}
            </div>
            
            <div className="flex gap-3 mt-4">
               <Link href="/wallet" className="bg-white text-[#0D4C2E] px-5 py-2.5 rounded-lg text-sm font-bold shadow hover:bg-[#F7F5F0]">Fund Wallet</Link>
               <Link href="/history" className="bg-[#0D4C2E] border border-white/30 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-white/10">View History</Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/verify?tab=nin" className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E7EB] hover:border-[#0D4C2E]/50 transition-colors flex flex-col items-center justify-center gap-2 text-center">
            <span className="material-symbols-outlined text-[#0D4C2E] text-3xl">badge</span>
            <span className="text-xs font-bold text-[#1A1A1A]">Verify NIN</span>
          </Link>
          <Link href="/verify?tab=phone" className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E7EB] hover:border-[#0D4C2E]/50 transition-colors flex flex-col items-center justify-center gap-2 text-center">
            <span className="material-symbols-outlined text-[#0D4C2E] text-3xl">smartphone</span>
            <span className="text-xs font-bold text-[#1A1A1A]">Phone Search</span>
          </Link>
          <Link href="/batch" className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E7EB] hover:border-[#0D4C2E]/50 transition-colors flex flex-col items-center justify-center gap-2 text-center">
            <span className="material-symbols-outlined text-[#0D4C2E] text-3xl">library_add_check</span>
            <span className="text-xs font-bold text-[#1A1A1A]">Batch Lookup</span>
          </Link>
          <Link href="/orders" className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E7EB] hover:border-[#0D4C2E]/50 transition-colors flex flex-col items-center justify-center gap-2 text-center">
            <span className="material-symbols-outlined text-[#0D4C2E] text-3xl">assignment_turned_in</span>
            <span className="text-xs font-bold text-[#1A1A1A]">Orders</span>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
             <h2 className="font-heading font-bold text-lg text-[#1A1A1A]">Recent Activity</h2>
             <Link href="/history" className="text-xs font-bold text-[#0D4C2E] hover:underline">View All →</Link>
          </div>

          <div className="space-y-3">
             {recentCalls.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] text-center text-[#707971] text-sm italic">
                  No recent activity found.
                </div>
             ) : (
                recentCalls.map(call => (
                  <div key={call.id} className="bg-white p-4 rounded-xl border border-[#E5E7EB] flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${call.status === 'success' ? 'bg-[#059669]/10 text-[#059669]' : 'bg-[#DC2626]/10 text-[#DC2626]'}`}>
                        <span className="material-symbols-outlined">{call.status === 'success' ? 'check' : 'close'}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1A1A1A] capitalize">{call.label}</p>
                        <p className="text-xs font-mono text-[#707971]">{call.report_id || 'Failed'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className={`font-mono text-sm font-bold ${call.status === 'success' ? 'text-[#1A1A1A]' : 'text-[#707971] line-through'}`}>−₦{call.cost}</p>
                       <p className="text-xs text-[#707971]">{new Date(call.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
             )}
          </div>
        </div>

      </div>
    </LayoutShell>
  );
}
