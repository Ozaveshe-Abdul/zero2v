'use client';

import * as React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#F7F5F0] text-[#1A1A1A] font-sans antialiased overflow-x-hidden select-none flex flex-col">
      {/* Subtle Nigerian Flag Watermark in background */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.02]">
        <svg className="w-[80vw] max-w-[600px]" viewBox="0 0 6 3" xmlns="http://www.w3.org/2000/svg">
          <rect fill="#008751" height="3" width="2"></rect>
          <rect fill="#ffffff" height="3" width="2" x="2"></rect>
          <rect fill="#008751" height="3" width="2" x="4"></rect>
        </svg>
      </div>

      {/* Decorative Blur Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[45vw] h-[45vw] bg-[#0D4C2E]/5 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[35vw] h-[35vw] bg-[#D4A017]/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Top Header Navbar */}
      <header className="relative z-10 w-full h-20 px-6 lg:px-12 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0D4C2E] text-3xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
            verified_user
          </span>
          <h1 className="font-heading text-xl font-bold text-[#0D4C2E] tracking-tight">zero2v</h1>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm font-semibold text-[#404942] hover:text-[#0D4C2E] transition-colors">
            Sign In
          </Link>
          <Link href="/auth/register">
            <button className="bg-[#0D4C2E] hover:bg-[#00341c] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer active:scale-95">
              Get Started
            </button>
          </Link>
        </div>
      </header>

      {/* Main Landing Canvas */}
      <main className="relative z-10 flex-grow flex flex-col justify-center max-w-5xl mx-auto px-6 py-12 lg:py-24 text-center space-y-12">
        {/* Trust Badge */}
        <div className="inline-flex items-center justify-center gap-1.5 bg-[#0D4C2E]/10 text-[#0D4C2E] px-4 py-1.5 rounded-full mx-auto shadow-sm">
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            security
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider font-label-caps">
            Compliant Identity Registry Provider
          </span>
        </div>

        {/* Hero Copy */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0D4C2E] tracking-tight leading-[1.1]">
            Direct Secure Identity Verification for Nigeria
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-[#404942] leading-relaxed max-w-2xl mx-auto">
            Secure, real-time validation of national identities, batch lookup processing, and audit logs. Fast, compliant, and integrated directly with official databases.
          </p>
        </div>

        {/* Call-to-Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto w-full">
          <Link href="/auth/register" className="w-full sm:w-auto flex-grow">
            <button className="w-full bg-[#ffc641] hover:bg-[#ffdfa0] text-[#715300] font-bold text-xs uppercase tracking-wider h-14 px-8 rounded-xl shadow-lg active:scale-98 transition-all cursor-pointer">
              Register Account
            </button>
          </Link>
          <Link href="/auth/login" className="w-full sm:w-auto flex-grow">
            <button className="w-full border-2 border-[#0D4C2E] hover:bg-[#0D4C2E]/5 text-[#0D4C2E] font-bold text-xs uppercase tracking-wider h-14 px-8 rounded-xl transition-all cursor-pointer">
              Sign In to Dashboard
            </button>
          </Link>
        </div>

        {/* Features Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-[#E5E7EB]/50 space-y-3">
            <div className="w-10 h-10 bg-[#0D4C2E]/10 text-[#0D4C2E] rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined">verified</span>
            </div>
            <h3 className="font-heading text-sm font-bold text-[#1A1A1A]">Instant Verification</h3>
            <p className="text-xs text-[#404942] leading-relaxed">
              Query the identity registry directly to confirm profiles, images, and biometric metadata in milliseconds.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-[#E5E7EB]/50 space-y-3">
            <div className="w-10 h-10 bg-[#D4A017]/10 text-[#795900] rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined">layers</span>
            </div>
            <h3 className="font-heading text-sm font-bold text-[#1A1A1A]">Batch Operations</h3>
            <p className="text-xs text-[#404942] leading-relaxed">
              Submit list documents or CSV sheets to run up to 50 lookups concurrently via our background processing engine.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-[#E5E7EB]/50 space-y-3">
            <div className="w-10 h-10 bg-blue-50 text-[#2563EB] rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined">history</span>
            </div>
            <h3 className="font-heading text-sm font-bold text-[#1A1A1A]">Full Audit Trail</h3>
            <p className="text-xs text-[#404942] leading-relaxed">
              Track transaction histories, export statements, and generate secure verification result sheets in PDF format.
            </p>
          </div>
        </div>
      </main>

      {/* Footer compliance */}
      <footer className="relative z-10 w-full py-8 border-t border-[#E5E7EB] mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="flex items-center gap-6 opacity-50 grayscale">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWOBKyiVYi1U8JoQlhOeVRNOSwkpr0uqyGEyn4sYwGE5SeDiaOeSBBfbZo7rlewKa_TTB4fGDUSuRSLv91LgJ_TVDSKAyq1I2jhmeLUZKgGkYkvE7DowCS5Nf1kDBPREXFW5lpwx7FT4PHI6XTby0mjHnNn9axvUaYXeCHLhTvC83tJ_coPNo2UEJZhtf93txr3TdkGBrv-uVFe8ef3yDMxIuGqgCjtuIA4MCGKhC9wZTY9LHzy0AopNwYE6i6blzazh06iwdq8Q"
              alt="NG Flag"
              className="h-3 w-auto"
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]">
              NIMC Approved Partner
            </span>
          </div>
          <p className="text-[10px] font-bold text-[#404942] uppercase tracking-widest">
            © 2024 zero2v. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
}
