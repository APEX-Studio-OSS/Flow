'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CategoryIcon } from '@/components/icons/category-icon';
import { ArrowRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import type { Expense } from '@/types/domain';
import { DeleteExpenseDialog } from '../expenses/delete-expense-dialog';
import { EditExpenseDialog } from '../expenses/edit-expense-dialog';
import { TransactionTypeBadge } from '../expenses/transaction-type-badge';
import { useApp } from '@/components/providers/app-provider';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { listItemMotion } from '@/lib/motion-presets';

export function RecentExpenses() {
  const { currency, expenses, deleteExpense, categories, experimentalSettings } = useApp();
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);

  const handleEditExpenseOpenChange = useCallback((open: boolean) => {
    setIsEditExpenseOpen(open);
  }, []);

  const handleEditExpenseAfterClose = useCallback(() => {
    setEditingExpense(null);
  }, []);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion() ?? false;

  const { isNotesEnabled } = experimentalSettings;

  const RECENT_EXPENSE_LIMIT = 8;
  const recentExpenses = useMemo(() => {
    return expenses.slice(0, RECENT_EXPENSE_LIMIT);
  }, [expenses]);
  
  const handleDelete = (id: string) => {
    deleteExpense(id);
    setExpenseToDelete(null);
  };

  const handleMenuToggle = (id: string) => {
    setOpenMenuId(prevId => (prevId === id ? null : id));
  };
  
  const hasExpenses = recentExpenses.length > 0;

  return (
    <>
    <Card className="border bg-card/60 backdrop-blur-md shadow-sm rounded-2xl flex flex-col justify-between">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-base font-bold text-foreground">Recent Activity</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">Your last {RECENT_EXPENSE_LIMIT} transactions.</CardDescription>
      </CardHeader>
      <CardContent className="px-5 pb-5 flex-1">
        {!hasExpenses ? (
          <div className="flex flex-col items-center justify-center pt-10 pb-24 text-center space-y-3">
            <div className="p-4 bg-muted/30 rounded-2xl text-muted-foreground">
              <MoreHorizontal className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">No transactions logged</p>
            <p className="text-xs text-muted-foreground max-w-[250px] leading-relaxed">
              Tap the plus button below to add your first expense and start tracking your budget.
            </p>
          </div>
        ) : (
          <motion.ul
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: shouldReduceMotion ? 0 : 0.04
                }
              }
            }}
            className="divide-y divide-border"
          >
            {recentExpenses.map((expense) => {
              const categoryDetails = categories.find(c => c.name === expense.category);
              const isMenuOpen = openMenuId === expense.id;
              return (
                <motion.li
                  key={expense.id}
                  variants={listItemMotion(shouldReduceMotion)}
                  className="flex items-center space-x-3 py-3 first:pt-0 last:pb-0 group list-none"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-all" style={{ backgroundColor: categoryDetails ? `${categoryDetails.color}15` : undefined }}>
                    {categoryDetails && <CategoryIcon name={categoryDetails.icon} style={{color: categoryDetails.color}} className="h-5 w-5 transition-transform group-hover:scale-110" />}
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
                            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl" onClick={() => { setEditingExpense(expense); setIsEditExpenseOpen(true); setOpenMenuId(null); }}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="destructive" size="icon" className="h-11 w-11 rounded-xl" onClick={() => { setExpenseToDelete(expense); setOpenMenuId(null); }}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </>
                        ) : (
                          <div className="text-right mr-1">
                            <p className="font-bold text-sm text-foreground">{formatCurrency(expense.amount, currency)}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">{formatDate(expense.date, { month: 'short', day: 'numeric' })}</p>
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
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </CardContent>
    </Card>
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
}
