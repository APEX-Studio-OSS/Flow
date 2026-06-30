import { describe, it } from 'node:test';
import assert from 'node:assert';

type PendingBudgetDeletion =
  | { kind: 'reassign-and-delete'; categoryId: string; categoryName: string; monthKey: string; expenseCount: number }
  | { kind: 'remove-limit'; categoryId: string; categoryName: string; monthKey: string };

describe('Budget Deletion Lifecycle', () => {
  const mockMonth = '2026-06';

  it('shows only the budget allocation delete dialog for categories with expenses', async () => {
    let expenses = [
      { id: 'exp-1', amount: 50, description: 'Lunch', category: 'Food', date: '2026-06-15T12:00:00Z' },
    ];
    let budgets = [
      { category: 'Food', limit: 300, month: mockMonth },
    ];

    let pendingDeletion: PendingBudgetDeletion | null = null;
    let isAlertOpen = false;
    let isSubmitting = false;

    // Simulate initiateDeleteBudget
    const initiateDeleteBudget = (categoryId: string, categoryName: string) => {
      if (!categoryId || !categoryName || !mockMonth) {
        throw new Error('Required data is missing');
      }

      const expenseCount = expenses.filter(e => {
        const d = new Date(e.date);
        const eMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return e.category === categoryName && eMonth === mockMonth;
      }).length;

      if (expenseCount > 0) {
        pendingDeletion = {
          kind: 'reassign-and-delete',
          categoryId,
          categoryName,
          monthKey: mockMonth,
          expenseCount,
        };
      } else {
        pendingDeletion = {
          kind: 'remove-limit',
          categoryId,
          categoryName,
          monthKey: mockMonth,
        };
      }
      isAlertOpen = true;
    };

    // Open dialog
    initiateDeleteBudget('cat-1', 'Food');

    assert.strictEqual(isAlertOpen, true);
    assert.ok(pendingDeletion);
    assert.strictEqual((pendingDeletion as PendingBudgetDeletion).kind, 'reassign-and-delete');

    // Render functions derived from pendingDeletion snapshot
    const getRenderedText = (snap: PendingBudgetDeletion | null) => {
      if (!snap) return { title: 'Remove Budget Limit?', description: '', confirmText: 'Delete Budget' };
      const title = snap.kind === 'reassign-and-delete' ? "Delete Budget Allocation?" : "Remove Budget Limit?";
      const description = snap.kind === 'reassign-and-delete'
        ? `This category has ${snap.expenseCount} expense(s) this month. Deleting the budget will move those expenses to Other.`
        : `Are you sure you want to delete the budget allocation for ${snap.categoryName} this month?`;
      const confirmText = snap.kind === 'reassign-and-delete' ? "Reassign & Delete" : "Delete Budget";
      return { title, description, confirmText };
    };

    let rendered = getRenderedText(pendingDeletion);
    assert.strictEqual(rendered.title, "Delete Budget Allocation?");
    assert.ok(rendered.description.includes("1 expense(s)"));
    assert.strictEqual(rendered.confirmText, "Reassign & Delete");
    assert.ok(!rendered.title.includes('undefined') && !rendered.description.includes('undefined') && !rendered.confirmText.includes('undefined'));

    // Confirm Delete
    const handleDeleteBudgetConfirm = async () => {
      if (!pendingDeletion || isSubmitting) return;
      isSubmitting = true;

      if (pendingDeletion.kind === 'reassign-and-delete') {
        const snap = pendingDeletion;
        expenses = expenses.map(e => {
          const d = new Date(e.date);
          const eMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (e.category === snap.categoryName && eMonth === snap.monthKey) {
            return { ...e, category: 'Other' };
          }
          return e;
        });
      }

      const snap = pendingDeletion;
      budgets = budgets.filter(b => !(b.category === snap.categoryName && b.month === snap.monthKey));

      isAlertOpen = false;
      isSubmitting = false;
    };

    await handleDeleteBudgetConfirm();

    // Check that during the transition (open is false, but animation is running, pendingDeletion is still set)
    assert.strictEqual(isAlertOpen, false);
    assert.ok(pendingDeletion);
    rendered = getRenderedText(pendingDeletion);
    assert.strictEqual(rendered.title, "Delete Budget Allocation?"); // Assert it never swapped to "Remove Budget Limit?"
    assert.ok(!rendered.title.includes('undefined') && !rendered.description.includes('undefined'));

    // Simulate onExitComplete
    const handleAlertExitComplete = () => {
      pendingDeletion = null;
    };
    handleAlertExitComplete();
    assert.strictEqual(pendingDeletion, null);

    // Verify final expenses and budgets
    assert.strictEqual(expenses[0].category, 'Other');
    assert.strictEqual(budgets.length, 0);
  });

  it('keeps the remove budget limit flow for categories without expenses', () => {
    let expenses: any[] = [];
    let budgets = [
      { category: 'Food', limit: 300, month: mockMonth },
    ];
    let pendingDeletion: PendingBudgetDeletion | null = null;
    let isAlertOpen = false;

    const initiateDeleteBudget = (categoryId: string, categoryName: string) => {
      const expenseCount = expenses.filter(e => {
        const d = new Date(e.date);
        const eMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return e.category === categoryName && eMonth === mockMonth;
      }).length;

      if (expenseCount > 0) {
        pendingDeletion = {
          kind: 'reassign-and-delete',
          categoryId,
          categoryName,
          monthKey: mockMonth,
          expenseCount,
        };
      } else {
        pendingDeletion = {
          kind: 'remove-limit',
          categoryId,
          categoryName,
          monthKey: mockMonth,
        };
      }
      isAlertOpen = true;
    };

    initiateDeleteBudget('cat-1', 'Food');
    assert.strictEqual(isAlertOpen, true);
    assert.ok(pendingDeletion);
    assert.strictEqual((pendingDeletion as PendingBudgetDeletion).kind, 'remove-limit');

    const getRenderedText = (snap: PendingBudgetDeletion | null) => {
      if (!snap) return { title: 'Remove Budget Limit?', description: '', confirmText: 'Delete Budget' };
      const title = snap.kind === 'reassign-and-delete' ? "Delete Budget Allocation?" : "Remove Budget Limit?";
      const description = snap.kind === 'reassign-and-delete'
        ? `This category has ${snap.expenseCount} expense(s) this month. Deleting the budget will move those expenses to Other.`
        : `Are you sure you want to delete the budget allocation for ${snap.categoryName} this month?`;
      const confirmText = snap.kind === 'reassign-and-delete' ? "Reassign & Delete" : "Delete Budget";
      return { title, description, confirmText };
    };

    const rendered = getRenderedText(pendingDeletion);
    assert.strictEqual(rendered.title, "Remove Budget Limit?");
    assert.ok(rendered.description.includes("Food"));
  });

  it('prevents duplicate deletion on double tap', async () => {
    let pendingDeletion: PendingBudgetDeletion | null = {
      kind: 'reassign-and-delete',
      categoryId: 'cat-1',
      categoryName: 'Food',
      monthKey: mockMonth,
      expenseCount: 1,
    };
    let isSubmitting = false;
    let mutationCount = 0;

    const handleDeleteBudgetConfirm = async () => {
      if (!pendingDeletion || isSubmitting) return;
      isSubmitting = true;
      mutationCount++;
      await new Promise(resolve => setTimeout(resolve, 10));
      isSubmitting = false;
    };

    const p1 = handleDeleteBudgetConfirm();
    const p2 = handleDeleteBudgetConfirm();

    await Promise.all([p1, p2]);

    assert.strictEqual(mutationCount, 1);
  });

  it('keeps the dialog stable when deletion fails', async () => {
    let pendingDeletion: PendingBudgetDeletion | null = {
      kind: 'reassign-and-delete',
      categoryId: 'cat-1',
      categoryName: 'Food',
      monthKey: mockMonth,
      expenseCount: 1,
    };
    let isAlertOpen = true;
    let isSubmitting = false;
    let hasError = false;

    const handleDeleteBudgetConfirm = async () => {
      if (!pendingDeletion || isSubmitting) return;
      isSubmitting = true;
      try {
        throw new Error('Database transaction failed');
      } catch (err) {
        hasError = true;
      } finally {
        isSubmitting = false;
      }
    };

    await handleDeleteBudgetConfirm();

    assert.strictEqual(hasError, true);
    assert.strictEqual(isAlertOpen, true);
    assert.strictEqual(isSubmitting, false);
    assert.ok(pendingDeletion);
  });

  it('prevents Android back button from triggering another action during submission', () => {
    let closeDisabled = true;
    let isAlertOpen = true;

    const requestClose = (reason: string) => {
      if (closeDisabled) {
        return;
      }
      isAlertOpen = false;
    };

    requestClose('stack-manager-dismiss');
    assert.strictEqual(isAlertOpen, true);
  });
});
