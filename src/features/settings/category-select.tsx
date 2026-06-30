'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/components/providers/app-provider';
import { CategoryIcon } from '@/components/icons/category-icon';
import { FlowSelectSheet } from '@/components/flow-popups/flow-select-sheet';
import { ChevronsUpDown } from 'lucide-react';

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  const { categories } = useApp();
  const [open, setOpen] = useState(false);

  const selectedCategory = categories.find(c => c.name === value);

  const options = useMemo(() => {
    return categories.map(c => ({
      value: c.name,
      label: c.name,
      icon: <CategoryIcon name={c.icon} style={{ color: c.color }} className="h-4 w-4" />,
    }));
  }, [categories]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full justify-between h-12 rounded-xl bg-background/50 border-input focus:ring-2 focus:ring-primary text-sm font-medium"
      >
        {selectedCategory ? (
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${selectedCategory.color}15` }}>
              <CategoryIcon name={selectedCategory.icon} style={{ color: selectedCategory.color }} className="h-4 w-4" />
            </div>
            <span className="font-semibold text-foreground text-sm">{selectedCategory.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Choose a category</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      <FlowSelectSheet
        open={open}
        onOpenChange={setOpen}
        title="Select Category"
        description="Choose a category for your note."
        value={value}
        onValueChange={onChange}
        options={options}
        searchPlaceholder="Search category..."
      />
    </>
  );
}
