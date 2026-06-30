'use client';

import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { CategoryIcon } from '@/components/icons/category-icon';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FlowFloatingSheet } from '@/components/flow-popups/flow-floating-sheet';
import { Button } from '@/components/ui/button';

interface CategoryFilterDropdownProps {
  selectedCategories: string[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  parentOpen?: boolean;
}

export function CategoryFilterDropdown({ selectedCategories, setSelectedCategories, parentOpen }: CategoryFilterDropdownProps) {
  const { categories } = useApp();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (parentOpen === false) {
      setOpen(false);
    }
  }, [parentOpen]);

  const handleSelect = (categoryName: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };
  
  const sortedCategories = [...categories].sort((a,b) => a.name.localeCompare(b.name));

  return (
    <>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="w-full justify-between h-10 text-xs font-semibold rounded-xl bg-background/50 border-input hover:bg-background/80 transition-colors"
      >
        <span className="truncate">
          {selectedCategories.length === 0 && "Select categories..."}
          {selectedCategories.length === 1 && `1 category selected`}
          {selectedCategories.length > 1 && `${selectedCategories.length} categories selected`}
        </span>
        <div className="flex items-center">
          {selectedCategories.length > 0 && (
            <Badge variant="secondary" className="mr-2 h-6 font-bold">{selectedCategories.length}</Badge>
          )}
        </div>
      </Button>

      <FlowFloatingSheet
        open={open}
        onOpenChange={setOpen}
        className="max-h-[350px] p-5 gap-3.5"
      >
        <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none text-center">
          Select Categories
        </span>
        
        <Command className="overflow-hidden flex flex-col flex-1 max-h-[250px] bg-transparent">
          <CommandInput 
            placeholder="Search categories..." 
            className="h-10 text-xs rounded-xl bg-background/50 border-input focus:ring-2 focus:ring-primary"
          />
          <CommandList className="scrollable-area overflow-y-auto mt-1.5 scrollbar-thin select-none max-h-[200px]">
            <CommandEmpty className="text-xs py-8 text-center text-muted-foreground select-none">
              No categories found.
            </CommandEmpty>
            <CommandGroup className="p-0 space-y-1">
              {sortedCategories.map((category) => {
                const isSelected = selectedCategories.includes(category.name);
                return (
                  <CommandItem
                    key={category.id}
                    onSelect={() => handleSelect(category.name)}
                    value={category.name}
                    className={cn(
                      "w-full flex items-center justify-between h-12 px-3 text-xs rounded-xl transition-all cursor-pointer select-none active:scale-98 border border-transparent",
                      isSelected ? "bg-muted/50 font-bold border-border/40" : "bg-background/20"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div 
                        className="h-7 w-7 rounded-xl flex items-center justify-center flex-shrink-0" 
                        style={{ backgroundColor: `${category.color}15` }}
                      >
                        <CategoryIcon name={category.icon} style={{ color: category.color }} className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-foreground text-xs leading-none truncate">{category.name}</span>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </FlowFloatingSheet>
    </>
  );
}
