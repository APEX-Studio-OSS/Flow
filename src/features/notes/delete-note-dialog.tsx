'use client';

import { FlowAlert } from '@/components/flow-popups/flow-alert';
import type { Note } from '@/types/domain';
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/components/providers/app-provider';

interface DeleteNoteDialogProps {
  note: Note;
  onDelete: () => void;
  onCancel: () => void;
}

export function DeleteNoteDialog({ note, onDelete, onCancel }: DeleteNoteDialogProps) {
  const { currency } = useApp();
  return (
    <FlowAlert
      open={true}
      onOpenChange={(open) => !open && onCancel()}
      title="Are You Absolutely Sure?"
      description={`This action cannot be undone. This will permanently delete your note for "${note.person}" about "${note.description}" of ${formatCurrency(note.amount, currency)}.`}
      confirmText="Delete"
      cancelText="Cancel"
      onConfirm={onDelete}
      variant="destructive"
    />
  );
}
