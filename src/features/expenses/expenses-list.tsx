'use client';

import { useState, useMemo, CSSProperties, memo, useRef, useEffect, useCallback } from 'react';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { CategoryIcon } from '@/components/icons/category-icon';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, Plus } from 'lucide-react';
import type { Expense, Category } from '@/types/domain';
import { DeleteExpenseDialog } from './delete-expense-dialog';
import { EditExpenseDialog } from './edit-expense-dialog';
import { TransactionTypeBadge } from './transaction-type-badge';
import { useApp } from '@/components/providers/app-provider';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { AddExpenseDialog } from './add-expense-dialog';

interface ExpensesListProps {
  expenses: Expense[];
  isFiltered?: boolean;
}

type ListItem = { type: 'date'; date: string } | { type: 'expense'; expense: Expense };

interface RowData {
  items: ListItem[];
  categoryMap: Map<string, Category>;
  currency: string;
  openMenuId: string | null;
  handleMenuToggle: (id: string) => void;
  setExpenseToEdit: (expense: Expense | null) => void;
  setExpenseToDelete: (expense: Expense | null) => void;
  shouldReduceMotion: boolean | null;
}

const Row = memo(({ index, style, data }: { index: number; style: CSSProperties; data: RowData }) => {
  const {
    items,
    categoryMap,
    currency,
    openMenuId,
    handleMenuToggle,
    setExpenseToEdit,
    setExpenseToDelete,
    shouldReduceMotion,
  } = data;

  const item = items[index];
  if (item.type === 'date') {
    let displayDate = item.date;
    try {
      const [y, m, d] = item.date.split('-');
      if (y && m && d) {
        const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
        displayDate = formatDate(dateObj);
      }
    } catch (e) {}

    return (
      <div style={style} className="flex items-end pb-2 pl-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 border border-border/40 px-3 py-1 rounded-full select-none">
          {displayDate}
        </span>
      </div>
    );
  }

  const { expense } = item;
  const categoryDetails = categoryMap.get(expense.category);
  const isMenuOpen = openMenuId === expense.id;

  // Fallbacks for deleted categories
  const categoryIcon = categoryDetails?.icon || 'Circle';
  const categoryColor = categoryDetails?.color || '#909296';

  return (
     <div style={style} className="pr-3 pl-1.5">
        <li className="flex items-center space-x-3 py-2 border-b border-border group h-full list-none">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-all" style={{ backgroundColor: `${categoryColor}15` }}>
            <CategoryIcon name={categoryIcon} style={{color: categoryColor}} className="h-5 w-5 transition-transform group-hover:scale-110" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate text-foreground">{expense.description}</p>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
              <span className="font-medium text-muted-foreground/80">{expense.category}</span>
              <span className="text-[10px] text-muted-foreground/30">•</span>
              <TransactionTypeBadge isOnline={expense.isOnline} />
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <AnimatePresence mode="wait">
              <motion.div
                key={isMenuOpen ? 'actions' : 'info'}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 8 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5"
              >
                {isMenuOpen ? (
                  <>
                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl" onClick={() => { setExpenseToEdit(expense); handleMenuToggle(expense.id); }}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="destructive" size="icon" className="h-11 w-11 rounded-xl" onClick={() => { setExpenseToDelete(expense); handleMenuToggle(expense.id); }}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </>
                ) : (
                  <div className="text-right mr-1">
                    <p className="font-bold text-sm text-foreground">{formatCurrency(expense.amount, currency)}</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-11 w-11 flex-shrink-0 rounded-full hover:bg-muted/65" 
              onClick={() => handleMenuToggle(expense.id)}
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </li>
     </div>
  );
});

Row.displayName = 'Row';

const getItemKey = (index: number, data: RowData) => {
  const item = data.items[index];
  if (item.type === 'date') {
    return `date-${item.date}`;
  }
  return `expense-${item.expense.id}`;
};

export const ExpensesList = memo(function ExpensesList({ expenses, isFiltered = false }: ExpensesListProps) {
  const { currency, deleteExpense, categories } = useApp();
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);

  const handleStartEdit = useCallback((expense: Expense | null) => {
    if (expense) {
      setEditingExpense(expense);
      setIsEditExpenseOpen(true);
    } else {
      setIsEditExpenseOpen(false);
    }
  }, []);

  const handleEditExpenseOpenChange = useCallback((open: boolean) => {
    setIsEditExpenseOpen(open);
  }, []);

  const handleEditExpenseAfterClose = useCallback(() => {
    setEditingExpense(null);
  }, []);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Precompute category map in O(N)
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    const len = categories.length;
    for (let i = 0; i < len; i++) {
      const cat = categories[i];
      if (cat) {
        map.set(cat.name, cat);
      }
    }
    return map;
  }, [categories]);

  const items = useMemo(() => {
    const t0 = performance.now();
    const sortedExpenses = expenses;

    // Use a fast O(1) string key generator to group expenses
    const groupedExpenses = sortedExpenses.reduce((acc, expense) => {
      if (!expense || !expense.date) return acc;
      
      const dateStr = expense.__dateStr || (() => {
        const dateObj = expense.date instanceof Date ? expense.date : new Date(expense.date);
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      })();

      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(expense);
      return acc;
    }, {} as Record<string, Expense[]>);

    const listItems: ListItem[] = [];
    for (const [date, expensesOnDate] of Object.entries(groupedExpenses)) {
      listItems.push({ type: 'date', date });
      const expLen = expensesOnDate.length;
      for (let i = 0; i < expLen; i++) {
        listItems.push({ type: 'expense', expense: expensesOnDate[i] });
      }
    }
    
    const t1 = performance.now();
    if (typeof window !== 'undefined' && (window as any).__flow_perf) {
      (window as any).__flow_perf.groupingTime = Math.round(t1 - t0);
    }
    
    return listItems;
  }, [expenses]);

  const handleDelete = (id: string) => {
    deleteExpense(id);
    setExpenseToDelete(null);
  };

  const handleMenuToggle = (id: string) => {
    setOpenMenuId(prevId => (prevId === id ? null : id));
  };

  const listRef = useRef<List | null>(null);

  // Clear virtualized row size layout caches and reset scroll offset to top when the items change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0, true);
      listRef.current.scrollTo(0);
    }
  }, [items]);

  const getItemSize = (index: number) => {
    const item = items[index];
    return item.type === 'date' ? 48 : 72; // Taller size for date headers
  };
  
  return (
    <>
      <div className="h-full w-full">
        {items.length > 0 ? (
          <AutoSizer>
            {({ height, width }) => (
              <List
                ref={listRef}
                className="List"
                height={height}
                width={width}
                itemCount={items.length}
                itemSize={getItemSize}
                itemKey={getItemKey}
                itemData={{
                  items,
                  categoryMap,
                  currency,
                  openMenuId,
                  handleMenuToggle,
                  setExpenseToEdit: handleStartEdit,
                  setExpenseToDelete,
                  shouldReduceMotion,
                }}
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        ) : isFiltered ? (
          <div className="flex flex-col items-center justify-center py-14 text-center space-y-3">
            <div className="p-4 bg-muted/30 rounded-2xl text-muted-foreground">
              <MoreHorizontal className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">No matching expenses</p>
            <p className="text-xs text-muted-foreground max-w-[250px] leading-relaxed">
              Try adjusting your search terms or filters to find what you are looking for.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-center space-y-3">
            <div className="p-4 bg-muted/30 rounded-2xl text-muted-foreground">
              <Plus className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">No expenses yet</p>
            <p className="text-xs text-muted-foreground max-w-[250px] leading-relaxed">
              Add your first expense to start tracking daily spending.
            </p>
            <AddExpenseDialog 
              showFloatingButton={false} 
              trigger={
                <Button className="rounded-xl h-11 px-6 text-sm font-semibold mt-2">
                  Add Expense
                </Button>
              }
            />
          </div>
        )}
      </div>
      <EditExpenseDialog
        expense={editingExpense}
        open={isEditExpenseOpen && editingExpense !== null}
        onOpenChange={handleEditExpenseOpenChange}
        onAfterClose={handleEditExpenseAfterClose}
      />
      <AnimatePresence>
        {expenseToDelete && (
          <DeleteExpenseDialog
            expense={expenseToDelete}
            onDelete={() => handleDelete(expenseToDelete.id)}
            onCancel={() => setExpenseToDelete(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
});

ExpensesList.displayName = 'ExpensesList';
