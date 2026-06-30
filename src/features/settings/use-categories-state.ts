import { useCallback } from 'react';
import type { Category } from '@/types/domain';
import usePersistentState from '@/hooks/use-persistent-state';
import { STORAGE_KEYS } from '@/constants/storage-keys';

export function useCategoriesState() {
  const [categories, setCategories, areCategoriesLoaded] = usePersistentState<Category[]>(STORAGE_KEYS.categories, []);

  const addCategoryPure = useCallback((cat: Omit<Category, 'id'>) => {
    const newCategory: Category = { ...cat, id: `cat-${Date.now()}` };
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  }, [setCategories]);

  return {
    categories,
    setCategories,
    areCategoriesLoaded,
    addCategoryPure
  };
}
