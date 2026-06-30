
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { NotesChart } from '@/features/notes/notes-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Note } from '@/types/domain';
import { NotesFilterDialog } from '@/features/notes/notes-filter-dialog';
import { Button } from '@/components/ui/button';
import { LayoutGrid, ListFilter, CalendarDays, Maximize, User, BookCopy, Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotesGraphDataBreakdown } from '@/features/notes/notes-graph-data-breakdown';
import { NotesChartFullscreen } from '@/features/notes/notes-chart-fullscreen';
import { useIsMobile } from '@/hooks/use-mobile';
import { useApp } from '@/components/providers/app-provider';
import { Input } from '@/components/ui/input';

import { formatCurrency, formatDate } from '@/lib/utils';

export default function NotesGraphPage() {
  const { notes, graphStyle, graphXAxis, setGraphXAxis, currency, dateEvents } = useApp();
  const [baseFilteredNotes, setBaseFilteredNotes] = useState<Note[]>([]);
  const [finalNotes, setFinalNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isMobile = useIsMobile();
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // By default, show notes for the current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultFiltered = notes.filter(e => new Date(e.date) >= monthStart);
    setBaseFilteredNotes(defaultFiltered);
  }, [notes]);

  useEffect(() => {
    if (searchTerm) {
        setFinalNotes(baseFilteredNotes.filter(n => 
            n.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
            n.person.toLowerCase().includes(searchTerm.toLowerCase())
        ));
    } else {
        setFinalNotes(baseFilteredNotes);
    }
  }, [searchTerm, baseFilteredNotes]);
  
  const activeFiltersCount = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultMonthNotes = notes.filter(e => new Date(e.date) >= monthStart);
    
    if (baseFilteredNotes.length !== defaultMonthNotes.length) return 1;
    if (baseFilteredNotes.length === 0 && defaultMonthNotes.length === 0) return 0;
    
    const isSame = baseFilteredNotes.every(filteredNote => 
        defaultMonthNotes.some(defaultNote => defaultNote.id === filteredNote.id)
    );
    return isSame ? 0 : 1;
  }, [baseFilteredNotes, notes]);

  const totalSpent = useMemo(() => {
    return finalNotes.reduce((sum, n) => sum + n.amount, 0);
  }, [finalNotes]);

  const averageDailySpend = useMemo(() => {
    if (finalNotes.length === 0) return 0;
    const uniqueDays = new Set(finalNotes.map(n => new Date(n.date).toDateString())).size;
    return uniqueDays > 0 ? totalSpent / uniqueDays : 0;
  }, [finalNotes, totalSpent]);

  const topContributor = useMemo(() => {
    if (finalNotes.length === 0) return { label: 'Top category', name: 'None', amount: 0 };
    
    let key = 'category';
    let label = 'Top category';
    
    if (graphXAxis === 'person') {
      key = 'person';
      label = 'Top person';
    } else if (graphXAxis === 'event') {
      label = 'Top event';
    } else if (graphXAxis === 'date') {
      label = 'Peak day';
    }
    
    const spendMap = finalNotes.reduce((acc, note) => {
      let groupKey = '';
      if (graphXAxis === 'event') {
        const dateStr = formatDate(note.date);
        groupKey = dateEvents[dateStr] || 'No Event';
      } else if (graphXAxis === 'date') {
        groupKey = new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        groupKey = note[key as keyof Note] as string;
      }
      
      acc[groupKey] = (acc[groupKey] || 0) + note.amount;
      return acc;
    }, {} as Record<string, number>);
    
    let top = { label, name: 'None', amount: 0 };
    for (const [name, amount] of Object.entries(spendMap)) {
      if (amount > top.amount) {
        top = { label, name, amount };
      }
    }
    return top;
  }, [finalNotes, graphXAxis, dateEvents]);

  const peakSpendDay = useMemo(() => {
    if (finalNotes.length === 0) return { dateStr: 'None', amount: 0 };
    const spendByDay = finalNotes.reduce((acc, n) => {
      const dateStr = new Date(n.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      acc[dateStr] = (acc[dateStr] || 0) + n.amount;
      return acc;
    }, {} as Record<string, number>);
    
    let peak = { dateStr: 'None', amount: 0 };
    for (const [dateStr, amount] of Object.entries(spendByDay)) {
      if (amount > peak.amount) {
        peak = { dateStr, amount };
      }
    }
    return peak;
  }, [finalNotes]);

  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl pb-[calc(2.5rem+var(--safe-area-bottom))] pl-[calc(1rem+var(--safe-area-left))] pr-[calc(1rem+var(--safe-area-right))]">
      <div className="space-y-8">
        <header className="text-left">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground">Notes Insights</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Visual statistics and notes spending analytics.</p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border bg-card/60 backdrop-blur-md shadow-sm rounded-3xl p-5 flex flex-col justify-between min-h-[100px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total spent</span>
            <p className="text-2xl font-bold mt-2 text-foreground tabular-nums truncate">{formatCurrency(totalSpent, currency)}</p>
          </Card>
          <Card className="border bg-card/60 backdrop-blur-md shadow-sm rounded-3xl p-5 flex flex-col justify-between min-h-[100px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Daily average</span>
            <p className="text-2xl font-bold mt-2 text-foreground tabular-nums truncate">{formatCurrency(averageDailySpend, currency)}</p>
          </Card>
          <Card className="border bg-card/60 backdrop-blur-md shadow-sm rounded-3xl p-5 flex flex-col justify-between min-h-[100px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{topContributor.label}</span>
            <p className="text-2xl font-bold mt-2 text-foreground truncate" title={topContributor.name}>{topContributor.name}</p>
          </Card>
          <Card className="border bg-card/60 backdrop-blur-md shadow-sm rounded-3xl p-5 flex flex-col justify-between min-h-[100px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Peak spend day</span>
            <p className="text-2xl font-bold mt-2 text-foreground truncate">{peakSpendDay.amount > 0 ? `${peakSpendDay.dateStr}` : 'None'}</p>
          </Card>
        </div>

        <Card ref={chartContainerRef} className="border bg-card/60 backdrop-blur-md shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-bold">Notes Trend</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">Default view displays current monthly notes.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    {isMobile && (
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" onClick={handleFullscreen}>
                        <Maximize className="h-5 w-5" />
                        <span className="sr-only">Fullscreen</span>
                    </Button>
                    )}
                    <Tabs value={graphXAxis} onValueChange={(value) => setGraphXAxis(value as 'category' | 'date' | 'event' | 'person')}>
                        <TabsList className="rounded-2xl h-12 p-1 bg-muted/60">
                        <TabsTrigger value="category" className="h-10 rounded-xl text-xs font-semibold px-2 flex gap-1 items-center data-[state=active]:rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0">
                            <LayoutGrid className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Category</span>
                        </TabsTrigger>
                        {graphStyle !== 'donut' && (
                          <TabsTrigger value="date" className="h-10 rounded-xl text-xs font-semibold px-2 flex gap-1 items-center data-[state=active]:rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0">
                              <CalendarDays className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Date</span>
                          </TabsTrigger>
                        )}
                        <TabsTrigger value="event" className="h-10 rounded-xl text-xs font-semibold px-2 flex gap-1 items-center data-[state=active]:rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0">
                            <BookCopy className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Event</span>
                        </TabsTrigger>
                        <TabsTrigger value="person" className="h-10 rounded-xl text-xs font-semibold px-2 flex gap-1 items-center data-[state=active]:rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0">
                            <User className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Person</span>
                        </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <NotesFilterDialog setFilteredNotes={setBaseFilteredNotes} filteredNotes={baseFilteredNotes}>
                        <Button variant="outline" className="relative h-12 rounded-xl px-4 text-xs font-semibold flex items-center gap-2">
                        <ListFilter className="h-5 w-5" />
                        <span className="hidden sm:inline">Filter</span>
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                            {activeFiltersCount}
                            </span>
                        )}
                        </Button>
                    </NotesFilterDialog>
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
            <NotesChart notes={finalNotes} />
          </CardContent>
        </Card>

        {finalNotes.length > 0 && <NotesGraphDataBreakdown notes={finalNotes} />}

      </div>
       {isFullscreen && (
        <NotesChartFullscreen
          notes={finalNotes}
          onClose={handleExitFullscreen}
        />
      )}
    </div>
  )
}
