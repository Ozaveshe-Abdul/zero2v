'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import LayoutShell from '@/components/layout/LayoutShell';


function WalletCallbackContent() {

  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams?.get('reference');

  const [status, setStatus] = React.useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = React.useState('Verifying your payment...');

  React.useEffect(() => {
    if (!reference) {
      setStatus('failed');
      setMessage('No payment reference found.');
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await fetch(`/api/wallet/verify?reference=${reference}`);
        const data = await res.json();

        if (res.ok && data.status === 'success') {
          setStatus('success');
          setMessage(`Payment successful! Your new balance is ₦${data.balance?.toLocaleString()}.`);
        } else if (data.status === 'processing' || data.status === 'pending') {
          // In a real app we'd poll or use SSE. For now, we ask user to check back.
          setStatus('success');
          setMessage('Payment is processing. Your balance will update shortly.');
        } else {
          setStatus('failed');
          setMessage(data.message || 'Payment verification failed.');
        }
      } catch (err) {
        setStatus('failed');
        setMessage('A network error occurred while verifying your payment.');
      }
    };

    verifyPayment();
  }, [reference]);

  return (
    <LayoutShell>
      <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-2xl shadow-lg border border-[#E5E7EB] text-center space-y-6 animate-in zoom-in-95 duration-300">

        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-[#0D4C2E]/20 border-t-[#0D4C2E] rounded-full animate-spin mx-auto"></div>
            <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">Processing Payment</h1>
            <p className="text-[#707971]">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-[#059669]/10 rounded-full flex items-center justify-center mx-auto text-[#059669]">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">Top-up Successful</h1>
            <p className="text-[#707971]">{message}</p>
            <Link href="/dashboard" className="block w-full h-12 bg-[#0D4C2E] text-white font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-[#00341c] flex items-center justify-center transition-all">
              Return to Dashboard
            </Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 bg-[#DC2626]/10 rounded-full flex items-center justify-center mx-auto text-[#DC2626]">
              <span className="material-symbols-outlined text-4xl">error</span>
            </div>
            <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">Payment Failed</h1>
            <p className="text-[#707971]">{message}</p>
            <div className="flex gap-3">
              <Link href="/wallet" className="flex-1 h-12 bg-[#D4A017] text-[#1A1A1A] font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-[#b88a14] flex items-center justify-center transition-all">
                Try Again
              </Link>
              <Link href="/dashboard" className="flex-1 h-12 bg-white border border-[#E5E7EB] text-[#404942] font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-[#F7F5F0] flex items-center justify-center transition-all">
                Dashboard
              </Link>
            </div>
          </>
        )}

      </div>
    </LayoutShell>
  );
}


export default function WalletCallbackPage() {
  return (
    <React.Suspense fallback={<LayoutShell><div className="text-center p-10">Loading...</div></LayoutShell>}>
      <WalletCallbackContent />
    </React.Suspense>
  )
}
