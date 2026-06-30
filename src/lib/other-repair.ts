import type { Category, Expense, Budget, Note } from './types';

/**
 * Validates, repairs, and canonicalizes categories, expenses, budgets, and notes.
 * Enforces:
 * 1. The Other category has ID 'cat-8' and name 'Other'.
 * 2. Deduplicates categories.
 * 3. Maps expenses/notes referencing non-existent categories to 'Other'.
 * 4. Deduplicates budgets (keeps only one limit per category per month).
 * 5. Creates Other budget allocation for any month containing Other expenses if it doesn't exist.
 *    Budget limit is at least equal to spent amount for that month, rounded up using Math.ceil (integer minor units).
 */
export function repairDataObjects(
  currentCategories: Category[],
  currentExpenses: Expense[],
  currentBudgets: Budget[],
  currentNotes: Note[]
): {
  categories: Category[];
  expenses: Expense[];
  budgets: Budget[];
  notes: Note[];
  repaired: boolean;
} {
  let needsRepair = false;

  // 1. Ensure default "Other" category exists with ID 'cat-8'
  const repairedCategories = [...(currentCategories || [])];
  let otherCategory = repairedCategories.find(c => c.id === 'cat-8');
  if (!otherCategory) {
    const otherByNameIndex = repairedCategories.findIndex(c => c.name.toLowerCase() === 'other');
    if (otherByNameIndex > -1) {
      repairedCategories[otherByNameIndex] = {
        ...repairedCategories[otherByNameIndex],
        id: 'cat-8',
        name: 'Other'
      };
      otherCategory = repairedCategories[otherByNameIndex];
    } else {
      otherCategory = {
        id: 'cat-8',
        name: 'Other',
        icon: 'Circle',
        color: '#909296'
      };
      repairedCategories.push(otherCategory);
    }
    needsRepair = true;
  } else {
    if (otherCategory.name !== 'Other') {
      otherCategory.name = 'Other';
      needsRepair = true;
    }
  }

  // De-duplicate categories (remove duplicates of 'Other' name/ID, and duplicate entries)
  const finalCategories: Category[] = [];
  for (const cat of repairedCategories) {
    if (!cat || !cat.name || !cat.id) {
      needsRepair = true;
      continue;
    }
    if (cat.name.toLowerCase() === 'other' && cat.id !== 'cat-8') {
      needsRepair = true;
      continue; // Skip duplicate Other
    }
    if (finalCategories.some(c => c.id === cat.id || c.name.toLowerCase() === cat.name.toLowerCase())) {
      needsRepair = true;
      continue; // Skip duplicate
    }
    finalCategories.push({
      id: cat.id,
      name: cat.name.trim(),
      icon: cat.icon || 'Circle',
      color: cat.color || '#909296'
    });
  }

  const validCategoryNames = new Set(finalCategories.map(c => c.name));

  // 2. Validate and repair expenses
  const repairedExpenses = (currentExpenses || []).map(exp => {
    if (!exp) return exp;
    let category = exp.category;
    if (!category || !validCategoryNames.has(category)) {
      category = 'Other';
      needsRepair = true;
    }
    return {
      ...exp,
      category
    };
  });

  // 3. Validate and repair notes
  const repairedNotes = (currentNotes || []).map(n => {
    if (!n) return n;
    let category = n.category;
    if (!category || !validCategoryNames.has(category)) {
      category = 'Other';
      needsRepair = true;
    }
    return {
      ...n,
      category
    };
  });

  // 4. Validate and repair budgets
  const initialBudgets = (currentBudgets || []).filter(b => {
    if (!b || !b.category || !validCategoryNames.has(b.category)) {
      needsRepair = true;
      return false;
    }
    if (!b.month || !/^\d{4}-\d{2}$/.test(b.month)) {
      needsRepair = true;
      return false;
    }
    return true;
  });

  // De-duplicate budgets (one budget per category per month)
  const dedupedBudgets: Budget[] = [];
  const budgetKeysSeen = new Set<string>();
  for (const b of initialBudgets) {
    const key = `${b.category}:${b.month}`;
    if (budgetKeysSeen.has(key)) {
      needsRepair = true;
      continue; // Skip duplicate
    }
    budgetKeysSeen.add(key);
    dedupedBudgets.push(b);
  }

  // 5. Detect months where Other has expenses but no valid budget
  const otherMonths = new Set<string>();
  const spentOnOtherByMonth: Record<string, number> = {};
  for (const exp of repairedExpenses) {
    if (exp && exp.category === 'Other') {
      const d = exp.date instanceof Date ? exp.date : new Date(exp.date);
      if (!isNaN(d.getTime())) {
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        otherMonths.add(monthKey);
        spentOnOtherByMonth[monthKey] = (spentOnOtherByMonth[monthKey] || 0) + exp.amount;
      }
    }
  }

  for (const monthKey of otherMonths) {
    const hasOtherBudget = dedupedBudgets.some(b => b.category === 'Other' && b.month === monthKey);
    if (!hasOtherBudget) {
      const spent = spentOnOtherByMonth[monthKey] || 0;
      // Budget limit is at least equal to spent, rounded up to the nearest integer
      const limit = Math.ceil(spent);
      dedupedBudgets.push({
        category: 'Other',
        limit,
        month: monthKey,
        categoryName: 'Other',
        categoryIcon: otherCategory.icon,
        categoryColor: otherCategory.color
      });
      needsRepair = true;
    }
  }

  // Synchronize category details (name, icon, color) on budgets
  const finalBudgets = dedupedBudgets.map(b => {
    const cat = finalCategories.find(c => c.name === b.category);
    const categoryName = cat?.name || b.category;
    const categoryIcon = cat?.icon || 'Circle';
    const categoryColor = cat?.color || '#808080';
    if (b.categoryName !== categoryName || b.categoryIcon !== categoryIcon || b.categoryColor !== categoryColor) {
      needsRepair = true;
      return {
        ...b,
        categoryName,
        categoryIcon,
        categoryColor
      };
    }
    return b;
  });

  return {
    categories: finalCategories,
    expenses: repairedExpenses,
    budgets: finalBudgets,
    notes: repairedNotes,
    repaired: needsRepair
  };
}
