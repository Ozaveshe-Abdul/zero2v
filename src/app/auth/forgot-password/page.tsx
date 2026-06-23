'use client';

import * as React from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handled by supabase auth integration later
    console.log({ email });
    setSubmitted(true);
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
          {/* Logo Section */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center">
              <span className="material-symbols-outlined text-[#0D4C2E] text-4xl mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#0D4C2E] tracking-tight">zero2v</h1>
            </div>
            <p className="text-sm md:text-base text-[#404942] tracking-wide">Recover your account</p>
          </div>

          {/* Form Card */}
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-[#E5E7EB]/50 transition-all duration-300">
            {submitted ? (
              <div className="text-center space-y-4">
                <span className="material-symbols-outlined text-5xl text-[#059669]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <h2 className="text-lg font-bold text-[#0D4C2E]">Check Your Inbox</h2>
                <p className="text-xs text-[#404942] leading-normal">
                  If an account exists with email <strong>{email}</strong>, we have sent link instructions to reset your password.
                </p>
                <div className="pt-4">
                  <Link href="/auth/login" className="block w-full">
                    <button className="w-full h-12 bg-[#0D4C2E] text-white font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-[#00341c] transition-all cursor-pointer">
                      Return to Sign In
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <p className="text-xs text-[#404942] leading-normal">
                  Enter the email address associated with your account and we will email you a password recovery link.
                </p>

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

                {/* Send Link Button */}
                <button
                  type="submit"
                  className="w-full h-12 bg-[#0D4C2E] text-white font-bold text-sm tracking-wider uppercase rounded-xl shadow-md hover:bg-[#00341c] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Send Recovery Link</span>
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-[#E5E7EB]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-[#404942]">Or</span>
                  </div>
                </div>

                {/* Sign In Link */}
                <Link href="/auth/login" className="block w-full">
                  <button
                    type="button"
                    className="w-full h-12 border border-[#0D4C2E] text-[#0D4C2E] font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-[#0D4C2E]/5 active:scale-[0.98] transition-all duration-200 text-center cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </Link>
              </form>
            )}
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
