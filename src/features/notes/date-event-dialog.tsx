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
import { useApp } from '@/components/providers/app-provider';

const eventSchema = z.object({
  event: z.string().max(100, "Event description must be 100 characters or less."),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface DateEventDialogProps {
    date: string;
    onOpenChange: (open: boolean) => void;
}

export function DateEventDialog({ date, onOpenChange }: DateEventDialogProps) {
  const { dateEvents, setDateEvent } = useApp();
  
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      event: dateEvents[date] || '',
    },
  });

  const onSubmit = (data: EventFormValues) => {
    setDateEvent(date, data.event);
    onOpenChange(false);
  };

  return (
    <FlowDialog open={true} onOpenChange={onOpenChange} className="p-5 select-none">
      <FlowPopupHeader
        title="Event"
        description={`Add or edit the event for ${date}.`}
        onClose={() => onOpenChange(false)}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <FormField
            control={form.control}
            name="event"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="e.g. Project Deadline" {...field} className="h-11 rounded-xl text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FlowPopupFooter className="pt-2">
            <Button type="submit" className="w-full rounded-xl h-12 text-sm font-semibold" size="lg">Save Event</Button>
          </FlowPopupFooter>
        </form>
      </Form>
    </FlowDialog>
  );
}
