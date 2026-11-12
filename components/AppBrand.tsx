import React from 'react';

export const APP_NAME = 'Arkhen Drive Car';
export const APP_SYMBOL = '/brand/arkhen-symbol-1024.png';

/** Software identity only; tenant/company logos and fiscal documents stay unchanged. */
export const BrandSymbol: React.FC<{ className?: string }> = ({ className = 'h-9 w-9' }) => (
  <span className={`inline-flex shrink-0 items-center justify-center ${className}`}>
    <img src={APP_SYMBOL} alt="" aria-hidden="true" className="h-full w-full object-contain" />
  </span>
);

export const AppBrand: React.FC<{ compact?: boolean; dark?: boolean }> = ({ compact = false, dark = false }) => (
  <div className="flex min-w-0 items-center gap-2.5" aria-label={APP_NAME}>
    <BrandSymbol />
    {!compact && <div className="flex min-w-0 flex-col">
      <span className={`text-sm font-semibold tracking-tight leading-5 ${dark ? 'text-white' : 'text-slate-900'}`}>Arkhen</span>
      <span className={`text-xs font-medium leading-4 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>Drive Car</span>
    </div>}
  </div>
);
