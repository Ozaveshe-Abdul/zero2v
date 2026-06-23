'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(false);

  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const supabase = createClient();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };


  return (
    <div className="relative min-h-screen bg-[#F7F5F0] flex flex-col font-sans antialiased text-[#1A1A1A] overflow-x-hidden select-none">
      {/* Subtle Nigerian Flag Watermark in background */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.03]">
        <svg className="w-[80vw] max-w-[600px]" viewBox="0 0 6 3" xmlns="http://www.w3.org/2000/svg">
          <rect fill="#008751" height="3" width="2"></rect>
          <rect fill="#ffffff" height="3" width="2" x="2"></rect>
          <rect fill="#008751" height="3" width="2" x="4"></rect>
        </svg>
      </div>

      {/* Decorative Blur Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-[#0D4C2E]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] bg-[#D4A017]/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-5 py-8 lg:py-16">
        <div className="w-full max-w-[420px] space-y-6">
          {/* Logo and Tagline Section */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center">
              <span className="material-symbols-outlined text-[#0D4C2E] text-4xl mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#0D4C2E] tracking-tight">zero2v</h1>
            </div>
            {/* Tagline modified: removed BVN reference per strict exclusion rule */}
            <p className="text-sm md:text-base text-[#404942] tracking-wide">Instant NIN Verification</p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-[#E5E7EB]/50 transition-all duration-300">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-[#DC2626]/10 text-[#DC2626] text-xs font-semibold p-3.5 rounded-xl border border-[#DC2626]/20">
                  {error}
                </div>
              )}
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#404942] uppercase tracking-wider ml-1" htmlFor="email">
                  Email Address
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707971] group-focus-within:text-[#0D4C2E] transition-colors">
                    mail
                  </span>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@institution.gov.ng"
                    required
                    className="w-full h-12 pl-12 pr-4 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] transition-all outline-none text-sm text-[#1c1b1b]"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-end px-1">
                  <label className="block text-xs font-bold text-[#404942] uppercase tracking-wider" htmlFor="password">
                    Password
                  </label>
                  <Link href="/auth/forgot-password" className="text-xs font-bold text-[#0D4C2E] hover:underline decoration-2 underline-offset-4">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707971] group-focus-within:text-[#0D4C2E] transition-colors">
                    lock
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-12 pl-12 pr-12 bg-[#fcf9f8] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#0D4C2E]/20 focus:border-[#0D4C2E] transition-all outline-none text-sm text-[#1c1b1b]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#404942] hover:text-[#0D4C2E] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center gap-2 px-1">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E5E7EB] text-[#0D4C2E] focus:ring-[#0D4C2E]"
                />
                <label htmlFor="remember" className="text-xs md:text-sm text-[#404942] cursor-pointer">
                  Remember this device
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#0D4C2E] text-white font-bold text-sm tracking-wider uppercase rounded-xl shadow-md hover:bg-[#00341c] hover:shadow-lg active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-[#E5E7EB]"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-[#404942]">Don't have an account?</span>
              </div>
            </div>

            {/* Create Account Button */}
            <Link href="/auth/register" className="block w-full">
              <button
                type="button"
                className="w-full h-12 border border-[#0D4C2E] text-[#0D4C2E] font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-[#0D4C2E]/5 active:scale-[0.98] transition-all duration-200 text-center cursor-pointer"
              >
                Create Account
              </button>
            </Link>
          </div>

          {/* Footer Trust Signals */}
          <div className="text-center space-y-4">
            <p className="text-xs text-[#404942] px-6">
              By signing in, you agree to our{' '}
              <a href="#" className="text-[#0D4C2E] font-bold hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-[#0D4C2E] font-bold hover:underline">
                Privacy Policy
              </a>
              .
            </p>
            <div className="flex items-center justify-center gap-6 opacity-40 hover:opacity-75 transition-all duration-300">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWOBKyiVYi1U8JoQlhOeVRNOSwkpr0uqyGEyn4sYwGE5SeDiaOeSBBfbZo7rlewKa_TTB4fGDUSuRSLv91LgJ_TVDSKAyq1I2jhmeLUZKgGkYkvE7DowCS5Nf1kDBPREXFW5lpwx7FT4PHI6XTby0mjHnNn9axvUaYXeCHLhTvC83tJ_coPNo2UEJZhtf93txr3TdkGBrv-uVFe8ef3yDMxIuGqgCjtuIA4MCGKhC9wZTY9LHzy0AopNwYE6i6blzazh06iwdq8Q"
                alt="NG Flag"
                className="h-3 w-auto grayscale"
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#404942]">
                NIMC Approved Partner
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Asymmetric Desktop Decorative Image */}
      <div className="hidden lg:block fixed bottom-0 right-0 w-1/3 h-2/3 -mr-20 pointer-events-none overflow-hidden select-none">
        <div className="relative w-full h-full">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZyssItzxGsNSF0TlHVL2owTlFaKI86U2xoLVk2miII-jU0BwOfRhKJvsE58gRbHtBC4qqfw3RgEq5BJgpwWM5YSIwHm01GmE-KtIgaWg7qkAAtmKKhviN9MCySSQ_iMKyHVa-nYWFSR3hbwkY5CBgarK2saDBXJa5siE7Mc7t5uJgaxv6uD4zeE1me5rnlXgWT9fs-V3LAiZsF2Ct0ljHAQHYo74dTgofn43-tIPJqUs4GH7-xG2xtU1v0c1lsNn4dIcOZjoNZw"
            alt="Decorative Abstract Artwork"
            className="w-full h-full object-cover rounded-tl-[120px] border-l-8 border-t-8 border-[#0D4C2E]/10 opacity-60"
          />
        </div>
      </div>
    </div>
  );
}
