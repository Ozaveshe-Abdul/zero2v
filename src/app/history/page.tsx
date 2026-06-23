'use client';

import * as React from 'react';
import LayoutShell from '@/components/layout/LayoutShell';
import { createClient } from '@/lib/supabase/client';

export default function HistoryPage() {
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const supabase = createClient();

  React.useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('api_calls').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        setHistory(data || []);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [supabase]);

  return (
    <LayoutShell>
      <div className="space-y-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#0D4C2E]">History</h1>

        {loading ? (
           <div className="text-center p-8 text-[#707971]">Loading...</div>
        ) : history.length === 0 ? (
           <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] text-center text-[#707971] text-sm italic">
             No activity found. Run your first verification.
           </div>
        ) : (
           <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead className="bg-[#F7F5F0] border-b border-[#E5E7EB] text-xs uppercase tracking-wider text-[#707971] font-bold">
                   <tr>
                     <th className="px-6 py-4">Date</th>
                     <th className="px-6 py-4">Action</th>
                     <th className="px-6 py-4">Report ID</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4 text-right">Cost</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#E5E7EB]">
                   {history.map(row => (
                     <tr key={row.id} className="hover:bg-[#fcf9f8] transition-colors">
                       <td className="px-6 py-4 text-[#404942]">{new Date(row.created_at).toLocaleString()}</td>
                       <td className="px-6 py-4 font-bold text-[#1A1A1A] capitalize">{row.label}</td>
                       <td className="px-6 py-4 font-mono text-[#707971]">{row.report_id || 'N/A'}</td>
                       <td className="px-6 py-4">
                         <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${row.status === 'success' ? 'bg-[#059669]/10 text-[#059669]' : 'bg-[#DC2626]/10 text-[#DC2626]'}`}>
                           {row.status}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-right font-mono font-bold text-[#1A1A1A]">
                         {row.cost === 0 ? <span className="text-[#707971] font-normal italic">Refunded</span> : `−₦${row.cost}`}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        )}
      </div>
    </LayoutShell>
  );
}
