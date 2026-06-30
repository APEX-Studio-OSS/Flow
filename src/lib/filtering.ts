import type { Expense } from '@/types/domain';

export interface DateRange {
  from?: Date | number;
  to?: Date | number;
}

export interface ExpenseFilters {
  selectedCategories: string[];
  dateRange: DateRange | undefined;
  priceRange: { min: string; max: string };
  onlineStatus: 'all' | 'online' | 'offline';
}

export interface NormalizedFilterCriteria {
  searchTerm: string;
  categoryNames: string[];
  dateFromMs?: number;
  dateToMs?: number;
  minAmount?: number;
  maxAmount?: number;
  onlineStatus: 'all' | 'online' | 'offline';
}

export function getEmptyExpenseFilters(): ExpenseFilters {
  return {
    selectedCategories: [],
    dateRange: undefined,
    priceRange: { min: '', max: '' },
    onlineStatus: 'all',
  };
}

export function hasActiveExpenseFilters(filters: ExpenseFilters): boolean {
  return (
    filters.selectedCategories.length > 0 ||
    filters.dateRange !== undefined ||
    filters.priceRange.min !== '' ||
    filters.priceRange.max !== '' ||
    filters.onlineStatus !== 'all'
  );
}

export function countActiveExpenseFilters(filters: ExpenseFilters): number {
  return [
    filters.selectedCategories.length > 0,
    filters.dateRange !== undefined,
    filters.priceRange.min !== '' || filters.priceRange.max !== '',
    filters.onlineStatus !== 'all',
  ].filter(Boolean).length;
}

export function normalizeExpenseFilters(
  filters: ExpenseFilters,
  searchTerm: string
): NormalizedFilterCriteria {
  let minVal = (filters.priceRange.min !== undefined && filters.priceRange.min !== '') ? parseFloat(filters.priceRange.min) : undefined;
  let maxVal = (filters.priceRange.max !== undefined && filters.priceRange.max !== '') ? parseFloat(filters.priceRange.max) : undefined;
  
  if (minVal !== undefined && !isNaN(minVal) && maxVal !== undefined && !isNaN(maxVal)) {
    if (minVal > maxVal) {
      const temp = minVal;
      minVal = maxVal;
      maxVal = temp;
    }
  }
  
  let dateFromMs: number | undefined;
  if (filters.dateRange?.from) {
    const fromDate = new Date(filters.dateRange.from);
    fromDate.setHours(0, 0, 0, 0);
    dateFromMs = fromDate.getTime();
  }
  
  let dateToMs: number | undefined;
  if (filters.dateRange?.to) {
    const toDate = new Date(filters.dateRange.to);
    toDate.setHours(23, 59, 59, 999);
    dateToMs = toDate.getTime();
  } else if (filters.dateRange?.from) {
    const toDate = new Date(filters.dateRange.from);
    toDate.setHours(23, 59, 59, 999);
    dateToMs = toDate.getTime();
  }

  return {
    searchTerm: searchTerm.trim().toLowerCase(),
    categoryNames: filters.selectedCategories,
    dateFromMs,
    dateToMs,
    minAmount: minVal !== undefined && !isNaN(minVal) ? minVal : undefined,
    maxAmount: maxVal !== undefined && !isNaN(maxVal) ? maxVal : undefined,
    onlineStatus: filters.onlineStatus,
  };
}

export function applyExpenseFiltersSync(
  expenses: Expense[],
  criteria: NormalizedFilterCriteria
): Expense[] {
  const { searchTerm, categoryNames, dateFromMs, dateToMs, minAmount, maxAmount, onlineStatus } = criteria;
  
  return expenses.filter((exp) => {
    if (!exp) return false;
    
    // 1. Search term check
    if (searchTerm) {
      if (!exp.description || !exp.description.toLowerCase().includes(searchTerm)) {
        return false;
      }
    }
    
    // 2. Category check
    if (categoryNames.length > 0) {
      if (!categoryNames.includes(exp.category)) {
        return false;
      }
    }
    
    // 3. Date check
    const t = exp.__time || (exp.date instanceof Date ? exp.date.getTime() : new Date(exp.date).getTime());
    if (dateFromMs !== undefined) {
      if (isNaN(t) || t < dateFromMs) return false;
    }
    if (dateToMs !== undefined) {
      if (isNaN(t) || t > dateToMs) return false;
    }
    
    // 4. Amount check
    if (minAmount !== undefined) {
      if (typeof exp.amount !== 'number' || exp.amount < minAmount) return false;
    }
    if (maxAmount !== undefined) {
      if (typeof exp.amount !== 'number' || exp.amount > maxAmount) return false;
    }
    
    // 5. Channel/online status check
    if (onlineStatus !== 'all') {
      const online = onlineStatus === 'online';
      if (exp.isOnline !== online) return false;
    }
    
    return true;
  });
}
