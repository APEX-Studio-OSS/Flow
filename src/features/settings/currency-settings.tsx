'use client';

import * as React from 'react';
import { DollarSign, Check } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/utils';
import { useApp } from '@/components/providers/app-provider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TouchSafePreferenceDropdown } from '@/components/ui/touch-safe-preference-dropdown';

const availableCurrencies = [
  { code: 'USD', name: 'United States Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'GBP', name: 'British Pound Sterling' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'RUB', name: 'Russian Ruble' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'TRY', name: 'Turkish Lira' },
];

export function CurrencySettings({
  isOpen,
  onOpenChange,
  buttonWidth = 'w-[120px]',
  description
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  buttonWidth?: string;
  description?: string;
}) {
  const { currency, setCurrency } = useApp();
  const [search, setSearch] = React.useState('');
  
  const lastSelectedRef = React.useRef<string | null>(null);

  // Reset search when it closes
  React.useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const handleSelect = (code: string) => {
    if (lastSelectedRef.current === code) return;
    lastSelectedRef.current = code;
    setTimeout(() => {
      lastSelectedRef.current = null;
    }, 300);

    setCurrency(code);
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const filteredCurrencies = React.useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return availableCurrencies;
    return availableCurrencies.filter(
      (c) =>
        c.code.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query)
    );
  }, [search]);

  return (
    <TouchSafePreferenceDropdown
      title="Currency"
      description={description ?? "Set your preferred currency for display."}
      icon={<DollarSign className="h-6 w-6 text-muted-foreground flex-shrink-0" />}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      buttonWidth={buttonWidth}
      triggerContent={
        <div className="flex items-center min-w-0">
          <span className="font-semibold text-foreground truncate">{currency}</span>
          <span className="text-[10px] text-muted-foreground ml-1.5 font-medium flex-shrink-0">
            {getCurrencySymbol(currency)}
          </span>
        </div>
      }
    >
      <div className="space-y-2">
        <Input
          placeholder="Search currency..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 rounded-xl text-xs bg-background/50 border-input focus:ring-2 focus:ring-primary"
        />
        <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1">
          {filteredCurrencies.map((c) => {
            const isSelected = currency === c.code;
            return (
              <button
                key={c.code}
                type="button"
                onPointerUp={(e) => {
                  e.stopPropagation();
                  handleSelect(c.code);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(c.code);
                }}
                className={cn(
                  "w-full flex items-center justify-between h-11 px-3 text-xs rounded-xl transition-all border border-transparent focus:outline-none focus:ring-1 focus:ring-primary active:scale-98 text-left",
                  isSelected 
                    ? "bg-muted/70 font-bold text-foreground"
                    : "hover:bg-muted/40 text-foreground"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold flex-shrink-0">{c.code}</span>
                  <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">{c.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-semibold text-muted-foreground">{getCurrencySymbol(c.code)}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                </div>
              </button>
            );
          })}
          {filteredCurrencies.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No matching currencies found.
            </div>
          )}
        </div>
      </div>
    </TouchSafePreferenceDropdown>
  );
}
