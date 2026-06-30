'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { ExpensesChart } from '@/features/expenses/expenses-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Expense } from '@/types/domain';
import { ExpensesFilterDialog } from '@/features/expenses/expenses-filter-dialog';
import { Button } from '@/components/ui/button';
import { LayoutGrid, ListFilter, CalendarDays, Maximize, Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraphDataBreakdown } from '@/features/graph/graph-data-breakdown';
import { ExpensesChartFullscreen } from '@/features/expenses/expenses-chart-fullscreen';
import { useIsMobile } from '@/hooks/use-mobile';
import { useApp } from '@/components/providers/app-provider';
import { Input } from '@/components/ui/input';
import { startOfMonth, endOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { type ExpenseFilters, normalizeExpenseFilters, applyExpenseFiltersSync } from '@/lib/filtering';

export default function GraphPage() {
  const { expenses, graphStyle, graphXAxis, setGraphXAxis } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isMobile = useIsMobile();
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Memoize the default month date range
  const defaultDateRange = useMemo(() => {
    const now = new Date();
    return {
      from: startOfMonth(now),
      to: endOfMonth(now),
    };
  }, []);

  // Lifted Filter States
  const [appliedFilters, setAppliedFilters] = useState<ExpenseFilters>({
    selectedCategories: [],
    dateRange: defaultDateRange,
    priceRange: { min: '', max: '' },
    onlineStatus: 'all'
  });

  // Auto-correct stale Donut + Date grouping state combination
  useEffect(() => {
    if (graphStyle === 'donut' && graphXAxis === 'date') {
      setGraphXAxis('category');
    }
  }, [graphStyle, graphXAxis, setGraphXAxis]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const finalExpenses = useMemo(() => {
    const criteria = normalizeExpenseFilters(appliedFilters, debouncedSearchTerm);
    return applyExpenseFiltersSync(expenses || [], criteria);
  }, [expenses, appliedFilters, debouncedSearchTerm]);

  const activeFiltersCount = useMemo(() => {
    const now = new Date();
    const defaultFrom = startOfMonth(now);
    const defaultTo = endOfMonth(now);
    
    const isDefaultDate = appliedFilters.dateRange?.from && appliedFilters.dateRange?.to &&
      new Date(appliedFilters.dateRange.from).toDateString() === defaultFrom.toDateString() &&
      new Date(appliedFilters.dateRange.to).toDateString() === defaultTo.toDateString();

    return [
      appliedFilters.selectedCategories.length > 0,
      !isDefaultDate && appliedFilters.dateRange !== undefined,
      appliedFilters.priceRange.min !== '' || appliedFilters.priceRange.max !== '',
      appliedFilters.onlineStatus !== 'all',
    ].filter(Boolean).length;
  }, [appliedFilters]);

  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl pb-[calc(2.5rem+var(--safe-area-bottom))] pl-[calc(1rem+var(--safe-area-left))] pr-[calc(1rem+var(--safe-area-right))]">
      <div className="space-y-6">
        <header className="text-left">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground">Insights</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Visual statistics and spending analytics.</p>
        </header>

        <Card ref={chartContainerRef} className="border bg-card/60 backdrop-blur-md shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-bold">Spending Trend</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">Default view displays current monthly transactions.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    {isMobile && (
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" onClick={handleFullscreen}>
                        <Maximize className="h-5 w-5" />
                        <span className="sr-only">Fullscreen</span>
                    </Button>
                    )}
                    {graphStyle !== 'donut' && (
                      <Tabs value={graphXAxis} onValueChange={(value) => setGraphXAxis(value as 'category' | 'date')}>
                          <TabsList className="rounded-2xl h-12 p-1 bg-muted/60">
                          <TabsTrigger value="category" className="h-10 rounded-xl text-xs font-semibold px-3 flex gap-1.5 items-center data-[state=active]:rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0">
                              <LayoutGrid className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">By category</span>
                          </TabsTrigger>
                          <TabsTrigger value="date" className="h-10 rounded-xl text-xs font-semibold px-3 flex gap-1.5 items-center data-[state=active]:rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0">
                              <CalendarDays className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">By date</span>
                          </TabsTrigger>
                          </TabsList>
                      </Tabs>
                    )}
                    <ExpensesFilterDialog 
                      appliedFilters={appliedFilters}
                      setAppliedFilters={setAppliedFilters}
                      defaultDateRange={defaultDateRange}
                    >
                        <Button variant="outline" className="relative h-12 rounded-xl px-4 text-xs font-semibold flex items-center gap-2">
                        <ListFilter className="h-5 w-5" />
                        <span className="hidden sm:inline">Filter</span>
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                            {activeFiltersCount}
                            </span>
                        )}
                        </Button>
                    </ExpensesFilterDialog>
                </div>
            </div>
            <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search displayed results..."
                    className="pl-10 h-12 rounded-xl text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ExpensesChart expenses={finalExpenses} />
          </CardContent>
        </Card>

        {finalExpenses.length > 0 && <GraphDataBreakdown expenses={finalExpenses} />}

      </div>
       {isFullscreen && (
        <ExpensesChartFullscreen
          expenses={finalExpenses}
          onClose={handleExitFullscreen}
        />
      )}
    </div>
  )
}
