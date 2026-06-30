import { useCallback } from 'react';
import type { Budget, Category } from '@/types/domain';
import usePersistentState from '@/hooks/use-persistent-state';
import { STORAGE_KEYS } from '@/constants/storage-keys';

export function useBudgetsState(categories: Category[]) {
  const [budgets, setBudgets, areBudgetsLoaded] = usePersistentState<Budget[]>(STORAGE_KEYS.budgets, []);

  const updateBudget = useCallback((category: string, limit: number, month: string) => {
    setBudgets(prev => {
      const existingBudgetIndex = prev.findIndex(b => b.category === category && b.month === month);
      const newBudgets = [...prev];
      if (existingBudgetIndex > -1) {
        newBudgets[existingBudgetIndex] = { ...newBudgets[existingBudgetIndex], limit };
      } else {
        const catDetails = categories.find(c => c.name === category);
        if (catDetails) {
          newBudgets.push({
            category,
            limit,
            month,
            categoryName: catDetails.name,
            categoryIcon: catDetails.icon,
            categoryColor: catDetails.color
          });
        }
      }
      return newBudgets;
    });
  }, [categories, setBudgets]);

  return {
    budgets,
    setBudgets,
    areBudgetsLoaded,
    updateBudget
  };
}
