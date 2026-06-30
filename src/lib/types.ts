
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  categoryId?: string;
  date: Date;
  isOnline: boolean;
  __dateStr?: string;
  __time?: number;
}

export interface Note {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: Date;
  person: string;
}

export interface Budget {
  category: string;
  limit: number;
  month: string; // YYYY-MM
  // Snapshot of category details for historical accuracy
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
}

export type UserProfile = {
  name: string;
  avatarUrl: string | null;
  isGeneratedAvatar: boolean;
};
