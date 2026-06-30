'use client';

import { FlowAlert } from '@/components/flow-popups/flow-alert';
import type { Expense } from '@/types/domain';
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/components/providers/app-provider';

interface DeleteExpenseDialogProps {
  expense: Expense;
  onDelete: () => void;
  onCancel: () => void;
}

export function DeleteExpenseDialog({ expense, onDelete, onCancel }: DeleteExpenseDialogProps) {
  const { currency } = useApp();
  return (
    <FlowAlert
      open={true}
      onOpenChange={(open) => !open && onCancel()}
      title="Are You Absolutely Sure?"
      description={`This action cannot be undone. This will permanently delete your expense for "${expense.description}" of ${formatCurrency(expense.amount, currency)}.`}
      confirmText="Delete"
      cancelText="Cancel"
      onConfirm={onDelete}
      variant="destructive"
    />
  );
}
