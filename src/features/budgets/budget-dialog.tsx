'use client';

import React from 'react';
import { BudgetLimitSheet } from './components/budget-limit-sheet';

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  categoryName: string;
  initialLimit?: number;
  onExitComplete?: () => void;
}

export function BudgetDialog({ open, onOpenChange, month, categoryName, initialLimit, onExitComplete }: BudgetDialogProps) {
  return (
    <BudgetLimitSheet
      open={open}
      onOpenChange={onOpenChange}
      month={month}
      categoryName={categoryName}
      initialLimit={initialLimit ?? 0}
      onExitComplete={onExitComplete}
    />
  );
}

