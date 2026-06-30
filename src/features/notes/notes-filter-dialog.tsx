'use client';

import { useState, useEffect, useMemo } from 'react';
import { FlowDialog } from '@/components/flow-popups/flow-dialog';
import { FlowPopupHeader } from '@/components/flow-popups/flow-popup-header';
import { FlowPopupFooter } from '@/components/flow-popups/flow-popup-footer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, DollarSign, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, getCurrencySymbol } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import type { Note } from '@/types/domain';
import { DateRange } from 'react-day-picker';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/components/providers/app-provider';
import { CategoryFilterDropdown } from '../settings/category-filter-dropdown';
import { addMonths, startOfMonth, endOfMonth, format } from 'date-fns';

interface NotesFilterDialogProps {
  children: React.ReactNode;
  setFilteredNotes: (notes: Note[]) => void;
  filteredNotes: Note[];
}

export function NotesFilterDialog({ children, setFilteredNotes, filteredNotes }: NotesFilterDialogProps) {
  const [open, setOpen] = useState(false);
  const { notes, currency } = useApp();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleApplyFilters = () => {
    let newFilteredNotes = [...notes];

    if (selectedCategories.length > 0) {
      newFilteredNotes = newFilteredNotes.filter(note =>
        selectedCategories.includes(note.category)
      );
    }

    if (dateRange?.from) {
      newFilteredNotes = newFilteredNotes.filter(
        note => note.date >= dateRange.from!
      );
    }

    if (dateRange?.to) {
        const toDate = new Date(dateRange.to);
        newFilteredNotes = newFilteredNotes.filter(
            note => note.date <= toDate
        );
    }

    if (priceRange.min) {
      newFilteredNotes = newFilteredNotes.filter(
        note => note.amount >= parseFloat(priceRange.min)
      );
    }

    if (priceRange.max) {
      newFilteredNotes = newFilteredNotes.filter(
        note => note.amount <= parseFloat(priceRange.max)
      );
    }

    setFilteredNotes(newFilteredNotes);
    setOpen(false);
  };
  
  const handleMonthChange = (direction: 'next' | 'prev') => {
    const newMonth = addMonths(currentMonth, direction === 'next' ? 1 : -1);
    setCurrentMonth(newMonth);
    setDateRange({
        from: startOfMonth(newMonth),
        to: endOfMonth(newMonth),
    });
  };

  const handleResetFilters = () => {
    setDateRange(undefined);
    setPriceRange({ min: '', max: '' });
    setSelectedCategories([]);
    setCurrentMonth(new Date());
    setFilteredNotes(notes);
    setOpen(false);
  };
  
  const activeFiltersCount = useMemo(() => {
    return [
      dateRange !== undefined,
      priceRange.min !== '' || priceRange.max !== '',
      selectedCategories.length > 0,
    ].filter(Boolean).length;
  }, [dateRange, priceRange, selectedCategories]);

  useEffect(() => {
    if (filteredNotes === notes) {
      setDateRange(undefined);
      setPriceRange({ min: '', max: '' });
      setSelectedCategories([]);
      setCurrentMonth(new Date());
    }
  }, [filteredNotes, notes]);
  
  const isFullMonthSelected = useMemo(() => {
    return !!(dateRange?.from && dateRange?.to &&
      dateRange.from.getDate() === 1 &&
      endOfMonth(dateRange.from).getDate() === dateRange.to.getDate());
  }, [dateRange]);

  return (
    <>
      <div className="inline-block cursor-pointer" onClick={() => setOpen(true)}>
        {children}
      </div>

      <FlowDialog open={open} onOpenChange={setOpen} className="p-5 select-none">
        <FlowPopupHeader
          title="Filter Notes"
          description={
            activeFiltersCount > 0 
              ? `Showing results for ${activeFiltersCount} active filter${activeFiltersCount > 1 ? 's' : ''}.`
              : "Refine your view."
          }
          onClose={() => setOpen(false)}
        />
        <div className="grid gap-3 py-2 sm:gap-4 sm:py-4">
          
          <div className="space-y-2">
             <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">Category</Label>
             </div>
             <CategoryFilterDropdown 
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                parentOpen={open}
             />
          </div>
          
          <Separator className="opacity-40" />
          
          <div className="space-y-2">
             <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                <CalendarIcon className="h-3.5 w-3.5" />
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">Date Range</Label>
             </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => handleMonthChange('prev')}>
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn(
                      "w-full justify-center text-center font-semibold h-10 rounded-xl text-xs",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    {isFullMonthSelected ? (
                      format(dateRange!.from!, 'MMMM yyyy')
                    ) : dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border shadow-lg z-[75]" align="center">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                  />
                </PopoverContent>
              </Popover>
               <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => handleMonthChange('next')}>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <Separator className="opacity-40" />

          <div className="space-y-2">
             <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">Amount Range</Label>
             </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 font-semibold text-xs select-none">
                    {getCurrencySymbol(currency)}
                </span>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={e => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="pl-7 h-10 rounded-xl bg-background/50 border-input text-xs font-semibold focus-visible:ring-2 focus-visible:ring-primary placeholder:text-muted-foreground/50"
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
                  value={priceRange.max}
                  onChange={e => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="pl-7 h-10 rounded-xl bg-background/50 border-input text-xs font-semibold focus-visible:ring-2 focus-visible:ring-primary placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
          </div>
        </div>
        <FlowPopupFooter className="grid grid-cols-2 gap-3 pt-4 border-t border-border/60 mt-5">
            <Button onClick={handleResetFilters} variant="outline" className="w-full rounded-xl h-10 text-xs font-bold hover:bg-muted/30 transition-colors">Reset</Button>
            <Button onClick={handleApplyFilters} className="w-full rounded-xl h-10 text-xs font-bold active:scale-[0.98] transition-transform">Apply Filters</Button>
        </FlowPopupFooter>
      </FlowDialog>
    </>
  );
}
