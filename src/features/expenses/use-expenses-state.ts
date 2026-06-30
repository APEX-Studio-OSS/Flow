import { useCallback } from 'react';
import type { Expense } from '@/types/domain';
import usePersistentState from '@/hooks/use-persistent-state';
import { STORAGE_KEYS } from '@/constants/storage-keys';

export function useExpensesState() {
  const [expenses, setExpenses, areExpensesLoaded] = usePersistentState<Expense[]>(STORAGE_KEYS.expenses, []);

  const addExpense = useCallback((expenseData: Omit<Expense, 'id' | 'date'> & { date?: Date }) => {
    setExpenses(prev => [{ id: `exp-${Date.now()}`, date: expenseData.date || new Date(), ...expenseData }, ...prev]);
  }, [setExpenses]);

  const updateExpense = useCallback((updated: Expense) => {
    setExpenses(prev => prev.map(e => (e.id === updated.id ? updated : e)));
  }, [setExpenses]);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, [setExpenses]);

  return {
    expenses,
    setExpenses,
    areExpensesLoaded,
    addExpense,
    updateExpense,
    deleteExpense
  };
}
