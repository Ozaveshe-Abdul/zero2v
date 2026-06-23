'use client';

import * as React from 'react';

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function ConsentCheckbox({
  checked,
  onChange,
  label = 'I confirm the individual whose information I am submitting has explicitly consented to this verification.',
  disabled = false,
}: ConsentCheckboxProps) {
  return (
    <div className="flex flex-col gap-1.5 px-1 my-4">
      <label className={`flex items-start gap-3 cursor-pointer ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}

          />
          <div className="w-5 h-5 bg-white border-2 border-[#E5E7EB] rounded peer-focus:ring-2 peer-focus:ring-[#0D4C2E]/20 peer-checked:bg-[#0D4C2E] peer-checked:border-[#0D4C2E] transition-all flex items-center justify-center">
            {checked && (
              <span className="material-symbols-outlined text-white text-[14px] font-bold" style={{ fontVariationSettings: "'wght' 700" }}>
                check
              </span>
            )}
          </div>
        </div>
        <span className="text-xs md:text-sm text-[#404942] leading-snug">
          {label}
        </span>
      </label>
      <span className="text-[10px] text-[#707971] ml-8">
        Required. Never pre-filled.
      </span>
    </div>
  );
}
