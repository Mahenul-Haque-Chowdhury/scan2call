'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useCurrency } from '@/providers/currency-provider';
import type { CurrencyCode } from '@/lib/currency';

// Compact nav dropdown to override the auto-detected display currency. Display only -
// all charges remain in AUD.
export function CurrencySwitcher() {
  const { currency, setCurrency, options } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const entries = Object.entries(options) as [CurrencyCode, (typeof options)[CurrencyCode]][];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-text-muted hover:bg-surface-raised hover:text-text transition-colors"
        aria-label="Change display currency"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="h-[18px] w-[18px]" />
        <span className="hidden sm:inline">{currency}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 max-h-80 w-56 overflow-y-auto rounded-xl border border-border bg-bg/95 backdrop-blur-lg p-1 shadow-lg shadow-shadow z-40"
          role="listbox"
        >
          {entries.map(([code, meta]) => (
            <button
              key={code}
              role="option"
              aria-selected={code === currency}
              onClick={() => {
                setCurrency(code);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                code === currency
                  ? 'bg-surface-raised text-text'
                  : 'text-text-muted hover:bg-surface-raised hover:text-text'
              }`}
            >
              <span>
                <span className="font-medium">{code}</span>
                <span className="ml-2 text-text-dim">{meta.label}</span>
              </span>
              {code === currency && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
