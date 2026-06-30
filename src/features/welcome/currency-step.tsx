'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Check, DollarSign, Search } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getCurrencySymbol } from '@/lib/utils';
import { cn } from '@/lib/utils';

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

interface CurrencyStepProps {
  setNextDisabled?: (disabled: boolean) => void;
  setOnNext?: (handler: (() => void) | null) => void;
  setNextLabel?: (label: string) => void;
}

export function CurrencyStep({
  setNextDisabled,
  setOnNext,
  setNextLabel,
}: CurrencyStepProps) {
  const { currency, setCurrency, nextStep } = useApp();
  const [search, setSearch] = useState('');

  const handleSelect = useCallback((code: string) => {
    setCurrency(code);
  }, [setCurrency]);

  const handleSubmit = useCallback(() => {
    nextStep();
  }, [nextStep]);

  useEffect(() => {
    if (setNextLabel) setNextLabel('Continue');
    if (setNextDisabled) setNextDisabled(false);
    if (setOnNext) setOnNext(handleSubmit);
    return () => {
      if (setOnNext) setOnNext(null);
    };
  }, [setNextLabel, setNextDisabled, setOnNext, handleSubmit]);

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
    <Card className="border border-border/40 shadow-md bg-card/60 backdrop-blur-md rounded-3xl w-full select-none font-sans">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-bold tracking-tight">Choose your currency</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Select the default currency for your transactions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
          <Input
            placeholder="Search currency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 pl-10 rounded-xl bg-background/50 border-border/80 focus-visible:ring-1 focus-visible:ring-primary transition-all text-sm"
          />
        </div>

        <ScrollArea className="h-[220px] rounded-2xl border border-border/30 bg-background/25">
          <div className="p-1.5 space-y-1">
            {filteredCurrencies.map((c) => {
              const isSelected = currency === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelect(c.code)}
                  className={cn(
                    "w-full flex items-center justify-between h-12 px-3.5 text-xs rounded-xl transition-all border border-transparent focus:outline-none focus:ring-1 focus:ring-primary active:scale-98 text-left",
                    isSelected 
                      ? "bg-primary/10 font-bold text-primary"
                      : "hover:bg-muted/40 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-sm flex-shrink-0">{c.code}</span>
                    <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[170px]">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-semibold text-muted-foreground">{getCurrencySymbol(c.code)}</span>
                    {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                  </div>
                </button>
              );
            })}
            {filteredCurrencies.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No matching currencies found.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
