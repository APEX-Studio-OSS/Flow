'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FlowDialog } from '@/components/flow-popups/flow-dialog';
import { FlowPopupHeader } from '@/components/flow-popups/flow-popup-header';
import { FlowPopupFooter } from '@/components/flow-popups/flow-popup-footer';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/components/providers/app-provider';
import { CategorySelect } from '../settings/category-select';
import { getCurrencySymbol } from '@/lib/utils';

const noteSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  category: z.string().min(1, 'Category is required.'),
  person: z.string().min(1, "Person's name is required."),
});

type NoteFormValues = z.infer<typeof noteSchema>;

interface AddNoteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddNoteDialog({ open, onOpenChange }: AddNoteDialogProps) {
  const { addNote, currency } = useApp();

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      description: '',
      amount: undefined,
      category: '',
      person: '',
    },
  });

  const onSubmit = (data: NoteFormValues) => {
    addNote(data);
    onOpenChange(false);
    form.reset();
  };

  return (
    <FlowDialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if(!isOpen) form.reset(); }} className="p-5 select-none">
      <FlowPopupHeader
        title="Add Note"
        description="Log a new note about a person."
        onClose={() => onOpenChange(false)}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground select-none">
                      {getCurrencySymbol(currency)}
                    </span>
                    <Input type="number" inputMode="decimal" step="any" placeholder="0.00" className="pl-9 text-xl h-12 font-bold" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="e.g. Lent for lunch..." {...field} className="h-11 rounded-xl text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="person"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Person's name..." {...field} className="h-11 rounded-xl text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Separator className="opacity-45" />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <CategorySelect
                  value={field.value}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FlowPopupFooter className="pt-2">
            <Button type="submit" className="w-full rounded-xl h-12 text-sm font-semibold" size="lg">Add Note</Button>
          </FlowPopupFooter>
        </form>
      </Form>
    </FlowDialog>
  );
}
