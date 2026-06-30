'use client';

import React, { useRef } from 'react';
import { ServerOff, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentMethodSelectorProps {
  value: boolean; // false = Offline, true = Online
  onChange: (value: boolean) => void;
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  const offlineRef = useRef<HTMLButtonElement>(null);
  const onlineRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (value) {
        onChange(false);
        offlineRef.current?.focus();
      }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (!value) {
        onChange(true);
        onlineRef.current?.focus();
      }
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Payment Method"
      className="relative flex items-center rounded-2xl border bg-muted/40 h-11 w-48 p-1 select-none focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-shadow"
    >
      {/* Sliding selection pill */}
      <div
        className={cn(
          "absolute top-1 bottom-1 w-[calc(50%-6px)] rounded-xl border border-primary bg-primary/10 transition-transform duration-180 ease-out pointer-events-none shadow-sm",
          value ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
        )}
      />

      {/* Offline store button */}
      <button
        ref={offlineRef}
        type="button"
        role="radio"
        aria-checked={!value}
        tabIndex={!value ? 0 : -1}
        onClick={() => onChange(false)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 h-full z-10 rounded-xl text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 select-none active:scale-[0.97]",
          !value ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground active:bg-muted/30"
        )}
        aria-label="Offline store purchase"
      >
        <ServerOff className={cn("h-4 w-4 transition-colors", !value ? "text-primary" : "text-muted-foreground")} />
        <span>Offline</span>
      </button>

      {/* Online store button */}
      <button
        ref={onlineRef}
        type="button"
        role="radio"
        aria-checked={value}
        tabIndex={value ? 0 : -1}
        onClick={() => onChange(true)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 h-full z-10 rounded-xl text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 select-none active:scale-[0.97]",
          value ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground active:bg-muted/30"
        )}
        aria-label="Online purchase"
      >
        <Globe className={cn("h-4 w-4 transition-colors", value ? "text-primary" : "text-muted-foreground")} />
        <span>Online</span>
      </button>
    </div>
  );
}
