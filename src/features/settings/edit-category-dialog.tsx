'use client';

import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FlowDialog } from '@/components/flow-popups/flow-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/components/providers/app-provider';
import { CategoryIcon } from '@/components/icons/category-icon';
import { cn } from '@/lib/utils';
import { X, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OverlayStack } from '@/lib/overlay-stack';
import { curatedIcons, colorPresets } from './category-picker-popover';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import type { Category } from '@/types/domain';

const categorySchema = z.object({
  name: z.string().min(1, 'Enter a category name.').transform(val => val.trim()),
  icon: z.string().min(1, 'Please select an icon.'),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Choose a color.'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface EditCategoryDialogProps {
  category: Category;
  month?: string;
  onOpenChange: (open: boolean) => void;
}

export function EditCategoryDialog({ category, onOpenChange }: EditCategoryDialogProps) {
  const { updateCategory, categories, expenses } = useApp();

  const [isIconOpen, setIsIconOpen] = React.useState(false);
  const [isColorOpen, setIsColorOpen] = React.useState(false);

  const nameInputRef = React.useRef<HTMLInputElement | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  const handleIconOpenChange = (isOpen: boolean) => {
    setIsIconOpen(isOpen);
    if (isOpen) {
      setIsColorOpen(false);
    }
  };

  const handleColorOpenChange = (isOpen: boolean) => {
    setIsColorOpen(isOpen);
    if (isOpen) {
      setIsIconOpen(false);
    }
  };

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsIconOpen(false);
        setIsColorOpen(false);
      }
    };
    const handleOutsideTouch = (e: TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsIconOpen(false);
        setIsColorOpen(false);
      }
    };
    if (isIconOpen || isColorOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideTouch);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideTouch);
    };
  }, [isIconOpen, isColorOpen]);

  React.useEffect(() => {
    const activeOpen = isIconOpen || isColorOpen;
    if (activeOpen) {
      OverlayStack.register('edit-category-toggle-menu', () => {
        setIsIconOpen(false);
        setIsColorOpen(false);
      }, 3, undefined, false);
    } else {
      OverlayStack.unregister('edit-category-toggle-menu');
    }
    return () => {
      OverlayStack.unregister('edit-category-toggle-menu');
    };
  }, [isIconOpen, isColorOpen]);

  const hasHistory = useMemo(() => {
    if (!category) return false;
    return expenses.some(e => e.category === category.name);
  }, [expenses, category]);

  const isOther = useMemo(() => {
    if (!category) return false;
    return category.name.toLowerCase() === 'other';
  }, [category]);

  const isNameLocked = isOther || hasHistory;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      icon: 'Circle',
      color: '#64748B',
    },
  });

  React.useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        icon: category.icon,
        color: category.color,
      });
      setIsIconOpen(false);
      setIsColorOpen(false);
    }
  }, [category, form]);

  const onSubmit = (data: CategoryFormValues) => {
    const trimmedName = data.name;
    if (!trimmedName) {
      form.setError('name', { type: 'manual', message: 'Enter a category name.' });
      return;
    }

    const originalName = category.name;
    const isRenaming = originalName.toLowerCase() !== trimmedName.toLowerCase();

    if (isRenaming) {
      if (isNameLocked) {
        form.setError('name', { type: 'manual', message: 'Category name is locked.' });
        return;
      }
      if (categories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== category.id)) {
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
  };

  const selectedName = form.watch('name') || '';
  const selectedIcon = form.watch('icon') || 'Circle';
  const selectedColor = form.watch('color') || '#64748B';

  return (
    <FlowDialog 
      open={true} 
      onOpenChange={(open) => !open && onOpenChange(false)} 
      onOpenAutoFocus={(e) => e.preventDefault()}
      className="p-6 gap-4 w-[calc(100%-32px)] max-w-[400px] rounded-[28px]"
    >
      <Button
        variant="ghost"
        size="icon"
        type="button"
        className="absolute top-4 right-4 h-8 w-8 rounded-full text-muted-foreground hover:bg-muted select-none z-10"
        onClick={() => onOpenChange(false)}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="space-y-1 select-none pr-6">
        <h2 className="text-lg font-extrabold text-foreground leading-tight">Edit Category</h2>
        <p className="text-xs text-muted-foreground leading-normal">
          {isNameLocked 
            ? 'This category has transaction history, so its name is locked.'
            : 'Update how this category appears.'}
        </p>
      </div>

      <div 
        className="flex items-center justify-between p-3.5 border border-border/30 rounded-2xl shadow-xs transition-all duration-300 select-none"
        style={{ backgroundColor: `${selectedColor}10`, borderColor: `${selectedColor}20` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300" 
            style={{ backgroundColor: `${selectedColor}20` }}
          >
            <CategoryIcon name={selectedIcon} style={{ color: selectedColor }} className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-sm text-foreground truncate max-w-[170px]">
              {selectedName.trim() || 'Category Name'}
            </span>
            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Preview</span>
          </div>
        </div>
        
        <span 
          className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border select-none transition-colors"
          style={{ 
            backgroundColor: `${selectedColor}15`, 
            color: selectedColor, 
            borderColor: `${selectedColor}25` 
          }}
        >
          Category
        </span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1 flex flex-col min-h-0">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Name</FormLabel>
                <FormControl>
                  <Input 
                    {...field}
                    ref={(e) => {
                      field.ref(e);
                      nameInputRef.current = e;
                    }}
                    placeholder="e.g., Groceries" 
                    disabled={isNameLocked}
                    className="h-11 rounded-xl bg-background/50 border-input focus-visible:ring-2 focus-visible:ring-primary text-sm font-semibold"
                  />
                </FormControl>
                {isOther && (
                  <p className="text-[10px] text-muted-foreground font-semibold pt-0.5 select-none">
                    The "Other" category cannot be renamed.
                  </p>
                )}
                {hasHistory && !isOther && (
                  <p className="text-[10px] text-muted-foreground font-semibold pt-0.5 select-none">
                    Category name is locked due to transaction history.
                  </p>
                )}
                <FormMessage className="text-xs font-semibold text-destructive mt-0.5" />
              </FormItem>
            )}
          />

          <div ref={dropdownRef} className="flex flex-col gap-3 pt-1 select-none">
            <div className="grid grid-cols-2 gap-3.5">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem className="space-y-1.5 flex flex-col">
                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Icon</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      tabIndex={-1}
                      onClick={() => handleIconOpenChange(!isIconOpen)}
                      className={cn(
                        "h-11 w-full rounded-xl border border-input bg-background/50 hover:bg-muted/40 flex items-center justify-between px-3 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:rounded-xl transition-all duration-200",
                        isIconOpen && "border-primary bg-primary/5 ring-1 ring-primary"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CategoryIcon name={field.value} className="h-4.5 w-4.5 text-foreground flex-shrink-0" />
                        <span className="text-xs font-bold text-foreground truncate">Select</span>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200", isIconOpen && "rotate-180")} />
                    </Button>
                    <FormMessage className="text-xs font-semibold text-destructive mt-0.5" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem className="space-y-1.5 flex flex-col">
                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Color</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      tabIndex={-1}
                      onClick={() => handleColorOpenChange(!isColorOpen)}
                      className={cn(
                        "h-11 w-full rounded-xl border border-input bg-background/50 hover:bg-muted/40 flex items-center justify-between px-3 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:rounded-xl transition-all duration-200",
                        isColorOpen && "border-primary bg-primary/5 ring-1 ring-primary"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div 
                          className="h-5 w-5 rounded-full border border-black/15 dark:border-white/20 shadow-xs flex-shrink-0" 
                          style={{ backgroundColor: field.value }} 
                        />
                        <span className="text-xs font-bold text-foreground truncate">Select</span>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200", isColorOpen && "rotate-180")} />
                    </Button>
                    <FormMessage className="text-xs font-semibold text-destructive mt-0.5" />
                  </FormItem>
                )}
              />
            </div>

            <AnimatePresence>
              {isIconOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 4 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden bg-muted/20 border border-border/40 rounded-2xl p-2.5 space-y-2"
                >
                  <div
                    className="scrollable-area grid grid-cols-6 gap-1.5 overflow-y-auto px-1.5 pt-0.5 pb-2 no-scrollbar max-h-[190px]"
                    style={{
                      touchAction: 'pan-y',
                      overscrollBehavior: 'contain',
                      WebkitOverflowScrolling: 'touch',
                    }}
                  >
                    {curatedIcons.map((iconName) => {
                      const isSelected = selectedIcon === iconName;
                      return (
                        <button
                          key={iconName}
                          type="button"
                          tabIndex={-1}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            form.setValue('icon', iconName);
                            setIsIconOpen(false);
                          }}
                          className={cn(
                            "h-9 w-9 rounded-xl border flex items-center justify-center transition-all active:scale-[0.9] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                            isSelected
                              ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30"
                              : "border-border/30 bg-background/80 hover:bg-muted text-muted-foreground"
                          )}
                        >
                          <CategoryIcon name={iconName} className="h-4.5 w-4.5" />
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {isColorOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 4 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden bg-muted/20 border border-border/40 rounded-2xl p-2.5 space-y-2"
                >
                  <div
                    className="grid grid-cols-6 gap-2 px-1 pt-0.5 pb-2 justify-items-center"
                  >
                    {colorPresets.map((preset) => {
                      const isSelected = selectedColor.toLowerCase() === preset.value.toLowerCase();
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          tabIndex={-1}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            form.setValue('color', preset.value);
                            setIsColorOpen(false);
                          }}
                          className={cn(
                            "h-9 w-9 rounded-full border flex items-center justify-center transition-all active:scale-[0.85] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 relative",
                            isSelected
                              ? "ring-2 ring-primary ring-offset-2 scale-95"
                              : "border-border/30 hover:scale-105"
                          )}
                          style={{ backgroundColor: preset.value }}
                          title={preset.name}
                          aria-label={preset.name}
                        >
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-white mix-blend-difference" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl h-11 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 transition-all select-none mt-2"
          >
            Save Changes
          </Button>
        </form>
      </Form>
    </FlowDialog>
  );
}
