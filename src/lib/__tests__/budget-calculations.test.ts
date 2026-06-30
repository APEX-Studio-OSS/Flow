import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateBudgetStats } from '../budget-calculations.js';
import type { Expense, Category, Budget } from '../types.js';

describe('Budget And Category Calculations', () => {
  const categories: Category[] = [
    { id: 'cat-rent', name: 'Rent', icon: 'Home', color: 'blue' },
    { id: 'cat-food', name: 'Food', icon: 'Circle', color: 'red' },
    { id: 'cat-other', name: 'Other', icon: 'MoreHorizontal', color: 'gray' },
  ];

  const budgets: Budget[] = [
    { category: 'Rent', limit: 4000, month: '2026-06', categoryName: 'Rent', categoryIcon: 'Home', categoryColor: 'blue' },
    { category: 'Food', limit: 200, month: '2026-06', categoryName: 'Food', categoryIcon: 'Circle', categoryColor: 'red' },
  ];

  it('should increase Rent budget progress when an expense is added', () => {
    const expenses: Expense[] = [
      { id: 'exp-1', amount: 2000, description: 'Flat 3D', category: 'Rent', categoryId: 'cat-rent', date: new Date('2026-06-30T12:00:00Z'), isOnline: true },
    ];

    const stats = calculateBudgetStats(expenses, categories, budgets, '2026-06');
    const rentStat = stats.categoryStats.find(c => c.categoryName === 'Rent');

    assert.ok(rentStat);
    assert.strictEqual(rentStat.spent, 2000);
    assert.strictEqual(rentStat.limit, 4000);
    assert.strictEqual(rentStat.percentage, 50);
    assert.strictEqual(rentStat.remaining, 2000);
  });

  it('should increase Food budget progress when an expense is added', () => {
    const expenses: Expense[] = [
      { id: 'exp-2', amount: 300, description: 'Pizza', category: 'Food', categoryId: 'cat-food', date: new Date('2026-06-30T12:00:00Z'), isOnline: true },
    ];

    const stats = calculateBudgetStats(expenses, categories, budgets, '2026-06');
    const foodStat = stats.categoryStats.find(c => c.categoryName === 'Food');

    assert.ok(foodStat);
    assert.strictEqual(foodStat.spent, 300);
    assert.strictEqual(foodStat.limit, 200);
    assert.strictEqual(foodStat.percentage, 150);
    assert.strictEqual(foodStat.remaining, -100);
  });

  it('should calculate total monthly spent as sum of expenses', () => {
    const expenses: Expense[] = [
      { id: 'exp-1', amount: 2000, description: 'Flat 3D', category: 'Rent', categoryId: 'cat-rent', date: new Date('2026-06-30T12:00:00Z'), isOnline: true },
      { id: 'exp-2', amount: 300, description: 'Pizza', category: 'Food', categoryId: 'cat-food', date: new Date('2026-06-30T15:00:00Z'), isOnline: true },
    ];

    const stats = calculateBudgetStats(expenses, categories, budgets, '2026-06');

    assert.strictEqual(stats.monthlySpent, 2300);
    assert.strictEqual(stats.totalBudget, 4200);
    assert.strictEqual(stats.monthlyRemaining, 1900);
    assert.strictEqual(stats.monthlyProgressPercent, (2300 / 4200) * 100);
  });

  it('should not leak data from other months', () => {
    const expenses: Expense[] = [
      // June 2026 (target)
      { id: 'exp-1', amount: 2000, description: 'Flat 3D', category: 'Rent', categoryId: 'cat-rent', date: new Date('2026-06-30T12:00:00Z'), isOnline: true },
      // May 2026 (previous month)
      { id: 'exp-3', amount: 1500, description: 'Previous Rent', category: 'Rent', categoryId: 'cat-rent', date: new Date('2026-05-31T12:00:00Z'), isOnline: true },
      // July 2026 (next month)
      { id: 'exp-4', amount: 2500, description: 'Next Rent', category: 'Rent', categoryId: 'cat-rent', date: new Date('2026-07-01T12:00:00Z'), isOnline: true },
    ];

    const stats = calculateBudgetStats(expenses, categories, budgets, '2026-06');
    const rentStat = stats.categoryStats.find(c => c.categoryName === 'Rent');

    assert.strictEqual(stats.monthlySpent, 2000);
    assert.ok(rentStat);
    assert.strictEqual(rentStat.spent, 2000);
  });

  it('should match legacy name-based category names', () => {
    const expenses: Expense[] = [
      // No categoryId, matches by category name (trimmed, case-insensitive)
      { id: 'exp-5', amount: 150, description: 'Legacy Rent', category: '  reNT  ', date: new Date('2026-06-15T12:00:00Z'), isOnline: true },
    ];

    const stats = calculateBudgetStats(expenses, categories, budgets, '2026-06');
    const rentStat = stats.categoryStats.find(c => c.categoryName === 'Rent');

    assert.ok(rentStat);
    assert.strictEqual(rentStat.spent, 150);
  });

  it('should count Other category expenses correctly', () => {
    const expenses: Expense[] = [
      { id: 'exp-6', amount: 100, description: 'Something else', category: 'Other', categoryId: 'cat-other', date: new Date('2026-06-20T12:00:00Z'), isOnline: true },
      // Unrecognized category name should fall back to 'Other' grouping
      { id: 'exp-7', amount: 50, description: 'Unknown item', category: 'Unrecognized', date: new Date('2026-06-21T12:00:00Z'), isOnline: true },
    ];

    const stats = calculateBudgetStats(expenses, categories, budgets, '2026-06');
    const otherStat = stats.categoryStats.find(c => c.categoryName === 'Other');

    assert.ok(otherStat);
    assert.strictEqual(otherStat.spent, 150);
  });

  it('should update totals when an expense category is edited', () => {
    const expenses: Expense[] = [
      { id: 'exp-1', amount: 100, description: 'Rent payment', category: 'Rent', categoryId: 'cat-rent', date: new Date('2026-06-15T12:00:00Z'), isOnline: true },
    ];

    // Initial check
    let stats = calculateBudgetStats(expenses, categories, budgets, '2026-06');
    let rentStat = stats.categoryStats.find(c => c.categoryName === 'Rent');
    let foodStat = stats.categoryStats.find(c => c.categoryName === 'Food');
    assert.strictEqual(rentStat?.spent, 100);
    assert.strictEqual(foodStat?.spent, 0);

    // Edit category from Rent to Food (updating both category and categoryId)
    const updatedExpenses = expenses.map(e => e.id === 'exp-1' ? { ...e, category: 'Food', categoryId: 'cat-food' } : e);

    stats = calculateBudgetStats(updatedExpenses, categories, budgets, '2026-06');
    rentStat = stats.categoryStats.find(c => c.categoryName === 'Rent');
    foodStat = stats.categoryStats.find(c => c.categoryName === 'Food');
    assert.strictEqual(rentStat?.spent, 0);
    assert.strictEqual(foodStat?.spent, 100);
  });

  it('should update totals when an expense is deleted', () => {
    const expenses: Expense[] = [
      { id: 'exp-1', amount: 100, description: 'Rent payment', category: 'Rent', categoryId: 'cat-rent', date: new Date('2026-06-15T12:00:00Z'), isOnline: true },
      { id: 'exp-2', amount: 50, description: 'Food', category: 'Food', categoryId: 'cat-food', date: new Date('2026-06-16T12:00:00Z'), isOnline: true },
    ];

    let stats = calculateBudgetStats(expenses, categories, budgets, '2026-06');
    assert.strictEqual(stats.monthlySpent, 150);

    // Delete exp-2
    const remainingExpenses = expenses.filter(e => e.id !== 'exp-2');

    stats = calculateBudgetStats(remainingExpenses, categories, budgets, '2026-06');
    assert.strictEqual(stats.monthlySpent, 100);
    const foodStat = stats.categoryStats.find(c => c.categoryName === 'Food');
    assert.strictEqual(foodStat?.spent, 0);
  });

  it('should match category totals with summary stats', () => {
    const expenses: Expense[] = [
      { id: 'exp-1', amount: 1500, description: 'Rent', category: 'Rent', categoryId: 'cat-rent', date: new Date('2026-06-15T12:00:00Z'), isOnline: true },
      { id: 'exp-2', amount: 50, description: 'Snacks', category: 'Food', categoryId: 'cat-food', date: new Date('2026-06-16T12:00:00Z'), isOnline: true },
      { id: 'exp-3', amount: 75, description: 'Miscellaneous', category: 'Other', categoryId: 'cat-other', date: new Date('2026-06-17T12:00:00Z'), isOnline: true },
    ];

    const stats = calculateBudgetStats(expenses, categories, budgets, '2026-06');

    // Calculate sum of spent from categoryStats
    const sumSpent = stats.categoryStats.reduce((sum, c) => sum + c.spent, 0);
    assert.strictEqual(stats.monthlySpent, sumSpent);

    // Verify remaining and percentage calculations for individual categories
    const rentStat = stats.categoryStats.find(c => c.categoryName === 'Rent');
    assert.ok(rentStat);
    assert.strictEqual(rentStat.remaining, rentStat.limit - rentStat.spent);
    assert.strictEqual(rentStat.percentage, (rentStat.spent / rentStat.limit) * 100);
  });
});
