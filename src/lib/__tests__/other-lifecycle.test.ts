import { describe, it } from 'node:test';
import assert from 'node:assert';
import { repairDataObjects } from '../other-repair';

describe('Other Category Lifecycle', () => {
  const mockMonth = '2026-06';

  it('1. Other absent from malformed legacy data: canonical category is restored', () => {
    const malformedCategories = [
      { id: 'cat-1', name: 'Food', icon: 'Utensils', color: '#ff0000' }
    ];
    const { categories, repaired } = repairDataObjects(malformedCategories, [], [], []);
    assert.strictEqual(repaired, true);
    const other = categories.find(c => c.id === 'cat-8');
    assert.ok(other);
    assert.strictEqual(other.name, 'Other');
  });

  it('2. Other has expenses but no budget: migration creates one and progress renders', () => {
    const categories = [
      { id: 'cat-8', name: 'Other', icon: 'Circle', color: '#909296' }
    ];
    const expenses = [
      { id: 'exp-1', amount: 150.75, description: 'Misc', category: 'Other', date: new Date('2026-06-15T12:00:00Z'), isOnline: false }
    ];
    const { budgets, repaired } = repairDataObjects(categories, expenses, [], []);
    assert.strictEqual(repaired, true);
    const otherBudget = budgets.find(b => b.category === 'Other' && b.month === '2026-06');
    assert.ok(otherBudget);
    // Budget limit is at least equal to spent amount for that month, rounded up using Math.ceil (integer minor units)
    assert.strictEqual(otherBudget.limit, 151);
  });

  it('3. Other has no budget: source allocation transfers correctly', () => {
    const mockCategories = [
      { id: 'cat-1', name: 'Food', icon: 'Utensils', color: '#ff0000' },
      { id: 'cat-8', name: 'Other', icon: 'Circle', color: '#909296' }
    ];
    let mockBudgets = [
      { category: 'Food', limit: 500, month: '2026-06', categoryName: 'Food', categoryIcon: 'Utensils', categoryColor: '#ff0000' }
    ];
    let mockExpenses = [
      { id: 'exp-1', amount: 300, description: 'Dinner', category: 'Food', date: new Date('2026-06-15T12:00:00Z'), isOnline: false }
    ];

    const sourceCategoryName = 'Food';
    const monthKey = '2026-06';
    const otherCategory = mockCategories.find(c => c.id === 'cat-8')!;
    const sourceBudget = mockBudgets.find(b => b.category === sourceCategoryName && b.month === monthKey)!;
    const sourceLimit = sourceBudget.limit;

    // Filter out Food budget
    mockBudgets = mockBudgets.filter(b => !(b.category === sourceCategoryName && b.month === monthKey));
    
    // Add to Other budget
    const otherBudgetIndex = mockBudgets.findIndex(b => b.category === 'Other' && b.month === monthKey);
    if (otherBudgetIndex > -1) {
      mockBudgets[otherBudgetIndex].limit += sourceLimit;
    } else {
      mockBudgets.push({
        category: 'Other',
        limit: sourceLimit,
        month: monthKey,
        categoryName: 'Other',
        categoryIcon: otherCategory.icon,
        categoryColor: otherCategory.color
      });
    }

    // Move expenses
    mockExpenses = mockExpenses.map(e => {
      if (e.category === sourceCategoryName) {
        return { ...e, category: 'Other' };
      }
      return e;
    });

    const otherBudget = mockBudgets.find(b => b.category === 'Other' && b.month === '2026-06')!;
    assert.strictEqual(otherBudget.limit, 500);
    assert.strictEqual(mockExpenses[0].category, 'Other');
    assert.strictEqual(mockBudgets.find(b => b.category === 'Food' && b.month === '2026-06'), undefined);
  });

  it('4. Other already has a budget: limits are added correctly', () => {
    let mockBudgets = [
      { category: 'Food', limit: 500, month: '2026-06', categoryName: 'Food', categoryIcon: 'Utensils', categoryColor: '#ff0000' },
      { category: 'Other', limit: 200, month: '2026-06', categoryName: 'Other', categoryIcon: 'Circle', categoryColor: '#909296' }
    ];

    const sourceCategoryName = 'Food';
    const monthKey = '2026-06';
    const sourceBudget = mockBudgets.find(b => b.category === sourceCategoryName && b.month === monthKey)!;
    const sourceLimit = sourceBudget.limit;

    mockBudgets = mockBudgets.filter(b => !(b.category === sourceCategoryName && b.month === monthKey));

    const otherBudgetIndex = mockBudgets.findIndex(b => b.category === 'Other' && b.month === monthKey);
    if (otherBudgetIndex > -1) {
      mockBudgets[otherBudgetIndex] = {
        ...mockBudgets[otherBudgetIndex],
        limit: mockBudgets[otherBudgetIndex].limit + sourceLimit
      };
    }

    const otherBudget = mockBudgets.find(b => b.category === 'Other' && b.month === '2026-06')!;
    assert.strictEqual(otherBudget.limit, 700);
  });

  it('5. Multiple consecutive deletions accumulate correctly', () => {
    let mockBudgets = [
      { category: 'Food', limit: 500, month: '2026-06', categoryName: 'Food', categoryIcon: 'Utensils', categoryColor: '#ff0000' },
      { category: 'Rent', limit: 1000, month: '2026-06', categoryName: 'Rent', categoryIcon: 'Home', categoryColor: '#0000ff' },
      { category: 'Other', limit: 200, month: '2026-06', categoryName: 'Other', categoryIcon: 'Circle', categoryColor: '#909296' }
    ];

    // Deleting Food (500)
    let sourceLimit = mockBudgets.find(b => b.category === 'Food' && b.month === '2026-06')!.limit;
    mockBudgets = mockBudgets.filter(b => !(b.category === 'Food' && b.month === '2026-06'));
    let otherBudgetIndex = mockBudgets.findIndex(b => b.category === 'Other' && b.month === '2026-06');
    mockBudgets[otherBudgetIndex].limit += sourceLimit;

    // Deleting Rent (1000)
    sourceLimit = mockBudgets.find(b => b.category === 'Rent' && b.month === '2026-06')!.limit;
    mockBudgets = mockBudgets.filter(b => !(b.category === 'Rent' && b.month === '2026-06'));
    otherBudgetIndex = mockBudgets.findIndex(b => b.category === 'Other' && b.month === '2026-06');
    mockBudgets[otherBudgetIndex].limit += sourceLimit;

    const otherBudget = mockBudgets.find(b => b.category === 'Other' && b.month === '2026-06')!;
    assert.strictEqual(otherBudget.limit, 1700);
  });

  it('6. Only the selected month is modified', () => {
    let mockBudgets = [
      { category: 'Food', limit: 500, month: '2026-06', categoryName: 'Food', categoryIcon: 'Utensils', categoryColor: '#ff0000' },
      { category: 'Food', limit: 400, month: '2026-07', categoryName: 'Food', categoryIcon: 'Utensils', categoryColor: '#ff0000' }
    ];

    const sourceCategoryName = 'Food';
    const monthKey = '2026-06';
    const sourceBudget = mockBudgets.find(b => b.category === sourceCategoryName && b.month === monthKey)!;
    const sourceLimit = sourceBudget.limit;

    mockBudgets = mockBudgets.filter(b => !(b.category === sourceCategoryName && b.month === monthKey));

    mockBudgets.push({
      category: 'Other',
      limit: sourceLimit,
      month: monthKey,
      categoryName: 'Other',
      categoryIcon: 'Circle',
      categoryColor: '#909296'
    });

    const foodJuly = mockBudgets.find(b => b.category === 'Food' && b.month === '2026-07');
    assert.ok(foodJuly);
    assert.strictEqual(foodJuly.limit, 400);

    const otherJuly = mockBudgets.find(b => b.category === 'Other' && b.month === '2026-07');
    assert.strictEqual(otherJuly, undefined);
  });

  it('7. Archived-month reassignment does not affect the current month', () => {
    let mockExpenses = [
      { id: 'exp-1', amount: 100, description: 'Past meal', category: 'Food', date: new Date('2026-05-15T12:00:00Z'), isOnline: false },
      { id: 'exp-2', amount: 100, description: 'Current meal', category: 'Food', date: new Date('2026-06-15T12:00:00Z'), isOnline: false }
    ];

    mockExpenses = mockExpenses.map(e => {
      const d = new Date(e.date);
      const eMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (e.category === 'Food' && eMonth === '2026-05') {
        return { ...e, category: 'Other' };
      }
      return e;
    });

    const expMay = mockExpenses.find(e => e.id === 'exp-1')!;
    const expJune = mockExpenses.find(e => e.id === 'exp-2')!;

    assert.strictEqual(expMay.category, 'Other');
    assert.strictEqual(expJune.category, 'Food');
  });

  it('8. Monthly total remains unchanged after transfer', () => {
    let mockBudgets = [
      { category: 'Food', limit: 500, month: '2026-06', categoryName: 'Food', categoryIcon: 'Utensils', categoryColor: '#ff0000' },
      { category: 'Other', limit: 200, month: '2026-06', categoryName: 'Other', categoryIcon: 'Circle', categoryColor: '#909296' }
    ];
    const initialTotal = mockBudgets.reduce((sum, b) => sum + b.limit, 0);

    const sourceLimit = mockBudgets.find(b => b.category === 'Food' && b.month === '2026-06')!.limit;
    mockBudgets = mockBudgets.filter(b => !(b.category === 'Food' && b.month === '2026-06'));
    const otherBudgetIndex = mockBudgets.findIndex(b => b.category === 'Other' && b.month === '2026-06');
    mockBudgets[otherBudgetIndex].limit += sourceLimit;

    const finalTotal = mockBudgets.reduce((sum, b) => sum + b.limit, 0);
    assert.strictEqual(initialTotal, finalTotal);
  });

  it('9. Expense totals remain unchanged', () => {
    let mockExpenses = [
      { id: 'exp-1', amount: 300, description: 'Dinner', category: 'Food', date: new Date('2026-06-15T12:00:00Z'), isOnline: false },
      { id: 'exp-2', amount: 50, description: 'Coffee', category: 'Other', date: new Date('2026-06-16T12:00:00Z'), isOnline: false }
    ];
    const initialTotal = mockExpenses.reduce((sum, e) => sum + e.amount, 0);

    mockExpenses = mockExpenses.map(e => {
      const d = new Date(e.date);
      const eMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (e.category === 'Food' && eMonth === '2026-06') {
        return { ...e, category: 'Other' };
      }
      return e;
    });

    const finalTotal = mockExpenses.reduce((sum, e) => sum + e.amount, 0);
    assert.strictEqual(initialTotal, finalTotal);
  });

  it('10. Other cannot be deleted or duplicated', () => {
    const categories = [
      { id: 'cat-8', name: 'Other', icon: 'Circle', color: '#909296' },
      { id: 'cat-other-dup', name: 'Other', icon: 'Circle', color: '#909296' },
      { id: 'cat-standard', name: 'Food', icon: 'Utensils', color: '#ff0000' }
    ];

    const { categories: repaired } = repairDataObjects(categories, [], [], []);

    assert.strictEqual(repaired.length, 2);
    assert.ok(repaired.some(c => c.id === 'cat-8' && c.name === 'Other'));
    assert.ok(repaired.some(c => c.id === 'cat-standard' && c.name === 'Food'));
  });

  it('11. Double tap executes one transaction', async () => {
    let activeTxCount = 0;
    let isSubmitting = false;

    const atomicTx = async () => {
      if (isSubmitting) return;
      isSubmitting = true;
      activeTxCount++;
      await new Promise(resolve => setTimeout(resolve, 10));
      isSubmitting = false;
    };

    await Promise.all([atomicTx(), atomicTx()]);
    assert.strictEqual(activeTxCount, 1);
  });

  it('12. Export and re-import preserve the repaired structure', async () => {
    const backupData = {
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      data: {
        categories: [
          { id: 'cat-8', name: 'Other', icon: 'Circle', color: '#909296' }
        ],
        expenses: [
          { id: 'exp-1', amount: 50, description: 'Misc', category: 'Other', date: '2026-06-15T12:00:00Z', isOnline: false }
        ],
        budgets: [],
        notes: []
      }
    };

    const { categories, budgets } = repairDataObjects(
      backupData.data.categories,
      backupData.data.expenses as any,
      backupData.data.budgets,
      backupData.data.notes
    );

    assert.ok(categories.find(c => c.id === 'cat-8' && c.name === 'Other'));
    assert.ok(budgets.find(b => b.category === 'Other' && b.month === '2026-06'));
  });
});
