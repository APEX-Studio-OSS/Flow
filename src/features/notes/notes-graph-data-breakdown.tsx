
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency, formatDate, generateColor } from '@/lib/utils';
import { CategoryIcon } from '@/components/icons/category-icon';
import type { Note } from '@/types/domain';
import { Progress } from '@/components/ui/progress';
import { useTheme } from '@/components/providers/theme-provider';
import { useApp } from '@/components/providers/app-provider';

interface NotesGraphDataBreakdownProps {
  notes: Note[];
}

export function NotesGraphDataBreakdown({ notes }: NotesGraphDataBreakdownProps) {
  const { graphXAxis, currency, categories, dateEvents } = useApp();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';


  const totalSpend = useMemo(() => notes.reduce((sum, e) => sum + e.amount, 0), [notes]);

  const breakdownData = useMemo(() => {
    if (totalSpend === 0) return [];
    
    let spendMap: Record<string, number> = {};

    if (graphXAxis === 'category') {
        notes.forEach(note => {
            spendMap[note.category] = (spendMap[note.category] || 0) + note.amount;
        });
        return Object.entries(spendMap)
            .map(([name, amount]) => {
                const cat = categories.find(c => c.name === name);
                return {
                    name,
                    amount,
                    percentage: (amount / totalSpend) * 100,
                    icon: cat?.icon || 'Circle',
                    color: cat?.color || '#909296',
                };
            })
            .sort((a, b) => b.amount - a.amount);
    }
    
    if (graphXAxis === 'date') {
        notes.forEach(note => {
            const noteDate = note.date instanceof Date ? note.date : new Date(note.date);
            if (isNaN(noteDate.getTime())) return;
            const dateStr = formatDate(noteDate, { year: 'numeric', month: 'long', day: 'numeric' });
            spendMap[dateStr] = (spendMap[dateStr] || 0) + note.amount;
        });
        const sorted = Object.entries(spendMap).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
        const maxAmount = Math.max(...sorted.map(([,amount]) => amount), 0);
        return sorted.map(([name, amount]) => ({
            name, amount, percentage: maxAmount > 0 ? (amount / maxAmount) * 100 : 0, icon: undefined, color: undefined
        }))
    }
    
    if (graphXAxis === 'person') {
        notes.forEach(note => {
            spendMap[note.person] = (spendMap[note.person] || 0) + note.amount;
        });
    }

    if (graphXAxis === 'event') {
        notes.forEach(note => {
            const noteDate = note.date instanceof Date ? note.date : new Date(note.date);
            if (isNaN(noteDate.getTime())) return;
            const dateStr = formatDate(noteDate);
            const eventName = dateEvents[dateStr] || 'No Event';
            spendMap[eventName] = (spendMap[eventName] || 0) + note.amount;
        });
    }

    return Object.entries(spendMap)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: (amount / totalSpend) * 100,
        icon: graphXAxis === 'person' ? 'User' : 'BookCopy',
        color: generateColor(name, isDark),
      }))
      .sort((a, b) => b.amount - a.amount);

  }, [notes, categories, totalSpend, graphXAxis, dateEvents, isDark]);


  return (
    <Card className="border bg-card/60 backdrop-blur-md shadow-sm rounded-3xl overflow-hidden">
      <CardHeader>
        <CardTitle>Data Breakdown</CardTitle>
        <CardDescription>
            A summary of your notes based on the current filters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {graphXAxis === 'date' ? (
             breakdownData.map((item) => (
                <div key={item.name} className="space-y-2">
                    <div className="flex justify-between items-baseline">
                         <span className="text-sm text-muted-foreground">{item.name}</span>
                        <span className="text-sm font-medium">{formatCurrency(item.amount, currency)}</span>
                    </div>
                    <Progress 
                      value={item.percentage} 
                      aria-label={`Notes spending progress on ${item.name}`}
                    />
                </div>
            ))
          ) : (
            breakdownData.map((item) => (
                <div key={item.name} className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <div className="flex items-center gap-2">
                            <CategoryIcon name={item.icon || 'Circle'} style={{color: item.color}} className="h-4 w-4" />
                            <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold text-right">{formatCurrency(item.amount, currency)}</span>
                            <span className="text-xs text-muted-foreground w-10 text-right">{item.percentage.toFixed(0)}%</span>
                        </div>
                    </div>
                    <Progress 
                      value={item.percentage} 
                      indicatorStyle={{backgroundColor: item.color}} 
                      aria-label={`Notes spending breakdown progress for ${item.name}`}
                    />
                </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
