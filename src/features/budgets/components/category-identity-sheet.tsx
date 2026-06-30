'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { BottomFloatingForm } from '@/components/flow-popups/bottom-floating-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/components/providers/app-provider';
import { useMemo, useEffect } from 'react';
import { CategoryIconGrid } from './category-icon-grid';
import { CategoryColorPalette } from './category-color-palette';
import { CategoryPreviewPill } from './category-preview-pill';
import type { Category } from '@/types/domain';

const categorySchema = z.object({
  name: z.string().min(1, 'Enter a category name.').transform(val => val.trim()),
  icon: z.string().min(1, 'Please select an icon.'),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Choose a color.'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryIdentitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category; // If present, we are in edit mode
}

export function CategoryIdentitySheet({ open, onOpenChange, category }: CategoryIdentitySheetProps) {
  const { addCategory, updateCategory, categories, expenses } = useApp();

  const isEditMode = !!category;

  const hasHistory = useMemo(() => {
    if (!category) return false;
    return expenses.some(e => e.category === category.name);
  }, [expenses, category]);

  const isOther = useMemo(() => {
    if (!category) return false;
    return category.name.toLowerCase() === 'other';
  }, [category]);

  const isNameLocked = isEditMode && (isOther || hasHistory);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      icon: 'Circle',
      color: '#64748B',
    },
  });

  // Prefill or reset values when open/category changes
  useEffect(() => {
    if (open) {
      if (category) {
        form.reset({
          name: category.name,
          icon: category.icon,
          color: category.color,
        });
      } else {
        form.reset({
          name: '',
          icon: 'Circle',
          color: '#64748B',
        });
      }
    }
  }, [open, category, form]);

  const onSubmit = (data: CategoryFormValues) => {
    const trimmedName = data.name;
    if (!trimmedName) {
      form.setError('name', { type: 'manual', message: 'Enter a category name.' });
      return;
    }

    if (isEditMode && category) {
      const originalName = category.name;
      const isRenaming = originalName.toLowerCase() !== trimmedName.toLowerCase();

      if (isRenaming) {
        if (isNameLocked) {
          form.setError('name', { type: 'manual', message: 'Category name is locked.' });
          return;
        }
        if (categories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
          form.setError('name', { type: 'manual', message: 'A category with this name already exists.' });
          return;
        }
        if (trimmedName.toLowerCase() === 'other') {
          form.setError('name', { type: 'manual', message: 'The name "Other" is reserved.' });
          return;
        }
      }

      updateCategory(originalName, {
        ...category,
        name: isNameLocked ? originalName : trimmedName,
        icon: data.icon,
        color: data.color,
      });

      onOpenChange(false);
    } else {
      // Create mode
      if (categories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
        form.setError('name', { type: 'manual', message: 'A category with this name already exists.' });
        return;
      }
      
      if (trimmedName.toLowerCase() === 'other') {
        form.setError('name', { type: 'manual', message: 'The name "Other" is reserved.' });
        return;
      }

      addCategory({ ...data, name: trimmedName });
      onOpenChange(false);
      form.reset();
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
    }
    onOpenChange(isOpen);
  };

  const previewName = form.watch('name') || '';
  const previewColor = form.watch('color') || '#64748B';
  const previewIcon = form.watch('icon') || 'Circle';

  // Header texts
  const title = isEditMode ? 'Edit Category' : 'Create Category';
  const description = isEditMode
    ? isNameLocked
      ? 'This category has transaction history, so its name is locked.'
      : 'Update how this category appears.'
    : 'Create a category, then add a monthly budget to use it.';

  return (
    <BottomFloatingForm
      open={open}
      onClose={() => handleOpenChange(false)}
      title={title}
      description={description}
      footer={
        <div className="flex flex-row gap-2 w-full select-none">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleOpenChange(false)} 
            className="flex-1 rounded-xl h-11 text-xs font-bold border-input"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="category-identity-form"
            className="flex-1 rounded-xl h-11 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 transition-all"
          >
            {isEditMode ? 'Save Changes' : 'Create'}
          </Button>
        </div>
      }
    >
      <Form {...form}>
        <form id="category-identity-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-muted-foreground">Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Groceries" 
                    disabled={isNameLocked}
                    className="h-10 rounded-xl bg-background/50 border-input focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200 text-sm font-semibold"
                    {...field} 
                  />
                </FormControl>
                {isOther && (
                  <p className="text-[10px] text-muted-foreground font-semibold pt-0.5 select-none">
                    The "Other" category cannot be renamed.
                  </p>
                )}
                <FormMessage className="text-xs font-semibold text-destructive mt-0.5" />
              </FormItem>
            )}
          />

          <CategoryPreviewPill name={previewName} icon={previewIcon} color={previewColor} />

          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormControl>
                  <CategoryIconGrid value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage className="text-xs font-semibold text-destructive mt-0.5" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormControl>
                  <CategoryColorPalette value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage className="text-xs font-semibold text-destructive mt-0.5" />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </BottomFloatingForm>
  );
}
