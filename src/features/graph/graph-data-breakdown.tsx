
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CategoryIcon } from '@/components/icons/category-icon';
import type { Expense } from '@/types/domain';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/components/providers/app-provider';

interface GraphDataBreakdownProps {
  expenses: Expense[];
}

export function GraphDataBreakdown({ expenses }: GraphDataBreakdownProps) {
  const { graphXAxis, currency, categories } = useApp();

  const totalSpend = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  const categoryBreakdown = useMemo(() => {
    if (graphXAxis !== 'category' || totalSpend === 0) return [];
    const spendByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(spendByCategory)
      .map(([name, amount]) => {
        const cat = categories.find(c => c.name === name);
        return {
          name,
          amount,
          percentage: (amount / totalSpend) * 100,
          icon: cat?.icon || 'Circle',
          color: cat?.color || '#909296'
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, categories, totalSpend, graphXAxis]);

  const dateBreakdown = useMemo(() => {
    if (graphXAxis !== 'date') return [];
    const spendByDate = expenses.reduce((acc, expense) => {
        const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
        if (isNaN(expenseDate.getTime())) return acc;
        const dateStr = formatDate(expenseDate, { year: 'numeric', month: 'long', day: 'numeric'});
        acc[dateStr] = (acc[dateStr] || 0) + expense.amount;
        return acc;
    }, {} as Record<string, number>);
    
    const breakdown = Object.entries(spendByDate)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const maxAmount = Math.max(...breakdown.map(item => item.amount), 0);

    return breakdown.map(item => ({
        ...item,
        percentage: maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0
    }));

  }, [expenses, graphXAxis]);

  return (
    <Card className="border bg-card/60 backdrop-blur-md shadow-sm rounded-3xl overflow-hidden">
      <CardHeader>
        <CardTitle>Data Breakdown</CardTitle>
        <CardDescription>
            A summary of your spending based on the current filters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {graphXAxis === 'category' ? (
            categoryBreakdown.map((item) => (
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
                      aria-label={`${item.name} spending breakdown progress`}
                    />
                </div>
            ))
          ) : (
             dateBreakdown.map((item) => (
                <div key={item.date} className="space-y-2">
                    <div className="flex justify-between items-baseline">
                         <span className="text-sm text-muted-foreground">{item.date}</span>
                        <span className="text-sm font-medium">{formatCurrency(item.amount, currency)}</span>
                    </div>
                    <Progress 
                      value={item.percentage} 
                      aria-label={`Spending progress on ${item.date}`}
                    />
                </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
