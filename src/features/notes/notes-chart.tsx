
import { useTheme } from '@/components/providers/theme-provider';
import { useMemo, useState, useEffect } from 'react';
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatDay, formatDate, generateColor } from '@/lib/utils';
import type { ChartConfig } from '@/components/ui/chart';
import { CategoryIcon } from '@/components/icons/category-icon';
import type { Note } from '@/types/domain';
import { useApp } from '@/components/providers/app-provider';
import { BarChart2 } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { chartMotionConfig } from '@/lib/motion-presets';

interface NotesChartProps {
  notes: Note[];
  isFullscreen?: boolean;
}

export function NotesChart({ notes, isFullscreen = false }: NotesChartProps) {
  const { graphStyle, graphXAxis, categories, currency, dateEvents, isMotionReady } = useApp();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const shouldReduceMotion = useReducedMotion() ?? false;
  const motionConfig = chartMotionConfig(shouldReduceMotion, isMotionReady);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let rAFId: number | null = null;
    let isMounted = true;
    const handleResize = () => {
      if (rAFId) cancelAnimationFrame(rAFId);
      rAFId = requestAnimationFrame(() => {
        if (isMounted) {
          setDimensions({
            width: window.innerWidth,
            height: window.innerHeight
          });
        }
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      isMounted = false;
      if (rAFId) cancelAnimationFrame(rAFId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const { chartData, chartConfig } = useMemo(() => {
    const config: ChartConfig = {};
    let data: any[] = [];

    const processData = (dataMap: Map<string, number>, colorMapping: Record<string, string> = {}) => {
        return Array.from(dataMap.entries()).map(([name, value]) => ({
            name,
            value,
            fill: colorMapping[name] || 'hsl(var(--primary))'
        }));
    };

    const activeXAxis = (graphXAxis === 'date' && graphStyle === 'donut') ? 'category' : graphXAxis;

    if (activeXAxis === 'category') {
        const dataMap = new Map<string, number>();
        notes.forEach(note => {
            dataMap.set(note.category, (dataMap.get(note.category) || 0) + note.amount);
        });
        const categoryColors = Object.fromEntries(categories.map(c => [c.name, c.color]));
        data = processData(dataMap, categoryColors);
        categories.forEach(cat => {
            config[cat.name] = { label: cat.name, color: cat.color, icon: (props: any) => <CategoryIcon name={cat.icon} {...props} /> };
        });
    } else if (activeXAxis === 'date') {
        const dataMap = new Map<number, { total: number, dateObj: Date }>();
        notes.forEach(note => {
            const noteDate = note.date instanceof Date ? note.date : new Date(note.date);
            if (isNaN(noteDate.getTime())) return;
            const dateKey = noteDate.getFullYear() * 10000 + (noteDate.getMonth() + 1) * 100 + noteDate.getDate();
            const current = dataMap.get(dateKey) || { total: 0, dateObj: noteDate };
            dataMap.set(dateKey, { ...current, total: current.total + note.amount });
        });

        let sortedDates;
        const needsMonthlyAggregation = dataMap.size > 90;

        if (needsMonthlyAggregation) {
            const monthlyMap = new Map<number, { total: number, dateObj: Date }>();
            notes.forEach(note => {
                const noteDate = note.date instanceof Date ? note.date : new Date(note.date);
                if (isNaN(noteDate.getTime())) return;
                const monthKey = noteDate.getFullYear() * 100 + (noteDate.getMonth() + 1);
                const current = monthlyMap.get(monthKey) || { total: 0, dateObj: new Date(noteDate.getFullYear(), noteDate.getMonth(), 1) };
                monthlyMap.set(monthKey, { total: current.total + note.amount, dateObj: current.dateObj });
            });
            sortedDates = Array.from(monthlyMap.values()).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
        } else {
            sortedDates = Array.from(dataMap.values()).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
        }

        data = sortedDates.map(item => ({
            name: needsMonthlyAggregation
                ? item.dateObj.toLocaleDateString('default', { month: 'short', year: 'numeric' })
                : item.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: item.total,
            fullDate: needsMonthlyAggregation
                ? item.dateObj.toLocaleDateString('default', { month: 'long', year: 'numeric' })
                : item.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            fill: 'hsl(var(--primary))'
        }));
        config.value = { label: "Spend", color: "hsl(var(--primary))" };
    } else if (activeXAxis === 'person') {
        const dataMap = new Map<string, number>();
        notes.forEach(note => {
            dataMap.set(note.person, (dataMap.get(note.person) || 0) + note.amount);
        });
        const personColors = Object.fromEntries(Array.from(dataMap.keys()).map(person => [person, generateColor(person, isDark)]));
        data = processData(dataMap, personColors);
        Array.from(dataMap.keys()).forEach(person => {
            config[person] = { label: person, color: personColors[person], icon: (props: any) => <CategoryIcon name="User" {...props} /> };
        });
    } else if (activeXAxis === 'event') {
        const dataMap = new Map<string, number>();
        notes.forEach(note => {
            const dateStr = formatDate(note.date);
            const eventName = dateEvents[dateStr] || 'No Event';
            dataMap.set(eventName, (dataMap.get(eventName) || 0) + note.amount);
        });
        const eventColors = Object.fromEntries(Array.from(dataMap.keys()).map(event => [event, generateColor(event, isDark)]));
        data = processData(dataMap, eventColors);
        Array.from(dataMap.keys()).forEach(event => {
            config[event] = { label: event, color: eventColors[event], icon: (props: any) => <CategoryIcon name="BookCopy" {...props} /> };
        });
    }

    return { chartData: data, chartConfig: config };
  }, [notes, categories, graphXAxis, graphStyle, dateEvents, isDark]);

  const summaryText = useMemo(() => {
    if (notes.length === 0) return "You recorded no notes in this period.";
    
    const totalSpend = notes.reduce((sum, e) => sum + e.amount, 0);
    const activeXAxis = (graphXAxis === 'date' && graphStyle === 'donut') ? 'category' : graphXAxis;
    
    if (activeXAxis === 'category') {
      const dataMap = new Map<string, number>();
      notes.forEach(note => {
          dataMap.set(note.category, (dataMap.get(note.category) || 0) + note.amount);
      });
      let topCat = { name: '', value: 0 };
      for (const [name, value] of dataMap.entries()) {
        if (value > topCat.value) {
          topCat = { name, value };
        }
      }
      const pct = totalSpend > 0 ? (topCat.value / totalSpend) * 100 : 0;
      return topCat.value > 0
        ? `${topCat.name} is the top notes category in this period, representing ${formatCurrency(topCat.value, currency)} (${pct.toFixed(0)}% of notes spend).`
        : "No category data found.";
    } else if (activeXAxis === 'person') {
      const dataMap = new Map<string, number>();
      notes.forEach(note => {
          dataMap.set(note.person, (dataMap.get(note.person) || 0) + note.amount);
      });
      let topPerson = { name: '', value: 0 };
      for (const [name, value] of dataMap.entries()) {
        if (value > topPerson.value) {
          topPerson = { name, value };
        }
      }
      const pct = totalSpend > 0 ? (topPerson.value / totalSpend) * 100 : 0;
      return topPerson.value > 0
        ? `${topPerson.name} has the highest logged notes value in this period, with a total of ${formatCurrency(topPerson.value, currency)} (${pct.toFixed(0)}% of notes spend).`
        : "No contributor data found.";
    } else if (activeXAxis === 'event') {
      const dataMap = new Map<string, number>();
      notes.forEach(note => {
          const dateStr = formatDate(note.date);
          const eventName = dateEvents[dateStr] || 'No Event';
          dataMap.set(eventName, (dataMap.get(eventName) || 0) + note.amount);
      });
      let topEvent = { name: '', value: 0 };
      for (const [name, value] of dataMap.entries()) {
        if (value > topEvent.value) {
          topEvent = { name, value };
        }
      }
      const pct = totalSpend > 0 ? (topEvent.value / totalSpend) * 100 : 0;
      return topEvent.value > 0
        ? `Event "${topEvent.name}" represents the largest note spend segment with ${formatCurrency(topEvent.value, currency)} (${pct.toFixed(0)}% of notes spend).`
        : "No event data found.";
    } else {
      const dataMap = new Map<number, { total: number, dateObj: Date }>();
      notes.forEach(note => {
        const noteDate = note.date instanceof Date ? note.date : new Date(note.date);
        if (isNaN(noteDate.getTime())) return;
        const dateKey = noteDate.getFullYear() * 10000 + (noteDate.getMonth() + 1) * 100 + noteDate.getDate();
        const current = dataMap.get(dateKey) || { total: 0, dateObj: noteDate };
        dataMap.set(dateKey, { total: current.total + note.amount, dateObj: noteDate });
      });
      let topDay = { dateStr: '', total: 0 };
      for (const data of dataMap.values()) {
        if (data.total > topDay.total) {
          const formatted = data.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          topDay = { dateStr: formatted, total: data.total };
        }
      }
      return topDay.total > 0
        ? `Highest daily note value was recorded on ${topDay.dateStr} with a total of ${formatCurrency(topDay.total, currency)}.`
        : "No daily notes data found.";
    }
  }, [notes, graphXAxis, graphStyle, currency, dateEvents]);

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3 min-h-[300px]">
        <div className="p-4 bg-muted/40 rounded-3xl text-muted-foreground">
          <BarChart2 className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">No notes data yet</p>
        <p className="text-xs text-muted-foreground max-w-[250px] leading-relaxed">
          Add notes or adjust your active filters to see trends and contributor insights.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const activeXAxis = (graphXAxis === 'date' && graphStyle === 'donut') ? 'category' : graphXAxis;
      const title = activeXAxis;
      const name = activeXAxis === 'date' ? data.fullDate || data.name : data.name;
      const amount = data.value;

      return (
        <div className="rounded-xl border border-border/50 bg-background p-3 shadow-xl max-w-[240px]">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
              {title}
            </span>
            <span className="font-bold text-sm text-foreground block truncate capitalize">{name}</span>
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
  
  const CustomTick = ({ x, y, payload }: any) => {
    const itemConfig = chartConfig[payload.value];
    if (!itemConfig || !itemConfig.icon) return null;

    const Icon = itemConfig.icon as React.ComponentType<any>;

    return (
      <g transform={`translate(${x},${y})`}>
        <foreignObject x={-12} y={5} width={24} height={24}>
          <div className="flex items-center justify-center">
            <Icon style={{color: itemConfig.color}} className="h-5 w-5" />
          </div>
        </foreignObject>
      </g>
    );
  };
    
  const renderChart = () => {
    const activeXAxis = (graphXAxis === 'date' && graphStyle === 'donut') ? 'category' : graphXAxis;
    const isCategoryAxis = ['category', 'person', 'event'].includes(activeXAxis);
    const chartMargin = { top: 15, right: 10, left: 10, bottom: 5 };

    const activeStyle = graphStyle === 'line' || graphStyle === 'donut' ? graphStyle : 'bar';
    const containerKey = `${activeStyle}-${dimensions.width}x${dimensions.height}`;

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
              tick={isCategoryAxis ? <CustomTick /> : undefined}
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
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
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
              tick={isCategoryAxis ? <CustomTick /> : undefined}
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
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
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
