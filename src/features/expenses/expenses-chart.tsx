
import { useMemo, useState, useEffect } from 'react';
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatDay } from '@/lib/utils';
import type { ChartConfig } from '@/components/ui/chart';
import { CategoryIcon } from '@/components/icons/category-icon';
import type { Expense } from '@/types/domain';
import { useApp } from '@/components/providers/app-provider';
import { BarChart2 } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { chartMotionConfig } from '@/lib/motion-presets';

interface ExpensesChartProps {
  expenses: Expense[];
  isFullscreen?: boolean;
}

export function ExpensesChart({ expenses = [], isFullscreen = false }: ExpensesChartProps) {
  const { graphStyle, graphXAxis, categories, currency, isMotionReady } = useApp();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const motionConfig = chartMotionConfig(shouldReduceMotion, isMotionReady);



  const { chartData, chartConfig } = useMemo(() => {
    const tStart = performance.now();
    const config: ChartConfig = {};
    let data;

    const useCategory = graphXAxis === 'category' || graphStyle === 'donut';

    if (useCategory) {
      const dataMap = new Map<string, number>();
      const len = expenses.length;
      for (let i = 0; i < len; i++) {
        const expense = expenses[i];
        if (!expense || !expense.category) continue;
        const amt = typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount as any);
        if (isNaN(amt)) continue;
        dataMap.set(expense.category, (dataMap.get(expense.category) || 0) + amt);
      }
      data = Array.from(dataMap.entries()).map(([name, value]) => ({ name, value, fill: categories.find(c=>c.name === name)?.color || '#8884d8' }));
      categories.forEach(cat => {
        config[cat.name] = { label: cat.name, color: cat.color };
      });
    } else { // by date
      const numExpenses = expenses.length;
      let needsMonthlyAggregation = false;
      if (numExpenses > 0) {
        const newestDate = expenses[0]?.date instanceof Date ? expenses[0].date : new Date(expenses[0]?.date);
        const oldestDate = expenses[numExpenses - 1]?.date instanceof Date ? expenses[numExpenses - 1].date : new Date(expenses[numExpenses - 1]?.date);
        if (!isNaN(newestDate.getTime()) && !isNaN(oldestDate.getTime())) {
          const diffMs = newestDate.getTime() - oldestDate.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          if (diffDays > 90) {
            needsMonthlyAggregation = true;
          }
        }
      }

      if (needsMonthlyAggregation) {
        const monthlyMap = new Map<number, { total: number, dateObj: Date }>();
        const len = expenses.length;
        for (let i = 0; i < len; i++) {
          const expense = expenses[i];
          if (!expense || !expense.date) continue;
          const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
          if (isNaN(expenseDate.getTime())) continue;
          const amt = typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount as any);
          if (isNaN(amt)) continue;
          const monthKey = expenseDate.getFullYear() * 100 + (expenseDate.getMonth() + 1);
          const currentData = monthlyMap.get(monthKey) || { total: 0, dateObj: new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1) };
          monthlyMap.set(monthKey, { total: currentData.total + amt, dateObj: currentData.dateObj });
        }
        const sortedDates = Array.from(monthlyMap.values()).sort((a,b) => a.dateObj.getTime() - b.dateObj.getTime());
        data = sortedDates.map(item => ({
          name: item.dateObj.toLocaleDateString('default', { month: 'short', year: 'numeric' }),
          value: item.total,
          fullDate: item.dateObj.toLocaleDateString('default', { month: 'long', year: 'numeric' })
        }));
      } else {
        const dataMap = new Map<number, { total: number, dateObj: Date }>();
        const len = expenses.length;
        for (let i = 0; i < len; i++) {
          const expense = expenses[i];
          if (!expense || !expense.date) continue;
          const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
          if (isNaN(expenseDate.getTime())) continue;
          const amt = typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount as any);
          if (isNaN(amt)) continue;
          const dateKey = expenseDate.getFullYear() * 10000 + (expenseDate.getMonth() + 1) * 100 + expenseDate.getDate();
          const currentData = dataMap.get(dateKey) || { total: 0, dateObj: expenseDate };
          dataMap.set(dateKey, { total: currentData.total + amt, dateObj: expenseDate });
        }
        const sortedDates = Array.from(dataMap.values()).sort((a,b) => a.dateObj.getTime() - b.dateObj.getTime());
        data = sortedDates.map(item => ({
          name: item.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: item.total,
          fullDate: item.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }));
      }
      
      config.value = {
        label: "Spend",
        color: "hsl(var(--primary))"
      }
    }

    const tEnd = performance.now();
    if (typeof window !== 'undefined' && (window as any).__flow_perf) {
      (window as any).__flow_perf.graphAggregationTime = Math.round(tEnd - tStart);
    }

    return { chartData: data, chartConfig: config };
  }, [expenses, categories, graphXAxis, graphStyle]);

  const summaryText = useMemo(() => {
    if (expenses.length === 0) return "You recorded no transactions in this period.";
    
    const totalSpend = expenses.reduce((sum, e) => {
      if (!e) return sum;
      const amt = typeof e.amount === 'number' ? e.amount : parseFloat(e.amount as any);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
    const useCategory = graphXAxis === 'category' || graphStyle === 'donut';
    
    if (useCategory) {
      const dataMap = new Map<string, number>();
      expenses.forEach(expense => {
          if (!expense || !expense.category) return;
          const amt = typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount as any);
          if (isNaN(amt)) return;
          dataMap.set(expense.category, (dataMap.get(expense.category) || 0) + amt);
      });
      let topCat = { name: '', value: 0 };
      for (const [name, value] of dataMap.entries()) {
        if (value > topCat.value) {
          topCat = { name, value };
        }
      }
      const pct = totalSpend > 0 ? (topCat.value / totalSpend) * 100 : 0;
      return topCat.value > 0
        ? `${topCat.name} is your top category in this period, representing ${formatCurrency(topCat.value, currency)} (${pct.toFixed(0)}% of total spent).`
        : "No category data found.";
    } else {
      const dataMap = new Map<number, { total: number, dateObj: Date }>();
      expenses.forEach(expense => {
        if (!expense || !expense.date) return;
        const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
        if (isNaN(expenseDate.getTime())) return;
        const amt = typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount as any);
        if (isNaN(amt)) return;
        const dateKey = expenseDate.getFullYear() * 10000 + (expenseDate.getMonth() + 1) * 100 + expenseDate.getDate();
        const currentData = dataMap.get(dateKey) || { total: 0, dateObj: expenseDate };
        dataMap.set(dateKey, { total: currentData.total + amt, dateObj: expenseDate });
      });
      let topDay = { dateStr: '', total: 0 };
      for (const data of dataMap.values()) {
        if (data.total > topDay.total) {
          const formatted = data.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          topDay = { dateStr: formatted, total: data.total };
        }
      }
      return topDay.total > 0
        ? `Highest daily spend was recorded on ${topDay.dateStr} with a total of ${formatCurrency(topDay.total, currency)}.`
        : "No daily transaction data found.";
    }
  }, [expenses, graphXAxis, graphStyle, currency]);

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3 min-h-[300px]">
        <div className="p-4 bg-muted/40 rounded-3xl text-muted-foreground">
          <BarChart2 className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">No spending data yet</p>
        <p className="text-xs text-muted-foreground max-w-[250px] leading-relaxed">
          Add transactions or adjust your active filters to see trends and category insights.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const useCategory = graphXAxis === 'category' || graphStyle === 'donut';
      const title = useCategory ? 'Category' : 'Date';
      const name = useCategory ? data.name : data.fullDate || data.name;
      const amount = data.value;

      return (
        <div className="rounded-xl border border-border/50 bg-background p-3 shadow-xl max-w-[240px]">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
              {title}
            </span>
            <span className="font-bold text-sm text-foreground block truncate">{name}</span>
          </div>
          <div className="space-y-1 mt-2 border-t border-border/40 pt-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
              Amount
            </span>
            <span className="font-bold text-sm text-primary block">
              {formatCurrency(amount, currency)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };
  
  const CategoryTick = ({ x, y, payload }: any) => {
    const category = categories.find(c => c.name === payload.value);
    if (!category) return null;

    return (
      <g transform={`translate(${x},${y})`}>
        <foreignObject x={-12} y={5} width={24} height={24}>
          <div className="flex items-center justify-center">
            <CategoryIcon name={category.icon} style={{color: category.color}} className="h-5 w-5" />
          </div>
        </foreignObject>
      </g>
    );
  };
    
  const renderChart = () => {
    const isCategoryAxis = graphXAxis === 'category' || graphStyle === 'donut';
    const chartMargin = { top: 15, right: 10, left: 10, bottom: 5 };
    const activeStyle = graphStyle === 'line' || graphStyle === 'donut' ? graphStyle : 'bar';
    const containerKey = activeStyle;

    // 1. BAR CHART
    if (activeStyle === 'bar') {
      return (
        <ResponsiveContainer key={containerKey} width="100%" height={isFullscreen ? '100%' : 300}>
          <BarChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.4)" vertical={false} />
            <XAxis 
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              angle={0}
              textAnchor="middle"
              height={30}
              tick={isCategoryAxis ? <CategoryTick /> : undefined}
              interval={isCategoryAxis ? 0 : 'preserveStartEnd'}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => formatCurrency(value as number, currency)} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)', radius: 4 }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} {...motionConfig}>
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={isCategoryAxis ? (chartConfig[entry.name]?.color || '#8884d8') : 'hsl(var(--primary))'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // 2. LINE CHART
    if (activeStyle === 'line') {
      return (
        <ResponsiveContainer key={containerKey} width="100%" height={isFullscreen ? '100%' : 300}>
          <LineChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.4)" vertical={false} />
            <XAxis 
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              angle={0}
              textAnchor="middle"
              height={30}
              tick={isCategoryAxis ? <CategoryTick /> : undefined}
              interval={isCategoryAxis ? 0 : 'preserveStartEnd'}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => formatCurrency(value as number, currency)} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground) / 0.2)' }} />
            <Line type="linear" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} activeDot={{ r: 6 }} {...motionConfig} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // 3. DONUT CHART
    if (activeStyle === 'donut') {
      return (
        <ResponsiveContainer key={containerKey} width="100%" height={isFullscreen ? '100%' : 300}>
          <PieChart>
            <Pie
              data={chartData}
              nameKey="name"
              dataKey="value"
              innerRadius={isFullscreen ? 75 : 60}
              outerRadius={isFullscreen ? 110 : 90}
              paddingAngle={2}
              {...motionConfig}
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={isCategoryAxis ? (chartConfig[entry.name]?.color || '#8884d8') : 'hsl(var(--primary))'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  return (
    <div className={isFullscreen ? "w-full h-full relative" : "space-y-4"}>
      <div className={isFullscreen ? "w-full h-full relative" : "w-full min-h-[300px] relative"}>
        {renderChart()}
      </div>
      {!isFullscreen && (
        <div className="bg-muted/30 border border-border/40 rounded-2xl p-4 flex items-start gap-3 mt-2">
          <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Insight:</span> {summaryText}
          </p>
        </div>
      )}
    </div>
  );
}
