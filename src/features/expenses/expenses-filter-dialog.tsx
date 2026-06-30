'use client';

import React, { useState, useEffect, useRef, cloneElement, useMemo } from 'react';
import { BottomFloatingForm } from '@/components/flow-popups/bottom-floating-form';
import { FlowFloatingSheet } from '@/components/flow-popups/flow-floating-sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, DollarSign, Globe, ServerOff, Tag, ChevronLeft, ChevronRight, Check, ChevronDown } from 'lucide-react';
import { cn, getCurrencySymbol } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { DateRange } from 'react-day-picker';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/components/providers/app-provider';
import { CategoryIcon } from '@/components/icons/category-icon';
import { OverlayStack } from '@/lib/overlay-stack';
import { 
  addMonths, 
  startOfMonth, 
  endOfMonth, 
  format 
} from 'date-fns';
import { type ExpenseFilters, getEmptyExpenseFilters } from '@/lib/filtering';

type OnlineStatus = 'all' | 'online' | 'offline';

interface ExpensesFilterDialogProps {
  children: React.ReactNode;
  appliedFilters: ExpenseFilters;
  setAppliedFilters: React.Dispatch<React.SetStateAction<ExpenseFilters>>;
  defaultDateRange?: DateRange;
}

const transactionTypes: { id: OnlineStatus; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: null },
  { id: 'offline', label: 'Offline', icon: <ServerOff className="h-4 w-4" /> },
  { id: 'online', label: 'Online', icon: <Globe className="h-4 w-4" /> },
];

export function ExpensesFilterDialog({
  children,
  appliedFilters,
  setAppliedFilters,
  defaultDateRange,
}: ExpensesFilterDialogProps) {
  const [open, setOpen] = useState(false);
  const { currency, categories } = useApp();

  // Local draftFilters state
  const [draftFilters, setDraftFilters] = useState<ExpenseFilters>(appliedFilters);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const categoryContainerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdowns mutually
  useEffect(() => {
    if (isCategoryDropdownOpen) {
      setIsDatePickerOpen(false);
    }
  }, [isCategoryDropdownOpen]);

  useEffect(() => {
    if (isDatePickerOpen) {
      setIsCategoryDropdownOpen(false);
    }
  }, [isDatePickerOpen]);

  // Click outside category selector toggle closes it
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (categoryContainerRef.current && !categoryContainerRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    const handleOutsideTouch = (e: TouchEvent) => {
      if (categoryContainerRef.current && !categoryContainerRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideTouch);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideTouch);
    };
  }, [isCategoryDropdownOpen]);

  // OverlayStack back integration for inline category menu
  useEffect(() => {
    if (isCategoryDropdownOpen) {
      OverlayStack.register('expenses-filter-category-toggle-menu', () => {
        setIsCategoryDropdownOpen(false);
      }, 3, undefined, false);
    } else {
      OverlayStack.unregister('expenses-filter-category-toggle-menu');
    }
    return () => {
      OverlayStack.unregister('expenses-filter-category-toggle-menu');
    };
  }, [isCategoryDropdownOpen]);

  // Sync temp values from parent state on open
  useEffect(() => {
    if (open) {
      setDraftFilters({
        selectedCategories: [...appliedFilters.selectedCategories],
        dateRange: appliedFilters.dateRange ? {
          from: appliedFilters.dateRange.from ? new Date(appliedFilters.dateRange.from) : undefined,
          to: appliedFilters.dateRange.to ? new Date(appliedFilters.dateRange.to) : undefined,
        } : undefined,
        priceRange: { ...appliedFilters.priceRange },
        onlineStatus: appliedFilters.onlineStatus,
      });
      if (appliedFilters.dateRange?.from) {
        setCurrentMonth(new Date(appliedFilters.dateRange.from));
      } else {
        setCurrentMonth(new Date());
      }
      setIsCategoryDropdownOpen(false);
      setIsDatePickerOpen(false);
    } else {
      setIsCategoryDropdownOpen(false);
      setIsDatePickerOpen(false);
    }
  }, [open, appliedFilters]);

  const cleanupFilterOverlaysAndLocks = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    setIsCategoryDropdownOpen(false);
    setIsDatePickerOpen(false);
    OverlayStack.unregister('expenses-filter-dialog');
    OverlayStack.unregister('expenses-filter-category-toggle-menu');
    document.body.style.pointerEvents = '';
    document.body.style.overflow = '';
    document.body.classList.remove('overlay-active');
    try {
      const backdrops = document.querySelectorAll('.bg-overlay-dim, [key="sheet-overlay"]');
      backdrops.forEach(el => {
        (el as HTMLElement).style.pointerEvents = 'none';
      });
    } catch (e) {}
  }, []);

  const handleClose = React.useCallback(() => {
    cleanupFilterOverlaysAndLocks();
    setOpen(false);
  }, [cleanupFilterOverlaysAndLocks]);

  useEffect(() => {
    if (!open) {
      cleanupFilterOverlaysAndLocks();
    }
    return () => {
      cleanupFilterOverlaysAndLocks();
    };
  }, [open, cleanupFilterOverlaysAndLocks]);

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    cleanupFilterOverlaysAndLocks();
    setOpen(false);
  };

  const handleMonthChange = (direction: 'next' | 'prev') => {
    const newMonth = addMonths(currentMonth, direction === 'next' ? 1 : -1);
    setCurrentMonth(newMonth);
    setDraftFilters(prev => ({
      ...prev,
      dateRange: {
        from: startOfMonth(newMonth),
        to: endOfMonth(newMonth),
      }
    }));
  };

  const handleResetFilters = () => {
    const empty = {
      ...getEmptyExpenseFilters(),
      dateRange: defaultDateRange,
    };
    setDraftFilters(empty);
    setAppliedFilters(empty);
    cleanupFilterOverlaysAndLocks();
    setOpen(false);
  };

  const activeFiltersCount = useMemo(() => {
    return [
      appliedFilters.selectedCategories.length > 0,
      appliedFilters.dateRange !== undefined,
      appliedFilters.priceRange.min !== '' || appliedFilters.priceRange.max !== '',
      appliedFilters.onlineStatus !== 'all',
    ].filter(Boolean).length;
  }, [appliedFilters]);

  const isFullMonthSelected = useMemo(() => {
    return !!(draftFilters.dateRange?.from && draftFilters.dateRange?.to &&
      new Date(draftFilters.dateRange.from).getDate() === 1 &&
      endOfMonth(new Date(draftFilters.dateRange.from)).getDate() === new Date(draftFilters.dateRange.to).getDate());
  }, [draftFilters.dateRange]);

  // Price and date validation
  const minVal = parseFloat(draftFilters.priceRange.min);
  const maxVal = parseFloat(draftFilters.priceRange.max);
  const isAmountRangeInvalid = !isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal;
  const isDateRangeInvalid = !!(draftFilters.dateRange?.from && draftFilters.dateRange?.to && new Date(draftFilters.dateRange.from) > new Date(draftFilters.dateRange.to));

  const calendarSelected = draftFilters.dateRange ? {
    from: draftFilters.dateRange.from ? new Date(draftFilters.dateRange.from) : undefined,
    to: draftFilters.dateRange.to ? new Date(draftFilters.dateRange.to) : undefined,
  } : undefined;

  const triggerElement = React.isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          if (children.props.onClick) {
            children.props.onClick(e);
          }
          setOpen(true);
        }
      })
    : children;

  return (
    <>
      <div className="inline-block cursor-pointer" onClick={() => setOpen(true)}>
        {triggerElement}
      </div>

      <BottomFloatingForm
        id="expenses-filter-dialog"
        open={open}
        onClose={handleClose}
        title="Filter Expenses"
        description="Refine your expense viewing selection"
        footer={
          <div className="grid grid-cols-2 gap-3 w-full select-none">
            <Button 
              onClick={handleResetFilters} 
              variant="outline" 
              className="w-full rounded-xl h-12 text-xs font-bold hover:bg-muted/30 transition-colors"
            >
              Reset
            </Button>
            <Button 
              onClick={handleApplyFilters} 
              disabled={isAmountRangeInvalid || isDateRangeInvalid}
              className="w-full rounded-xl h-12 text-xs font-bold active:scale-[0.98] transition-transform"
            >
              Apply Filters
            </Button>
          </div>
        }
      >
        <div className="space-y-4 pt-1">
          {/* Category Section */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">Category</Label>
            </div>
            
            <div ref={categoryContainerRef}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className={cn(
                  "flex items-center justify-between w-full h-11 px-3.5 rounded-xl border border-input bg-background/50 hover:bg-background/80 transition-all text-xs font-semibold text-left select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                  isCategoryDropdownOpen && "border-primary bg-primary/5 ring-1 ring-primary"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {draftFilters.selectedCategories.length === 1 ? (
                    (() => {
                      const cat = categories.find(c => c.name === draftFilters.selectedCategories[0]);
                      return cat ? (
                        <CategoryIcon name={cat.icon} style={{ color: cat.color }} className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <Tag className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
                      );
                    })()
                  ) : (
                    <Tag className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
                  )}
                  {draftFilters.selectedCategories.length === 0 && (
                    <span className="text-muted-foreground font-normal">Select categories...</span>
                  )}
                  {draftFilters.selectedCategories.length === 1 && (
                    <span className="text-foreground font-bold truncate">
                      1 category selected
                    </span>
                  )}
                  {draftFilters.selectedCategories.length > 1 && (
                    <span className="text-foreground font-bold truncate">
                      {draftFilters.selectedCategories.length} categories selected
                    </span>
                  )}
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200", isCategoryDropdownOpen && "rotate-180")} />
              </Button>

              <AnimatePresence>
                {isCategoryDropdownOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden bg-muted/20 border border-border/40 rounded-2xl p-2 mx-0.5 space-y-1"
                  >
                    <div 
                      className="scrollable-area overflow-y-auto px-1.5 pt-0.5 pb-2 max-h-[180px] space-y-1 no-scrollbar"
                      style={{
                        touchAction: 'pan-y',
                        overscrollBehavior: 'contain',
                        WebkitOverflowScrolling: 'touch',
                      }}
                    >
                      <button
                        key="all-categories"
                        type="button"
                        tabIndex={-1}
                        onClick={() => setDraftFilters(prev => ({ ...prev, selectedCategories: [] }))}
                        className={cn(
                          "w-full flex items-center justify-between h-10 px-3 text-xs rounded-xl hover:bg-muted/50 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-primary active:scale-98 border border-transparent",
                          draftFilters.selectedCategories.length === 0 ? "bg-muted/50 font-bold border-border/40" : "bg-background/20"
                        )}
                      >
                        <span className={cn(draftFilters.selectedCategories.length === 0 ? "text-primary font-bold" : "text-foreground font-semibold")}>All Categories (Any)</span>
                        {draftFilters.selectedCategories.length === 0 && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                      <div className="h-px bg-border/40 my-1" />
                      {categories.map((cat) => {
                        const isSelected = draftFilters.selectedCategories.includes(cat.name);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            tabIndex={-1}
                            onClick={() => {
                              setDraftFilters(prev => ({
                                ...prev,
                                selectedCategories: prev.selectedCategories.includes(cat.name)
                                  ? prev.selectedCategories.filter(c => c !== cat.name)
                                  : [...prev.selectedCategories, cat.name]
                              }));
                            }}
                            className={cn(
                              "w-full flex items-center justify-between h-10 px-3 text-xs rounded-xl hover:bg-muted/50 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-primary active:scale-98 border border-transparent",
                              isSelected ? "bg-muted/50 font-bold border-border/40" : "bg-background/20"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="h-7 w-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cat.color}15` }}>
                                <CategoryIcon name={cat.icon} style={{ color: cat.color }} className="h-4 w-4" />
                              </div>
                              <span className={cn("truncate", isSelected ? "text-foreground font-bold" : "text-foreground/85 font-semibold")}>{cat.name}</span>
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <Separator className="opacity-40" />

          {/* Date Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">Date Range</Label>
              </div>
              {draftFilters.dateRange && (
                <button
                  type="button"
                  onClick={() => setDraftFilters(prev => ({ ...prev, dateRange: undefined }))}
                  className="text-[10px] text-primary hover:underline font-bold"
                >
                  Clear Date
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-11 w-11 rounded-full flex-shrink-0 bg-background/50 hover:bg-background/80" 
                onClick={() => handleMonthChange('prev')}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </Button>
              
              <Button
                id="date"
                type="button"
                variant="outline"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className={cn(
                  "w-full justify-center text-center font-bold h-11 rounded-xl bg-background/50 border-input text-xs focus-visible:ring-2 focus-visible:ring-primary truncate px-3 hover:bg-background/80",
                  !draftFilters.dateRange && "text-muted-foreground font-normal"
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5 mr-2 text-muted-foreground/75 flex-shrink-0" />
                <span className="truncate">
                  {isFullMonthSelected ? (
                    format(new Date(draftFilters.dateRange!.from!), 'MMMM yyyy')
                  ) : draftFilters.dateRange?.from ? (
                    draftFilters.dateRange.to ? (
                      <>
                        {format(new Date(draftFilters.dateRange.from), 'MMM dd, y')} - {format(new Date(draftFilters.dateRange.to), 'MMM dd, y')}
                      </>
                    ) : (
                      format(new Date(draftFilters.dateRange.from), 'MMM dd, y')
                    )
                  ) : (
                    "Pick a date"
                  )}
                </span>
              </Button>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="h-11 w-11 rounded-full flex-shrink-0 bg-background/50 hover:bg-background/80" 
                onClick={() => handleMonthChange('next')}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>

            <AnimatePresence>
              {isDatePickerOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15, ease: 'easeInOut' }}
                  className="overflow-hidden flex flex-col items-center bg-background/30 rounded-2xl border border-border/40 p-1 mt-1"
                >
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={draftFilters.dateRange?.from ? new Date(draftFilters.dateRange.from) : new Date()}
                    selected={calendarSelected}
                    onSelect={(range) => setDraftFilters(prev => ({ ...prev, dateRange: range }))}
                    numberOfMonths={1}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            {isDateRangeInvalid && (
              <p className="text-[10px] text-destructive font-semibold select-none pt-1">
                Start date cannot be after end date.
              </p>
            )}
          </div>

          <Separator className="opacity-40" />

          {/* Amount Range Section */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">Amount Range</Label>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 font-semibold text-xs select-none">
                    {getCurrencySymbol(currency)}
                  </span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Min"
                    aria-label="Minimum amount"
                    value={draftFilters.priceRange.min}
                    onChange={e => setDraftFilters(prev => ({ 
                      ...prev, 
                      priceRange: { ...prev.priceRange, min: e.target.value } 
                    }))}
                    className="pl-7 h-11 rounded-xl bg-background/50 border-input text-xs font-semibold focus-visible:ring-2 focus-visible:ring-primary placeholder:text-muted-foreground/50"
                  />
                </div>
                <span className="text-muted-foreground/65 font-bold text-xs select-none">—</span>
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 font-semibold text-xs select-none">
                    {getCurrencySymbol(currency)}
                  </span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Max"
                    aria-label="Maximum amount"
                    value={draftFilters.priceRange.max}
                    onChange={e => setDraftFilters(prev => ({ 
                      ...prev, 
                      priceRange: { ...prev.priceRange, max: e.target.value } 
                    }))}
                    className="pl-7 h-11 rounded-xl bg-background/50 border-input text-xs font-semibold focus-visible:ring-2 focus-visible:ring-primary placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
              {isAmountRangeInvalid && (
                <span className="text-[10px] text-destructive font-semibold select-none pt-0.5 pl-1">
                  Minimum amount cannot exceed maximum.
                </span>
              )}
            </div>
          </div>

          <Separator className="opacity-40" />

          {/* Transaction Type Section */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">Transaction Type</Label>
            </div>
            
            <div className="relative flex w-full rounded-2xl p-0.5 bg-muted/50 border border-border/30 h-10">
              {transactionTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setDraftFilters(prev => ({ ...prev, onlineStatus: type.id }))}
                  className={cn(
                    "relative w-full rounded-xl py-1 text-xs font-bold text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0 select-none",
                    draftFilters.onlineStatus === type.id ? "text-foreground" : "hover:text-foreground/80"
                  )}
                >
                  <span className="relative z-10 flex items-center justify-center gap-1.5 h-full">
                    {type.icon && cloneElement(type.icon as React.ReactElement, { className: 'h-3.5 w-3.5 flex-shrink-0' })}
                    {type.label}
                  </span>
                  {draftFilters.onlineStatus === type.id && (
                    <div className="absolute inset-0 rounded-xl shadow-sm bg-background border border-border/20 transition-all duration-200" />
                  )}
                </button>
              ))}
            </div>
          </div>

        </div>
      </BottomFloatingForm>
    </>
  );
}
