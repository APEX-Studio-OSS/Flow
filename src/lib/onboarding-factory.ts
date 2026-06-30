import { SUPPORTED_CURRENCIES, SUPPORTED_PALETTES } from './icon-registry';

export interface FreshOnboardingState {
  currentStep: 'welcome' | 'profile' | 'preferences-data';
  userProfile: {
    name: string;
    avatarUrl: string | null;
    isGeneratedAvatar: boolean;
  };
  currency: string;
  colorThemeName: string;
  graphStyle: 'bar' | 'line' | 'donut';
  graphXAxis: 'category' | 'date' | 'event' | 'person';
  expenseRemindersEnabled: boolean;
  isSampleData: boolean;
  experimentalSettings: {
    isNotesEnabled: boolean;
  };
  lastExpenseAddedAt: number | null;
  onboarded: boolean;
  expenses: any[];
  categories: any[];
  budgets: any[];
  notes: any[];
  dateEvents: Record<string, string>;
}

export function createFreshOnboardingState(): FreshOnboardingState {
  const defaultDisplayName = 'Apex Studio';
  const defaultCategories = [{ id: 'cat-8', name: 'Other', icon: 'Circle', color: '#909296' }];
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  
  return {
    currentStep: 'welcome',
    userProfile: {
      name: defaultDisplayName,
      avatarUrl: null,
      isGeneratedAvatar: true
    },
    currency: SUPPORTED_CURRENCIES[0] || 'USD',
    colorThemeName: SUPPORTED_PALETTES[0] || 'Ocean',
    graphStyle: 'bar',
    graphXAxis: 'category',
    expenseRemindersEnabled: false,
    isSampleData: false,
    experimentalSettings: {
      isNotesEnabled: false
    },
    lastExpenseAddedAt: null,
    onboarded: false,
    expenses: [],
    categories: defaultCategories,
    budgets: defaultCategories.map(c => ({
      category: c.name,
      limit: 0,
      month: currentMonth,
      categoryName: c.name,
      categoryIcon: c.icon,
      categoryColor: c.color,
    })),
    notes: [],
    dateEvents: {}
  };
}

