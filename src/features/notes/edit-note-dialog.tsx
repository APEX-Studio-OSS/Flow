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
import { cn, getCurrencySymbol } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import type { Note } from '@/types/domain';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { formatDate } from '@/lib/utils';
import { useApp } from '@/components/providers/app-provider';
import { CategorySelect } from '../settings/category-select';

const noteSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  category: z.string().min(1, 'Category is required.'),
  person: z.string().min(1, "Person's name is required."),
  date: z.date({ required_error: 'A date is required.' }),
});

type NoteFormValues = z.infer<typeof noteSchema>;

interface EditNoteDialogProps {
    note: Note;
    onOpenChange: (open: boolean) => void;
}

export function EditNoteDialog({ note, onOpenChange }: EditNoteDialogProps) {
  const { currency, updateNote } = useApp();

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      description: note.description,
      amount: note.amount,
      category: note.category,
      person: note.person,
      date: note.date,
    },
  });

  const onSubmit = (data: NoteFormValues) => {
    updateNote({
        ...note,
        ...data
    });
    onOpenChange(false);
  };

  return (
    <FlowDialog open={true} onOpenChange={onOpenChange} className="p-5 select-none">
      <FlowPopupHeader
        title="Edit Note"
        description="Update the details of your note."
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
           <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal h-11 rounded-xl bg-background/50 border-input text-xs focus:ring-2 focus:ring-primary",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            formatDate(field.value)
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border shadow-md rounded-2xl overflow-hidden" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
            <Button type="submit" className="w-full rounded-xl h-12 text-sm font-semibold" size="lg">Save Changes</Button>
          </FlowPopupFooter>
        </form>
      </Form>
    </FlowDialog>
  );
}
