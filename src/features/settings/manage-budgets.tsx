'use client';

import { useState, useMemo } from 'react';
import { CategoryIcon } from '@/components/icons/category-icon';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { Category } from '@/types/domain';
import { DeleteCategoryDialog } from './delete-category-dialog';
import { useApp } from '@/components/providers/app-provider';
import { EditCategoryDialog } from './edit-category-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatePresence } from 'framer-motion';

interface ManageBudgetsProps {
    viewDate: Date;
    searchQuery?: string;
}

export function ManageBudgets({ viewDate, searchQuery = '' }: ManageBudgetsProps) {
  const { categories, deleteCategory } = useApp();
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  
  const viewMonthKey = useMemo(() => `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`, [viewDate]);

  const filteredCategories = useMemo(() => {
    const otherCategory = categories.find(c => c.name === 'Other');
    const otherCategories = categories.filter(c => c.name !== 'Other');
    const sortedCategories = otherCategory ? [...otherCategories, otherCategory] : otherCategories;

    return sortedCategories.filter(cat => 
      !searchQuery || cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  const handleDelete = (id: string) => {
    deleteCategory(id);
    setCategoryToDelete(null);
  };

  if (filteredCategories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 select-none">
        <p className="text-xs font-semibold text-foreground">No categories found</p>
        <p className="text-[10px] text-muted-foreground max-w-[200px] leading-relaxed">
          {searchQuery ? 'No results matching your query.' : 'Create categories to organize your spending.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2.5">
        {filteredCategories.map(cat => (
          <Card 
            key={cat.id} 
            className="border bg-card/40 hover:bg-card/60 transition-all duration-200 shadow-sm rounded-2xl overflow-hidden group"
          >
            <CardContent className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" 
                  style={{ backgroundColor: `${cat.color}15` }}
                >
                  <CategoryIcon name={cat.icon} style={{ color: cat.color }} className="h-5 w-5" />
                </div>
                <span className="font-bold text-sm text-foreground truncate">{cat.name}</span>
              </div>

              <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 touch-hover-actions transition-opacity duration-200">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg border-border/30 bg-background/50 hover:bg-background/80"
                  onClick={() => setCategoryToEdit(cat)}
                  aria-label={`Edit ${cat.name} category`}
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </Button>
                {cat.name !== 'Other' && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    onClick={() => setCategoryToDelete(cat)}
                    aria-label={`Delete ${cat.name} category`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

       <AnimatePresence>
        {categoryToEdit && (
          <EditCategoryDialog
            category={categoryToEdit}
            month={viewMonthKey}
            onOpenChange={(open) => !open && setCategoryToEdit(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {categoryToDelete && (
          <DeleteCategoryDialog
            category={categoryToDelete}
            onDelete={() => handleDelete(categoryToDelete.id)}
            onCancel={() => setCategoryToDelete(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

