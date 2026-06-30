'use client';

import { FlowDialog } from '@/components/flow-popups/flow-dialog';
import { FlowPopupHeader } from '@/components/flow-popups/flow-popup-header';
import { FlowPopupFooter } from '@/components/flow-popups/flow-popup-footer';
import { Button } from '@/components/ui/button';
import type { Category } from '@/types/domain';
import { useApp } from '@/components/providers/app-provider';
import { useMemo, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'framer-motion';

interface DeleteCategoryDialogProps {
  category: Category;
  onDelete: (targetCategoryName: string) => void;
  onCancel: () => void;
}

export function DeleteCategoryDialog({ category, onDelete, onCancel }: DeleteCategoryDialogProps) {
  const { expenses } = useApp();
  const shouldReduceMotion = useReducedMotion();
  
  const linkedExpensesCount = useMemo(() => {
    return expenses.filter(e => {
      if (e.categoryId && category.id) {
        if (e.categoryId === category.id) return true;
      }
      const expCatName = e.category ? String(e.category).trim().toLowerCase() : '';
      const catName = category.name ? String(category.name).trim().toLowerCase() : '';
      return expCatName === catName;
    }).length;
  }, [expenses, category]);

  const isOther = category.name.toLowerCase() === 'other';
  const isBlocked = isOther || linkedExpensesCount > 0;

  const iconVariants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.22,
        delay: 0.06,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <FlowDialog open={true} onOpenChange={(open) => !open && onCancel()} className="p-5 select-none">
      <div className="flex items-start gap-3">
        <motion.div 
          variants={shouldReduceMotion ? undefined : iconVariants}
          initial={shouldReduceMotion ? undefined : "hidden"}
          animate={shouldReduceMotion ? undefined : "visible"}
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
            isBlocked ? "bg-amber-500/10 text-amber-500" : "bg-destructive/10 text-destructive"
          )}
        >
          <ShieldAlert className="h-5 w-5" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground leading-normal">
            {isOther ? "Category Is Protected" : linkedExpensesCount > 0 ? "Cannot Delete Category" : "Delete Category?"}
          </h3>
          <div className="text-xs text-muted-foreground mt-2 space-y-2.5">
            {isOther ? (
              <p>
                The fallback category <span className="font-semibold text-foreground">Other</span> is protected and cannot be deleted.
              </p>
            ) : linkedExpensesCount > 0 ? (
              <p>
                This category has transaction history (<span className="font-semibold text-foreground">{linkedExpensesCount} expense(s)</span>) and cannot be deleted permanently. Historical usage must protect the category.
              </p>
            ) : (
              <p>
                This will permanently remove the <span className="font-semibold text-foreground">{category.name}</span> category. This action cannot be undone.
              </p>
            )}
          </div>
        </div>
      </div>

      <FlowPopupFooter className="mt-4 gap-2 flex-col sm:flex-row">
        {isBlocked ? (
          <Button onClick={onCancel} className="w-full rounded-xl h-11 text-xs font-semibold bg-primary text-white btn-premium-touch">
            Close
          </Button>
        ) : (
          <>
            <Button onClick={onCancel} variant="outline" className="rounded-xl h-11 text-xs font-semibold border-input btn-premium-touch">
              Cancel
            </Button>
            <Button 
              onClick={() => onDelete('Other')} 
              className="rounded-xl h-11 text-xs font-semibold bg-destructive hover:bg-destructive/90 text-white btn-premium-touch"
            >
              Delete category
            </Button>
          </>
        )}
      </FlowPopupFooter>
    </FlowDialog>
  );
}
