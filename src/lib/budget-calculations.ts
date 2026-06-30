import type { Expense, Category, Budget } from '@/types/domain';

export interface CategoryBudgetStats {
  id: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  hasAllocation: boolean;
  count: number;
}

export interface BudgetMonthStats {
  monthlySpent: number;
  totalBudget: number;
  monthlyRemaining: number;
  monthlyProgressPercent: number;
  categoryStats: CategoryBudgetStats[];
}

/**
 * Normalizes a month key to YYYY-MM format.
 */
export function normalizeMonthKey(monthKey: string | Date): string {
  if (monthKey instanceof Date) {
    return `${monthKey.getFullYear()}-${String(monthKey.getMonth() + 1).padStart(2, '0')}`;
  }
  
  if (typeof monthKey === 'string') {
    const trimmed = monthKey.trim();
    if (/^\d{4}-\d{2}/.test(trimmed)) {
      return trimmed.substring(0, 7);
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    }
  }
  
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Matches an expense to a category using robust matching logic.
 * 1. Prefer categoryId if both have IDs.
 * 2. Fall back to name-based matching (trimmed, case-insensitive).
 */
export function matchCategory(expense: Expense, category: Category): boolean {
  if (expense.categoryId) {
    return expense.categoryId === category.id;
  }
  
  const expCatName = expense.category ? String(expense.category).trim().toLowerCase() : '';
  const catName = category.name ? String(category.name).trim().toLowerCase() : '';
  
  return expCatName === catName;
}

/**
 * Calculates budget and spending statistics for a given month.
 */
export function calculateBudgetStats(
  expenses: Expense[],
  categories: Category[],
  budgets: Budget[],
  monthKey: string | Date
): BudgetMonthStats {
  const targetMonth = normalizeMonthKey(monthKey);

  // 1. Filter expenses strictly by target month
  const monthlyExpenses = expenses.filter(e => {
    if (!e || !e.date) return false;
    const d = e.date instanceof Date ? e.date : new Date(e.date);
    if (isNaN(d.getTime())) return false;
    const eMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return eMonth === targetMonth;
  });

  // 2. Calculate total monthly spent (sum of all expenses in the target month)
  const monthlySpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 3. Group monthly expenses by category for quick lookup
  const categorySpentMap = new Map<string, number>();
  const categoryCountMap = new Map<string, number>();

  for (const e of monthlyExpenses) {
    const matchedCat = categories.find(cat => matchCategory(e, cat));
    
    // Use matched category name, or fall back to 'Other'
    const catNameKey = matchedCat ? matchedCat.name : 'Other';
    categorySpentMap.set(catNameKey, (categorySpentMap.get(catNameKey) || 0) + e.amount);
    categoryCountMap.set(catNameKey, (categoryCountMap.get(catNameKey) || 0) + 1);
  }

  // 4. Get budget allocations for the target month
  const monthBudgets = budgets.filter(b => normalizeMonthKey(b.month) === targetMonth);
  const totalBudget = monthBudgets.reduce((sum, b) => sum + b.limit, 0);

  // 5. Build stats for each category in the system
  const categoryStats: CategoryBudgetStats[] = categories.map(cat => {
    const budget = monthBudgets.find(b => {
      const bCatName = b.category ? String(b.category).trim().toLowerCase() : '';
      const catName = cat.name ? String(cat.name).trim().toLowerCase() : '';
      return bCatName === catName;
    });

    const limit = budget ? budget.limit : 0;
    const spent = categorySpentMap.get(cat.name) || 0;
    const count = categoryCountMap.get(cat.name) || 0;
    const remaining = limit - spent;
    const percentage = limit > 0 ? (spent / limit) * 100 : (spent > 0 ? 100 : 0);

    return {
      id: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
      limit,
      spent,
      remaining,
      percentage,
      hasAllocation: !!budget,
      count,
    };
  });

  const monthlyRemaining = totalBudget - monthlySpent;
  const monthlyProgressPercent = totalBudget > 0 
    ? (monthlySpent / totalBudget) * 100 
    : (monthlySpent > 0 ? 100 : 0);

  return {
    monthlySpent,
    totalBudget,
    monthlyRemaining,
    monthlyProgressPercent,
    categoryStats,
  };
}
