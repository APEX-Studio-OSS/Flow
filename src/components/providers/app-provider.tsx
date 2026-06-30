
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Expense, Category, Budget, Note } from '@/lib/types';
import { getDevSampleData, sampleCategories } from '@/lib/dev-sample-data';
import { useRouter } from 'next/navigation';
import { AppIcon } from '../icons/app-icon';
import { generateAvatarUrl, getCurrentMonthKey, formatCurrency, getCurrencySymbol } from '@/lib/utils';
import usePersistentState from '@/hooks/use-persistent-state';
import { ThemeWrapper } from './theme-wrapper';
import { validateAppDataDeep } from '@/lib/backup-validation';
import { resolveAppAccessState } from '@/lib/security-gate';
import { createFreshOnboardingState } from '@/lib/onboarding-factory';
import { storage, withPersistenceSuspended, suspendPersistence, resumePersistence, setItemIgnoringSuspension } from '@/lib/storage';
import { STORAGE_KEYS, FLOW_OWNED_KEYS } from '@/constants/storage-keys';
import { OverlayStack } from '@/lib/overlay-stack';
import { repairDataObjects } from '@/lib/other-repair';
import { OverlayProvider } from './overlay-provider';


// Initialize global developer performance timings tracker
if (typeof window !== 'undefined') {
  (window as any).__flow_perf = (window as any).__flow_perf || {
    expensesCount: 0,
    filterTime: 0,
    groupingTime: 0,
    graphAggregationTime: 0,
    stressGenTime: 0,
    stressSaveTime: 0,
    initialRenderTime: 0,
  };
}


// #region --- Types ---

export type OnboardingStep = 'welcome' | 'profile' | 'preferences-data';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'profile',
  'preferences-data'
];

export type GraphStyle = 'bar' | 'line' | 'donut';
export type GraphXAxis = 'category' | 'date' | 'event' | 'person';

export type UserProfile = {
  name: string;
  avatarUrl: string | null;
  isGeneratedAvatar: boolean;
};

export type ExperimentalSettings = {
  isNotesEnabled: boolean;
};

export type ReplaceAppDataOptions = {
  expenses: Expense[];
  categories: Category[];
  budgets: Budget[];
  notes: Note[];
  dateEvents: Record<string, string>;
  userProfile?: UserProfile;
  currency?: string;
  experimentalSettings?: ExperimentalSettings;
  colorThemeName?: string;
  graphStyle?: GraphStyle;
  graphXAxis?: GraphXAxis;
  expenseRemindersEnabled?: boolean;
  isSampleData: boolean;
  onboarded: boolean;
  source: 'sample' | 'import' | 'reset' | 'fresh';
};

type AppState = {
  // Welcome Flow
  isFirstTime: boolean | undefined;
  accessState: 'initializing' | 'requiresOnboarding' | 'ready' | 'clearing';
  currentStep: OnboardingStep;
  
  // Data
  expenses: Expense[];
  categories: Category[];
  budgets: Budget[];
  notes: Note[];
  dateEvents: Record<string, string>;

  // User & Settings
  userProfile: UserProfile;
  currency: string;
  experimentalSettings: ExperimentalSettings;
  colorThemeName: string;
  graphStyle: GraphStyle;
  graphXAxis: GraphXAxis;
  isSampleData: boolean;
  isLoaded: boolean;
  isMotionReady: boolean;

  // Native
  expenseRemindersEnabled: boolean;
};

export type AppContextType = AppState & {
  // Setters
  setIsFirstTime: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  setAccessState: React.Dispatch<React.SetStateAction<'initializing' | 'requiresOnboarding' | 'ready' | 'clearing'>>;
  setCurrentStep: React.Dispatch<React.SetStateAction<OnboardingStep>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  setDateEvents: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setCurrency: React.Dispatch<React.SetStateAction<string>>;
  setExperimentalSettings: React.Dispatch<React.SetStateAction<ExperimentalSettings>>;
  setColorThemeName: React.Dispatch<React.SetStateAction<string>>;
  setGraphStyle: React.Dispatch<React.SetStateAction<GraphStyle>>;
  setGraphXAxis: React.Dispatch<React.SetStateAction<GraphXAxis>>;
  setIsSampleData: React.Dispatch<React.SetStateAction<boolean>>;
  setExpenseRemindersEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Actions
  addExpense: (expense: Omit<Expense, 'id' | 'date'> & { date?: Date }) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (originalCategoryName: string, updatedCategory: Category) => void;
  deleteCategory: (id: string, targetCategoryName?: string) => void;

  updateBudget: (category: string, limit: number, month: string) => void;
  deleteBudgetAllocationForMonth: (category: string, month: string) => void;
  reassignExpensesAndTransferBudget: (sourceCategoryName: string, monthKey: string) => Promise<void>;

  addNote: (note: Omit<Note, 'id' | 'date'>, date?: Date) => void;
  updateNote: (note: Note) => void;
  deleteNote: (id: string) => void;

  setDateEvent: (date: string, event: string) => void;
  
  finishOnboarding: (options: { sampleData: boolean; importData?: any }) => void;
  removeSampleData: () => void;
  loadSampleDataFromSettings: () => Promise<void>;
  loadStressTestData: (count: number, onProgress?: (percent: number) => void) => Promise<{ timeToGenerate: number; timeToSave: number }>;
  nextStep: (beforeTransition?: () => void) => void;
  prevStep: () => void;
  replaceAppData: (options: ReplaceAppDataOptions) => Promise<void>;
  resetForFreshOnboarding: () => Promise<void>;

  // Native triggers
  triggerTestReminder: () => Promise<boolean>;
  syncAutoBackupPayload: () => Promise<void>;
  replaceAppDataWithOptions: (options: ReplaceAppDataOptions) => Promise<void>;
};
// #endregion

const AppContext = createContext<AppContextType | undefined>(undefined);

// #region --- Color Themes ---
export const colorThemes: {
  name: string;
  primary: { light: string; dark: string };
  accent: { light: string; dark: string };
}[] = [
  {
    name: 'Ocean',
    primary: { light: '220 70% 50%', dark: '220 70% 60%' },
    accent: { light: '180 60% 45%', dark: '180 60% 55%' },
  },
  {
    name: 'Sky',
    primary: { light: '210 70% 55%', dark: '210 70% 65%' },
    accent: { light: '190 80% 60%', dark: '190 80% 70%' },
  },
  { 
    name: 'Violet',
    primary: { light: '256 34% 48%', dark: '256 34% 60%' },
    accent: { light: '328 76% 60%', dark: '328 76% 70%' },
  },
  {
    name: 'Orchid',
    primary: { light: '270 50% 55%', dark: '270 50% 65%' },
    accent: { light: '310 60% 60%', dark: '310 60% 70%' },
  },
  {
    name: 'Forest',
    primary: { light: '120 40% 40%', dark: '120 40% 50%' },
    accent: { light: '90 45% 55%', dark: '90 45% 65%' },
  },
  {
    name: 'Mint',
    primary: { light: '150 50% 45%', dark: '150 50% 55%' },
    accent: { light: '170 60% 50%', dark: '170 60% 60%' },
  },
  {
    name: 'Ruby',
    primary: { light: '350 70% 50%', dark: '350 70% 60%' },
    accent: { light: '330 65% 55%', dark: '330 65% 65%' },
  },
  {
    name: 'Sunset',
    primary: { light: '25 80% 55%', dark: '25 80% 65%' },
    accent: { light: '280 50% 60%', dark: '280 50% 70%' },
  },
];
// #endregion

const appProviderDateCache = new Map<string, { rawDate: string | Date; parsedDate: Date; dateStr: string; time: number }>();

export function AppProvider({ children }: { children: React.ReactNode }) {
  // #region --- State Initialization ---
  const [onboarded, setOnboarded, isOnboardedLoaded] = usePersistentState('flow-onboarded', false);
  const [accessState, setAccessState] = useState<'initializing' | 'requiresOnboarding' | 'ready' | 'clearing'>('initializing');
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');

  const [expenses, setExpenses, areExpensesLoaded] = usePersistentState<Expense[]>('flow-expenses', []);
  const [categories, setCategories, areCategoriesLoaded] = usePersistentState<Category[]>('flow-categories', []);
  const [budgets, setBudgets, areBudgetsLoaded] = usePersistentState<Budget[]>('flow-budgets', []);
  const [notes, setNotes, areNotesLoaded] = usePersistentState<Note[]>('flow-notes', []);
  const [dateEvents, setDateEvents, areDateEventsLoaded] = usePersistentState<Record<string, string>>('flow-date-events', {});
  const [userProfile, setUserProfile, isProfileLoaded] = usePersistentState<UserProfile>('flow-user-profile', { name: 'Apex Studio', avatarUrl: null, isGeneratedAvatar: true });
  const [currency, setCurrency, isCurrencyLoaded] = usePersistentState('flow-currency', 'USD');
  const [experimentalSettings, setExperimentalSettings, areExperimentalLoaded] = usePersistentState<ExperimentalSettings>('flow-experimental-settings', { isNotesEnabled: false });
  const [colorThemeName, setColorThemeName, isColorThemeLoaded] = usePersistentState('flow-color-palette', 'Ocean');
  const [graphStyle, setGraphStyle, isGraphStyleLoaded] = usePersistentState<GraphStyle>('flow-graph-style', 'bar');
  const [graphXAxis, setGraphXAxis, isGraphXAxisLoaded] = usePersistentState<GraphXAxis>('flow-graph-xaxis', 'category');
  const [isSampleData, setIsSampleData, isSampleDataLoaded] = usePersistentState('flow-is-sample-data', false);
  const [expenseRemindersEnabled, setExpenseRemindersEnabled, isRemindersLoaded] = usePersistentState('flow-expense-reminders-enabled', false);
  const [lastExpenseAddedAt, setLastExpenseAddedAt, isLastExpenseLoaded] = usePersistentState<number | null>('flow-last-expense-added-at', null);
  
  const isLoaded = [
    isOnboardedLoaded, areExpensesLoaded, areCategoriesLoaded, areBudgetsLoaded,
    areNotesLoaded, areDateEventsLoaded, isProfileLoaded, isCurrencyLoaded,
    areExperimentalLoaded, isColorThemeLoaded,
    isGraphStyleLoaded, isGraphXAxisLoaded, isSampleDataLoaded,
    isRemindersLoaded, isLastExpenseLoaded
  ].every(Boolean);

  const isFirstTime = accessState === 'initializing' ? undefined : (accessState === 'requiresOnboarding');

  const setIsFirstTime = useCallback((val: boolean | undefined | ((prev: boolean | undefined) => boolean | undefined)) => {
    setAccessState(prev => {
      const resolvedVal = val instanceof Function ? val(prev === 'requiresOnboarding' || prev === 'initializing') : val;
      if (resolvedVal === undefined) return 'initializing';
      return resolvedVal ? 'requiresOnboarding' : 'ready';
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      setAccessState('initializing');
      return;
    }
    if (accessState === 'clearing') {
      return;
    }
    const resolved = resolveAppAccessState({
      onboarded,
      userProfile,
      currency,
      colorThemeName,
      categories,
    });
    setAccessState(resolved);
  }, [isLoaded, onboarded, userProfile, currency, colorThemeName, categories, accessState]);
  
  const router = useRouter();
  const [isMotionReady, setIsMotionReady] = useState(false);

  // Centralized app readiness bootstrap sequence: storage hydration -> document.fonts.ready -> two RAFs -> ready
  useEffect(() => {
    if (!isLoaded) return;
    
    let isMounted = true;
    let raf1 = 0;
    let raf2 = 0;

    const bootstrapApp = async () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[FLOW_LAUNCH] Persistence hydration complete.');
      }

      // Wait for critical fonts to be loaded
      if (typeof document !== 'undefined' && document.fonts) {
        try {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[FLOW_LAUNCH] Waiting for fonts to be ready...');
          }
          await document.fonts.ready;
          if (process.env.NODE_ENV !== 'production') {
            console.log('[FLOW_LAUNCH] document.fonts.ready resolved.');
          }
        } catch (e) {
          console.warn('[FLOW_LAUNCH] document.fonts.ready failed:', e);
        }
      }

      if (!isMounted) return;

      // Wait for two requestAnimationFrame cycles for theme variables paint & layout stabilization
      raf1 = requestAnimationFrame(() => {
        if (!isMounted) return;
        raf2 = requestAnimationFrame(async () => {
          if (!isMounted) return;
          if (process.env.NODE_ENV !== 'production') {
            console.log('[FLOW_LAUNCH] Layout stable, app is ready.');
          }
          setIsMotionReady(true);

          // Hide splash screen on native android/ios
          try {
            const { Capacitor } = await import('@capacitor/core');
            if (Capacitor.isNativePlatform()) {
              if (process.env.NODE_ENV !== 'production') {
                console.log('[FLOW_LAUNCH] Hiding Capacitor native splash screen...');
              }
              const { SplashScreen } = await import('@capacitor/splash-screen');
              await SplashScreen.hide();
              if (process.env.NODE_ENV !== 'production') {
                console.log('[FLOW_LAUNCH] Splash screen hidden successfully.');
              }
            }
          } catch (error) {
            console.warn('[FLOW_LAUNCH] Failed to hide splash screen:', error);
          }
        });
      });
    };

    bootstrapApp();

    return () => {
      isMounted = false;
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [isLoaded]);

  // Listen to native appStateChange to distinguish cold launch from warm resume
  useEffect(() => {
    let appStateListener: any = null;
    const setupListener = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          const { App } = await import('@capacitor/app');
          appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
            if (process.env.NODE_ENV !== 'production') {
              console.log(`[FLOW_LIFECYCLE] App state changed: isActive = ${isActive} (Warm Resume)`);
            }
          });
        }
      } catch (err) {
        console.warn('Failed to listen to native AppStateChange in AppProvider:', err);
      }
    };
    setupListener();
    return () => {
      if (appStateListener) {
        appStateListener.remove();
      }
    };
  }, []);

  // Correctly deserialize and sort dates from localStorage descending (newest first)
  const deserializedExpenses = useMemo(() => {
    const list = [];
    const len = expenses.length;
    for (let i = 0; i < len; i++) {
      const e = expenses[i];
      if (!e) continue;
      
      let d: Date;
      let dateStr: string;
      let time: number;
      const cached = appProviderDateCache.get(e.id);
      if (cached && cached.rawDate === e.date) {
        d = cached.parsedDate;
        dateStr = cached.dateStr;
        time = cached.time;
      } else {
        d = e.date instanceof Date ? e.date : (e.date ? new Date(e.date) : new Date());
        if (isNaN(d.getTime())) d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateStr = `${y}-${m}-${day}`;
        time = d.getTime();
        appProviderDateCache.set(e.id, { rawDate: e.date, parsedDate: d, dateStr, time });
      }
      list.push({ ...e, date: d, __dateStr: dateStr, __time: time });
    }
    return list.sort((a, b) => (b.__time || 0) - (a.__time || 0));
  }, [expenses]);

  const deserializedNotes = useMemo(() => {
    const list = [];
    const len = notes.length;
    for (let i = 0; i < len; i++) {
      const n = notes[i];
      if (!n) continue;
      const d = n.date instanceof Date ? n.date : (n.date ? new Date(n.date) : new Date());
      list.push({ ...n, date: isNaN(d.getTime()) ? new Date() : d });
    }
    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [notes]);
  // #endregion

  // #region --- Data Loading and Persistence ---
  const repairAppStateIfNeeded = useCallback(async (
    currentCategories: Category[],
    currentExpenses: Expense[],
    currentBudgets: Budget[],
    currentNotes: Note[]
  ): Promise<{ categories: Category[]; expenses: Expense[]; budgets: Budget[]; notes: Note[] } | null> => {
    const result = repairDataObjects(currentCategories, currentExpenses, currentBudgets, currentNotes);
    if (result.repaired) {
      console.warn("Integrity check found discrepancies. Performing silent repair of local app state...");
      await storage.setItem('flow-categories', JSON.stringify(result.categories));
      await storage.setItem('flow-expenses', JSON.stringify(result.expenses));
      await storage.setItem('flow-budgets', JSON.stringify(result.budgets));
      await storage.setItem('flow-notes', JSON.stringify(result.notes));
      return {
        categories: result.categories,
        expenses: result.expenses,
        budgets: result.budgets,
        notes: result.notes
      };
    }
    return null;
  }, []);

  useEffect(() => {
    if (!isLoaded || accessState === 'clearing') return;
    
    const resolveStartupDestination = async (): Promise<{
      state: 'loading' | 'needs_onboarding' | 'ready_dashboard' | 'incomplete_restore' | 'corrupt';
      destination: '/welcome' | '/dashboard';
    }> => {
      if (!isLoaded) {
        return { state: 'loading', destination: '/welcome' };
      }

      const replaceInProgress = await storage.getItem('flow-replace-in-progress') === 'true';
      if (replaceInProgress) {
        return { state: 'corrupt', destination: '/welcome' };
      }

      let isDbCorrupt = !Array.isArray(categories) || !Array.isArray(expenses) || !Array.isArray(budgets) || !Array.isArray(notes);
      
      if (!isDbCorrupt) {
        for (const cat of categories) {
          if (!cat || typeof cat !== 'object' || typeof cat.id !== 'string' || typeof cat.name !== 'string') {
            isDbCorrupt = true;
            break;
          }
        }
      }
      
      if (!isDbCorrupt) {
        for (const exp of expenses) {
          if (!exp || typeof exp !== 'object' || typeof exp.id !== 'string' || typeof exp.amount !== 'number' || typeof exp.category !== 'string') {
            isDbCorrupt = true;
            break;
          }
        }
      }
      
      if (!isDbCorrupt) {
        for (const b of budgets) {
          if (!b || typeof b !== 'object' || typeof b.category !== 'string' || typeof b.limit !== 'number' || typeof b.month !== 'string') {
            isDbCorrupt = true;
            break;
          }
        }
      }
      
      if (!isDbCorrupt) {
        for (const n of notes) {
          if (!n || typeof n !== 'object' || typeof n.id !== 'string' || typeof n.amount !== 'number' || typeof n.category !== 'string') {
            isDbCorrupt = true;
            break;
          }
        }
      }

      const hasCategories = Array.isArray(categories) && categories.length > 0;
      const hasExpenses = Array.isArray(expenses) && expenses.length > 0;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Startup Resolver] Diagnostic checks:', {
          onboarded,
          categoriesCount: categories?.length || 0,
          expensesCount: expenses?.length || 0,
          budgetsCount: budgets?.length || 0,
          notesCount: notes?.length || 0,
          isLoaded,
          isDbCorrupt,
          replaceInProgress
        });
      }

      if (isDbCorrupt) {
        return { state: 'corrupt', destination: '/welcome' };
      }

      // If onboarding flag is false -> always force onboarding
      if (!onboarded) {
        return { state: 'needs_onboarding', destination: '/welcome' };
      }

      // If onboarding flag is true but categories and expenses databases are completely empty -> treat as incomplete restore
      if (onboarded && !hasCategories && !hasExpenses) {
        return { state: 'incomplete_restore', destination: '/welcome' };
      }

      // Otherwise, the database has valid data and is marked as onboarded
      return { state: 'ready_dashboard', destination: '/dashboard' };
    };

    const runIntegrityCheck = async () => {
      const { state, destination } = await resolveStartupDestination();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Startup Resolver] Final state: ${state}, routing to: ${destination}`);
      }

      if (state === 'loading') {
        return;
      }

      if (state === 'corrupt') {
        console.warn("Integrity check: Database is corrupt. Directing to Welcome flow with recovery options.");
        await storage.setItem('flow-onboarded', 'false');
        setOnboarded(false);
        setAccessState('requiresOnboarding');
        return;
      }

      if (state === 'needs_onboarding') {
        setAccessState('requiresOnboarding');
        return;
      }

      if (state === 'incomplete_restore') {
        console.warn("Integrity check: App marked as onboarded but database is empty. Directing to Welcome flow.");
        await storage.setItem('flow-onboarded', 'false');
        setOnboarded(false);
        setAccessState('requiresOnboarding');
        return;
      }

      // Run repair logic if database is partially incomplete or corrupt
      try {
        const repaired = await repairAppStateIfNeeded(categories, expenses, budgets, notes);
        if (repaired) {
          setCategories(repaired.categories);
          setExpenses(repaired.expenses);
          setBudgets(repaired.budgets);
          setNotes(repaired.notes);
        }
      } catch (err) {
        console.error("Integrity check repair failed:", err);
      }

      setAccessState('ready');
    };

    runIntegrityCheck();
  }, [isLoaded, onboarded, accessState, categories, expenses, budgets, notes, setCategories, setExpenses, setBudgets, setNotes, setOnboarded, repairAppStateIfNeeded]);

  // #endregion

  const replaceAppData = useCallback(async (options: ReplaceAppDataOptions) => {
    const inProgress = await storage.getItem('flow-replace-in-progress');
    if (inProgress === 'true') {
      console.warn("replaceAppData: A replacement or reset operation is already in progress.");
      return;
    }
    appProviderDateCache.clear();

    // --- Onboarded === true logic ---
    const categoriesList = [...(options.categories || [])];
    
    // Ensure default "Other" category exists
    let otherCategory = categoriesList.find(c => c.name.toLowerCase() === 'other');
    if (!otherCategory) {
      otherCategory = {
        id: 'cat-other-fallback',
        name: 'Other',
        icon: 'Circle',
        color: '#909296'
      };
      categoriesList.push(otherCategory);
    }

    // De-duplicate category IDs and names
    const categoryIds = new Set<string>();
    const categoryNames = new Set<string>();
    const uniqueCategories: Category[] = [];

    for (const cat of categoriesList) {
      if (!cat || !cat.name || !cat.id) continue;
      const normName = cat.name.trim().toLowerCase();
      if (categoryIds.has(cat.id) || categoryNames.has(normName)) {
        continue;
      }
      categoryIds.add(cat.id);
      categoryNames.add(normName);
      uniqueCategories.push({
        id: cat.id,
        name: cat.name.trim(),
        icon: cat.icon || 'Circle',
        color: cat.color || '#909296'
      });
    }

    const validCategoryNames = new Set(uniqueCategories.map(c => c.name));

    // Normalize expenses
    const expensesList = [...(options.expenses || [])];
    const uniqueExpenses: Expense[] = [];
    const expenseIds = new Set<string>();

    for (const exp of expensesList) {
      if (!exp || !exp.id) continue;
      if (expenseIds.has(exp.id)) continue;
      
      const amount = Number(exp.amount);
      if (isNaN(amount) || !Number.isFinite(amount) || amount <= 0) continue;

      const dObj = exp.date instanceof Date ? exp.date : new Date(exp.date);
      if (isNaN(dObj.getTime())) continue;

      let category = exp.category;
      if (!validCategoryNames.has(category)) {
        category = otherCategory.name;
      }

      expenseIds.add(exp.id);
      uniqueExpenses.push({
        id: exp.id,
        amount,
        description: exp.description || '',
        category,
        date: dObj,
        isOnline: typeof exp.isOnline === 'boolean' ? exp.isOnline : false
      });
    }

    // Normalize budgets
    const budgetsList = [...(options.budgets || [])];
    const uniqueBudgets: Budget[] = [];

    for (const b of budgetsList) {
      if (!b || !b.category || !b.month) continue;
      
      let category = b.category;
      if (!validCategoryNames.has(category)) {
        category = otherCategory.name;
      }

      const limit = Number(b.limit);
      if (isNaN(limit) || !Number.isFinite(limit) || limit < 0) continue;
      if (!/^\d{4}-\d{2}$/.test(b.month)) continue;

      const catDetails = uniqueCategories.find(c => c.name === category);

      uniqueBudgets.push({
        category,
        limit,
        month: b.month,
        categoryName: category,
        categoryIcon: catDetails?.icon || 'Circle',
        categoryColor: catDetails?.color || '#808080'
      });
    }

    // Normalize notes
    const notesList = [...(options.notes || [])];
    const uniqueNotes: Note[] = [];
    const noteIds = new Set<string>();

    for (const n of notesList) {
      if (!n || !n.id) continue;
      if (noteIds.has(n.id)) continue;

      const amount = Number(n.amount);
      if (isNaN(amount) || !Number.isFinite(amount)) continue;

      const dObj = n.date instanceof Date ? n.date : new Date(n.date);
      if (isNaN(dObj.getTime())) continue;

      let category = n.category;
      if (!validCategoryNames.has(category)) {
        category = otherCategory.name;
      }

      noteIds.add(n.id);
      uniqueNotes.push({
        id: n.id,
        amount,
        description: n.description || '',
        category,
        date: dObj,
        person: n.person || 'Unknown'
      });
    }

    // Run repair logic on the normalized collections
    const repairResult = repairDataObjects(uniqueCategories, uniqueExpenses, uniqueBudgets, uniqueNotes);
    const repairedCategories = repairResult.categories;
    const repairedExpenses = repairResult.expenses;
    const repairedBudgets = repairResult.budgets;
    const repairedNotes = repairResult.notes;

    // Validate the compiled data deeply before writing to storage
    const compiledDataToValidate = {
      categories: repairedCategories,
      expenses: repairedExpenses,
      budgets: repairedBudgets,
      notes: repairedNotes,
      dateEvents: options.dateEvents || {},
      userProfile: options.userProfile,
      currency: options.currency,
      experimentalSettings: options.experimentalSettings,
      colorThemeName: options.colorThemeName,
      graphStyle: options.graphStyle,
      graphXAxis: options.graphXAxis,
      isSampleData: options.isSampleData,
      expenseRemindersEnabled: options.expenseRemindersEnabled
    };
    validateAppDataDeep(compiledDataToValidate);

    // Backup existing data in case write fails
    const backupOfExistingData: Record<string, string> = {};
    const keysToBackup = await storage.getAllKeys();
    for (const key of keysToBackup) {
      try {
        const val = await storage.getItem(key);
        if (val) {
          backupOfExistingData[key] = val;
        }
      } catch (backupErr) {
        console.warn(`Failed to backup key ${key} before writing:`, backupErr);
      }
    }

    try {
      // Set replacement in progress flag
      await storage.setItem('flow-replace-in-progress', 'true');

      // Atomically write everything to local storage
      // Wiping only Flow-owned keys (excluding replace-in-progress)
      await Promise.all(FLOW_OWNED_KEYS.map(k => {
        if (k !== 'flow-replace-in-progress') {
          return storage.removeItem(k);
        }
        return Promise.resolve();
      }));

      // Write new states (excluding onboarded)
      await storage.setItem('flow-categories', JSON.stringify(repairedCategories));
      await storage.setItem('flow-expenses', JSON.stringify(repairedExpenses));
      await storage.setItem('flow-budgets', JSON.stringify(repairedBudgets));
      await storage.setItem('flow-notes', JSON.stringify(repairedNotes));
      await storage.setItem('flow-date-events', JSON.stringify(options.dateEvents || {}));
      await storage.setItem('flow-is-sample-data', JSON.stringify(options.isSampleData));

      if (options.userProfile) {
        await storage.setItem('flow-user-profile', JSON.stringify(options.userProfile));
      }
      if (options.currency) {
        await storage.setItem('flow-currency', JSON.stringify(options.currency));
      }
      if (options.experimentalSettings) {
        await storage.setItem('flow-experimental-settings', JSON.stringify(options.experimentalSettings));
      }
      if (options.colorThemeName) {
        await storage.setItem('flow-color-palette', JSON.stringify(options.colorThemeName));
      }
      if (options.graphStyle) {
        await storage.setItem('flow-graph-style', JSON.stringify(options.graphStyle));
      }
      if (options.graphXAxis) {
        await storage.setItem('flow-graph-xaxis', JSON.stringify(options.graphXAxis));
      }
      if (options.expenseRemindersEnabled !== undefined) {
        await storage.setItem('flow-expense-reminders-enabled', JSON.stringify(options.expenseRemindersEnabled));
      }

      // Write flow-onboarded LAST!
      await storage.setItem('flow-onboarded', JSON.stringify(options.onboarded));

      // Clear replacement in progress flag on success
      await storage.removeItem('flow-replace-in-progress');

      // Close overlays/dialogs
      OverlayStack.clear();
      if (typeof document !== 'undefined') {
        const escEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          bubbles: true,
          cancelable: true
        });
        Object.defineProperty(escEvent, 'which', { value: 27 });
        document.dispatchEvent(escEvent);
      }

      // Update all React states dynamically to refresh UI instantly
      setCategories(repairedCategories);
      setExpenses(repairedExpenses);
      setBudgets(repairedBudgets);
      setNotes(repairedNotes);
      setDateEvents(options.dateEvents || {});
      setIsSampleData(options.isSampleData);
      setOnboarded(options.onboarded);

      if (options.userProfile) setUserProfile(options.userProfile);
      if (options.currency) setCurrency(options.currency);
      if (options.experimentalSettings) setExperimentalSettings(options.experimentalSettings);
      if (options.colorThemeName) setColorThemeName(options.colorThemeName);
      if (options.graphStyle) setGraphStyle(options.graphStyle);
      if (options.graphXAxis) setGraphXAxis(options.graphXAxis);
      if (options.expenseRemindersEnabled !== undefined) setExpenseRemindersEnabled(options.expenseRemindersEnabled);

      setAccessState(options.onboarded ? 'ready' : 'requiresOnboarding');
      router.replace(options.onboarded ? '/dashboard' : '/welcome');
    } catch (err) {
      console.error("Critical error in replaceAppData. Attempting rollback...", err);
      try {
        await storage.removeItem('flow-replace-in-progress');
        const keysToRemove = await storage.getAllKeys();
        await Promise.all(keysToRemove.map(k => storage.removeItem(k)));
        for (const [key, val] of Object.entries(backupOfExistingData)) {
          await storage.setItem(key, val);
        }
      } catch (rollbackErr) {
        console.error("Rollback failed spectacularly:", rollbackErr);
      }
      throw err;
    }
  }, [
    router,
    setCategories,
    setExpenses,
    setBudgets,
    setNotes,
    setDateEvents,
    setIsSampleData,
    setOnboarded,
    setUserProfile,
    setCurrency,
    setExperimentalSettings,
    setColorThemeName,
    setGraphStyle,
    setGraphXAxis,
    setExpenseRemindersEnabled,
    setAccessState
  ]);


  // #region --- Monthly Budget Rollover and Snapshot ---
  useEffect(() => {
    if (!isLoaded || !onboarded || accessState === 'clearing' || !categories.length) return;
  
    const currentMonthKey = getCurrentMonthKey();
    const hasBudgetsForCurrentMonth = budgets.some(b => b.month === currentMonthKey);
  
    if (!hasBudgetsForCurrentMonth) {
      const date = new Date();
      date.setDate(1); 
      date.setMonth(date.getMonth() - 1);
      const lastMonthKey = getCurrentMonthKey(date);
      
      const lastMonthBudgets = budgets.filter(b => b.month === lastMonthKey);
      
      let budgetsToCarryOver: Budget[];
  
      if (lastMonthBudgets.length > 0) {
        budgetsToCarryOver = lastMonthBudgets.map(b => ({
          ...b,
          month: currentMonthKey,
        }));
      } else {
        const oldestBudgets = budgets.length > 0 ? budgets.filter(b => b.month === budgets.reduce((oldest, current) => new Date(current.month) < new Date(oldest.month) ? current : oldest).month) : [];
        if (oldestBudgets.length > 0) {
            budgetsToCarryOver = oldestBudgets.map(b => ({ ...b, month: currentMonthKey }));
        } else {
            budgetsToCarryOver = categories.map(cat => ({
                category: cat.name,
                limit: 0,
                month: currentMonthKey,
                categoryName: cat.name,
                categoryIcon: cat.icon,
                categoryColor: cat.color,
            }));
        }
      }
      
      setBudgets(prev => [...prev, ...budgetsToCarryOver]);
    }
  
    const needsMigration = budgets.some(b => !b.categoryName);
    if (needsMigration) {
      setBudgets(prevBudgets => prevBudgets.map(budget => {
        if (budget.categoryName) return budget;
        const cat = categories.find(c => c.name === budget.category);
        return {
          ...budget,
          categoryName: cat?.name || budget.category,
          categoryIcon: cat?.icon || 'Circle',
          categoryColor: cat?.color || '#808080'
        };
      }));
    }
  }, [isLoaded, onboarded, accessState, categories, budgets, setBudgets]);
  // #endregion

  // #region --- Actions ---
  const addExpense = useCallback((expenseData: Omit<Expense, 'id' | 'date'> & { date?: Date }) => {
    const cat = categories.find(c => c.name.toLowerCase() === expenseData.category.toLowerCase());
    setExpenses(prev => [{ id: `exp-${Date.now()}`, date: expenseData.date || new Date(), ...expenseData, categoryId: cat?.id }, ...prev]);
    setLastExpenseAddedAt(Date.now());
  }, [categories, setExpenses, setLastExpenseAddedAt]);
  const updateExpense = useCallback((updated: Expense) => {
    const cat = categories.find(c => c.name.toLowerCase() === updated.category.toLowerCase());
    const updatedWithId = { ...updated, categoryId: cat?.id };
    setExpenses(prev => prev.map(e => (e.id === updated.id ? updatedWithId : e)));
  }, [categories, setExpenses]);
  const deleteExpense = useCallback((id: string) => setExpenses(prev => prev.filter(e => e.id !== id)),[setExpenses]);
  
  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    if (cat.name.trim().toLowerCase() === 'other') {
      console.warn("Cannot create a category named Other");
      return;
    }
    const newCategory: Category = { ...cat, id: `cat-${Date.now()}` };
    setCategories(prev => [...prev, newCategory]);
    
    const currentMonthKey = getCurrentMonthKey();
    const newBudget: Budget = {
      category: newCategory.name,
      limit: 0,
      month: currentMonthKey,
      categoryName: newCategory.name,
      categoryIcon: newCategory.icon,
      categoryColor: newCategory.color
    };

    setBudgets(prev => {
        // Ensure we don't add a duplicate budget for the same category and month
        if (prev.some(b => b.category === newBudget.category && b.month === newBudget.month)) {
            return prev;
        }
        return [...prev, newBudget];
    });
  }, [setCategories, setBudgets]);
  
  const updateCategory = useCallback((originalCategoryName: string, updatedCategory: Category) => {
      if (updatedCategory.id === 'cat-8') {
          // Cannot rename 'Other'
          if (updatedCategory.name !== 'Other') {
              console.warn("Cannot rename the system Other category");
              return;
          }
      } else {
          // Cannot rename standard category to 'Other'
          if (updatedCategory.name.trim().toLowerCase() === 'other') {
              console.warn("Cannot rename a category to Other");
              return;
          }
      }

      setCategories(prev => prev.map(c => (c.id === updatedCategory.id ? updatedCategory : c)));
      
      const currentMonthKey = getCurrentMonthKey();
      
      setBudgets(prev => prev.map(b => {
          if (b.category === originalCategoryName && b.month === currentMonthKey) {
              return {
                  ...b,
                  category: updatedCategory.name,
                  categoryName: updatedCategory.name,
                  categoryIcon: updatedCategory.icon,
                  categoryColor: updatedCategory.color,
              };
          }
          return b;
      }));

      if (originalCategoryName !== updatedCategory.name) {
          const now = new Date();
          const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

          setExpenses(prev => prev.map(e => {
              if (e.category === originalCategoryName && new Date(e.date) >= startOfCurrentMonth) {
                  return { ...e, category: updatedCategory.name, categoryId: updatedCategory.id };
              }
              return e;
          }));
          setNotes(prev => prev.map(n => {
              if (n.category === originalCategoryName && new Date(n.date) >= startOfCurrentMonth) {
                  return { ...n, category: updatedCategory.name };
              }
              return n;
          }));
      }
  }, [setCategories, setBudgets, setExpenses, setNotes]);

  const deleteCategory = useCallback((id: string, targetCategoryName?: string) => {
    if (id === 'cat-8') {
      console.warn("Cannot delete the system Other category");
      return;
    }
    const categoryToDelete = categories.find(c => c.id === id);
    if (!categoryToDelete) return;

    setCategories(prev => prev.filter(c => c.id !== id));

    const resolvedTargetName = targetCategoryName || 'Other';
    const targetCategory = categories.find(c => c.name === resolvedTargetName) || { id: 'cat-8' };

    setBudgets(prev => prev.filter(b => {
        const budgetMonth = new Date(b.month + '-01');
        const startOfCurrentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        return !(b.category === categoryToDelete.name && budgetMonth >= startOfCurrentMonth);
    }));

    const updateItems = (items: any[]) => items.map(item => {
        if (item.category === categoryToDelete.name) {
            return { ...item, category: resolvedTargetName, categoryId: targetCategory.id };
        }
        return item;
    });

    setExpenses(prev => updateItems(prev));
    setNotes(prev => updateItems(prev));
  }, [categories, setCategories, setBudgets, setExpenses, setNotes]);
  
  const updateBudget = useCallback((category: string, limit: number, month: string) => {
    setBudgets(prev => {
      const existingBudgetIndex = prev.findIndex(b => b.category === category && b.month === month);
      const newBudgets = [...prev];
      if (existingBudgetIndex > -1) {
        newBudgets[existingBudgetIndex] = { ...newBudgets[existingBudgetIndex], limit };
      } else {
        const catDetails = categories.find(c => c.name === category);
        if (catDetails) {
            newBudgets.push({
                category,
                limit,
                month,
                categoryName: catDetails.name,
                categoryIcon: catDetails.icon,
                categoryColor: catDetails.color
            });
        }
      }
      return newBudgets;
    });
  }, [categories, setBudgets]);

  const deleteBudgetAllocationForMonth = useCallback((category: string, month: string) => {
    setBudgets(prev => prev.filter(b => !(b.category === category && b.month === month)));
  }, [setBudgets]);

  const reassignExpensesAndTransferBudget = useCallback(async (sourceCategoryName: string, monthKey: string) => {
    // Resolve canonical Other category (ID 'cat-8')
    const otherCategory = categories.find(c => c.id === 'cat-8') || {
      id: 'cat-8',
      name: 'Other',
      icon: 'Circle',
      color: '#909296'
    };

    // Capture the source category's budget limit
    const sourceBudget = budgets.find(b => b.category === sourceCategoryName && b.month === monthKey);
    const sourceLimit = sourceBudget ? sourceBudget.limit : 0;

    // Filter out the source budget from the budgets list
    const nextBudgets = budgets.filter(b => !(b.category === sourceCategoryName && b.month === monthKey));

    // Update or create the Other budget allocation for the target month Key
    const otherBudgetIndex = nextBudgets.findIndex(b => b.category === 'Other' && b.month === monthKey);
    if (otherBudgetIndex > -1) {
      nextBudgets[otherBudgetIndex] = {
        ...nextBudgets[otherBudgetIndex],
        limit: nextBudgets[otherBudgetIndex].limit + sourceLimit
      };
    } else {
      nextBudgets.push({
        category: 'Other',
        limit: sourceLimit,
        month: monthKey,
        categoryName: 'Other',
        categoryIcon: otherCategory.icon,
        categoryColor: otherCategory.color
      });
    }

    // Reassign affected expenses to Other
    const nextExpenses = expenses.map(e => {
      const d = e.date instanceof Date ? e.date : new Date(e.date);
      const eMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (e.category === sourceCategoryName && eMonth === monthKey) {
        return { ...e, category: 'Other', categoryId: otherCategory.id };
      }
      return e;
    });

    // Reassign affected notes to Other
    const nextNotes = notes.map(n => {
      const d = n.date instanceof Date ? n.date : new Date(n.date);
      const nMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (n.category === sourceCategoryName && nMonth === monthKey) {
        return { ...n, category: 'Other' };
      }
      return n;
    });

    // Atomically persist the operation
    suspendPersistence();
    try {
      await setItemIgnoringSuspension('flow-budgets', JSON.stringify(nextBudgets));
      await setItemIgnoringSuspension('flow-expenses', JSON.stringify(nextExpenses));
      await setItemIgnoringSuspension('flow-notes', JSON.stringify(nextNotes));

      // Storage writes succeeded! Now update React state.
      setBudgets(nextBudgets);
      setExpenses(nextExpenses);
      setNotes(nextNotes);
    } catch (err) {
      console.error("Atomic transaction failed in reassignExpensesAndTransferBudget:", err);
      throw err;
    } finally {
      resumePersistence();
    }
  }, [categories, budgets, expenses, notes, setBudgets, setExpenses, setNotes]);
  
  const addNote = useCallback((noteData: Omit<Note, 'id' | 'date'>, date: Date = new Date()) => setNotes(prev => [{ id: `note-${Date.now()}`, date, ...noteData }, ...prev]),[setNotes]);
  const updateNote = useCallback((updated: Note) => setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n))),[setNotes]);
  const deleteNote = useCallback((id: string) => setNotes(prev => prev.filter(n => n.id !== id)),[setNotes]);

  const setDateEvent = useCallback((date: string, event: string) => {
    setDateEvents(prev => {
        const newEvents = {...prev};
        if(event) newEvents[date] = event;
        else delete newEvents[date];
        return newEvents;
    });
  },[setDateEvents]);

  const nextStep = useCallback((beforeTransition?: () => void) => {
    if (typeof beforeTransition === 'function') {
      beforeTransition();
    }
    setCurrentStep(prev => {
      const idx = ONBOARDING_STEPS.indexOf(prev);
      if (idx !== -1 && idx < ONBOARDING_STEPS.length - 1) {
        return ONBOARDING_STEPS[idx + 1];
      }
      return prev;
    });
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => {
      const idx = ONBOARDING_STEPS.indexOf(prev);
      if (idx > 0) {
        return ONBOARDING_STEPS[idx - 1];
      }
      return prev;
    });
  }, []);
  
  const removeSampleData = useCallback(async () => {
    const defaultCategories = [{ id: 'cat-8', name: 'Other', icon: 'Circle', color: '#909296' }];
    const currentMonthKey = getCurrentMonthKey();
    const budgets = defaultCategories.map(c => ({
      category: c.name,
      limit: 0,
      month: currentMonthKey,
      categoryName: c.name,
      categoryIcon: c.icon,
      categoryColor: c.color,
    }));
    await replaceAppData({
      expenses: [],
      categories: defaultCategories,
      budgets,
      notes: [],
      dateEvents: {},
      userProfile,
      currency,
      colorThemeName,
      expenseRemindersEnabled,
      isSampleData: false,
      onboarded: true,
      source: 'reset'
    });
  }, [replaceAppData, userProfile, currency, colorThemeName, expenseRemindersEnabled]);


  const syncAutoBackupPayload = useCallback(async () => {}, []);

  const finishOnboarding = useCallback(async ({ sampleData, importData }: { sampleData: boolean; importData?: any }) => {
    if (importData && importData.data) {
      const data = importData.data;
      await replaceAppData({
        expenses: data.expenses || [],
        categories: data.categories || [],
        budgets: data.budgets || [],
        notes: data.notes || [],
        dateEvents: data.dateEvents || {},
        userProfile: data.userProfile,
        currency: data.currency,
        experimentalSettings: data.experimentalSettings,
        colorThemeName: data.colorThemeName,
        graphStyle: data.graphStyle,
        graphXAxis: data.graphXAxis,
        expenseRemindersEnabled: data.expenseRemindersEnabled,
        isSampleData: false,
        onboarded: true,
        source: 'import'
      });
    } else if (sampleData) {
      const devData = getDevSampleData();
      await replaceAppData({
        expenses: devData.expenses,
        categories: devData.categories,
        budgets: devData.budgets,
        notes: devData.notes,
        dateEvents: devData.dateEvents,
        userProfile,
        currency,
        colorThemeName,
        expenseRemindersEnabled,
        isSampleData: true,
        onboarded: true,
        source: 'sample'
      });
    } else {
      const defaultCategories = [{ id: 'cat-8', name: 'Other', icon: 'Circle', color: '#909296' }];
      const currentMonthKey = getCurrentMonthKey();
      const budgets = defaultCategories.map(c => ({
        category: c.name,
        limit: 0,
        month: currentMonthKey,
        categoryName: c.name,
        categoryIcon: c.icon,
        categoryColor: c.color,
      }));
      await replaceAppData({
        expenses: [],
        categories: defaultCategories,
        budgets,
        notes: [],
        dateEvents: {},
        userProfile,
        currency,
        colorThemeName,
        expenseRemindersEnabled,
        isSampleData: false,
        onboarded: true,
        source: 'fresh'
      });
    }
  }, [replaceAppData, userProfile, currency, colorThemeName, expenseRemindersEnabled]);

  const loadSampleDataFromSettings = useCallback(async () => {
    const devData = getDevSampleData();
    await replaceAppData({
      expenses: devData.expenses,
      categories: devData.categories,
      budgets: devData.budgets,
      notes: devData.notes,
      dateEvents: devData.dateEvents,
      userProfile,
      currency,
      colorThemeName,
      expenseRemindersEnabled,
      isSampleData: true,
      onboarded: true,
      source: 'sample'
    });
  }, [replaceAppData, userProfile, currency, colorThemeName, expenseRemindersEnabled]);

  const loadStressTestData = useCallback(async (count: number, onProgress?: (percent: number) => void) => {
    appProviderDateCache.clear();
    const t0 = performance.now();
    
    // 1. Wipe only Flow-owned keys
    await Promise.all(FLOW_OWNED_KEYS.map(key => storage.removeItem(key)));

    // 2. Setup categories
    const testCategories = sampleCategories;
    
    // 3. Generate budgets for current month
    const currentMonth = getCurrentMonthKey();
    const testBudgets = testCategories.map(cat => ({
      category: cat.name,
      limit: Math.floor(Math.random() * 5 + 1) * 200, // random limit between 200 and 1000
      month: currentMonth,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
    }));

    // 4. Generate sorted timestamps for expenses
    const timeSpan = 3 * 365 * 24 * 60 * 60 * 1000; // 3 years
    const nowMs = Date.now();
    const timestamps = new Array(count);
    for (let i = 0; i < count; i++) {
      timestamps[i] = nowMs - Math.random() * timeSpan;
    }
    // Sort descending (newest first)
    timestamps.sort((a, b) => b - a);

    const descriptions = [
      'Grocery Shopping', 'Gas Station Fuel', 'Restaurant Dinner',
      'Streaming Subscription', 'Coffee Shop', 'Gym Membership',
      'Electric Bill', 'Pharmacy Medicine', 'Cinema Tickets',
      'Uber Ride', 'Internet Service', 'Online Course Fee',
      'Book Store Purchase', 'Clothing Store', 'Home Repair'
    ];

    const testExpenses: Expense[] = [];
    const chunkSize = 5000;
    for (let i = 0; i < count; i += chunkSize) {
      const end = Math.min(i + chunkSize, count);
      for (let j = i; j < end; j++) {
        const cat = testCategories[Math.floor(Math.random() * testCategories.length)];
        testExpenses.push({
          id: `stress-exp-${j}`,
          amount: Math.round((Math.random() * 145 + 5) * 100) / 100, // 5 to 150
          description: `${descriptions[Math.floor(Math.random() * descriptions.length)]} #${j + 1}`,
          category: cat.name,
          date: new Date(timestamps[j]),
          isOnline: Math.random() > 0.5,
        });
      }
      if (onProgress) {
        onProgress(Math.round((end / count) * 80)); // 0-80% for generation
      }
      // Yield control back to UI event loop
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Generate test notes
    const notesCount = Math.min(200, Math.max(20, Math.floor(count / 100)));
    const noteTimestamps = new Array(notesCount);
    for (let i = 0; i < notesCount; i++) {
      noteTimestamps[i] = nowMs - Math.random() * timeSpan;
    }
    noteTimestamps.sort((a, b) => b - a);

    const people = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey'];
    const testNotes: Note[] = [];
    const notesChunkSize = 50;
    for (let i = 0; i < notesCount; i += notesChunkSize) {
      const end = Math.min(i + notesChunkSize, notesCount);
      for (let j = i; j < end; j++) {
        const cat = testCategories[Math.floor(Math.random() * testCategories.length)];
        testNotes.push({
          id: `stress-note-${j}`,
          amount: Math.round((Math.random() * 45 + 5) * 100) / 100,
          description: `Note description details for item #${j + 1}`,
          category: cat.name,
          date: new Date(noteTimestamps[j]),
          person: people[Math.floor(Math.random() * people.length)],
        });
      }
      if (onProgress) {
        onProgress(80 + Math.round((end / notesCount) * 10)); // 80-90%
      }
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    const t1 = performance.now();

    // 5. Save to storage with yielding/updates
    if (onProgress) onProgress(91);
    await storage.setItem('flow-categories', JSON.stringify(testCategories));
    if (onProgress) onProgress(93);
    await storage.setItem('flow-budgets', JSON.stringify(testBudgets));
    if (onProgress) onProgress(95);
    await storage.setItem('flow-expenses', JSON.stringify(testExpenses));
    if (onProgress) onProgress(97);
    await storage.setItem('flow-notes', JSON.stringify(testNotes));
    await storage.setItem('flow-date-events', JSON.stringify({}));
    await storage.setItem('flow-user-profile', JSON.stringify({ name: 'Stress Test User', avatarUrl: generateAvatarUrl('Stress Test User'), isGeneratedAvatar: true }));
    await storage.setItem('flow-currency', JSON.stringify('USD'));
    await storage.setItem('flow-color-palette', JSON.stringify('Ocean'));
    await storage.setItem('flow-is-sample-data', JSON.stringify(true));
    await storage.setItem('flow-onboarded', JSON.stringify(true));
    await storage.setItem('flow-experimental-settings', JSON.stringify({ isNotesEnabled: true }));
    if (onProgress) onProgress(100);

    const t2 = performance.now();

    const timeToGenerate = Math.round(t1 - t0);
    const timeToSave = Math.round(t2 - t1);

    if (typeof window !== 'undefined' && (window as any).__flow_perf) {
      (window as any).__flow_perf.stressGenTime = timeToGenerate;
      (window as any).__flow_perf.stressSaveTime = timeToSave;
      (window as any).__flow_perf.expensesCount = count;
    }

    return {
      timeToGenerate,
      timeToSave,
    };
  }, []);



  // Debounce effect for syncing auto backup payload
  useEffect(() => {
    if (!isLoaded || !onboarded || accessState === 'clearing') return;

    const timer = setTimeout(() => {
      // Avoid serialization overhead during active modal/dialog views
      const hasActiveDialog = typeof document !== 'undefined' &&
        (!!document.querySelector('[role="dialog"], [role="alertdialog"]') ||
         OverlayStack.getOverlayCount() > 0);
      if (hasActiveDialog) {
        return;
      }
      syncAutoBackupPayload();
    }, 2000); // 2 seconds debounce

    return () => clearTimeout(timer);
  }, [isLoaded, onboarded, accessState, syncAutoBackupPayload]);

  // Handle reminder alarm scheduling when toggled or when lastExpenseAddedAt changes
  useEffect(() => {
    if (!isLoaded || !onboarded || accessState === 'clearing') return;

    import('@/lib/native-bridge').then(({ nativeBridge }) => {
      if (!nativeBridge.isAndroid()) return;

      if (expenseRemindersEnabled) {
        // Schedule reminder for 6 hours from lastExpenseAddedAt or now (if null)
        const baseTime = lastExpenseAddedAt || Date.now();
        const elapsedMs = Date.now() - baseTime;
        const delayMs = (6 * 60 * 60 * 1000) - elapsedMs;

        // Convert delay to hours (minimum 0)
        const delayHours = Math.max(0, delayMs / (1000 * 60 * 60));
        
        nativeBridge.cancelExpenseReminder().then(() => {
          const targetDelay = delayHours > 0 ? delayHours : 6;
          nativeBridge.scheduleExpenseReminder({ delayHours: targetDelay });
        });
      } else {
        nativeBridge.cancelExpenseReminder();
      }
    });
  }, [isLoaded, onboarded, accessState, expenseRemindersEnabled, lastExpenseAddedAt]);

  const triggerTestReminder = useCallback(async () => {
    const { nativeBridge } = await import('@/lib/native-bridge');
    if (!nativeBridge.isAndroid()) return false;
    await nativeBridge.cancelExpenseReminder();
    return nativeBridge.scheduleExpenseReminder({ delaySeconds: 10 });
  }, []);

  const checkLaunchNotification = useCallback(async () => {
    try {
      const { nativeBridge } = await import('@/lib/native-bridge');
      if (!nativeBridge.isAndroid()) return;

      const action = await nativeBridge.getLaunchNotificationAction();
      if (action === 'add_expense') {
        router.replace('/dashboard?action=add-expense');
      } else if (action === 'open_budget') {
        router.replace('/budgets');
      }
    } catch (e) {
      console.error('Failed to check launch action:', e);
    }
  }, [router]);

  useEffect(() => {
    if (!isLoaded) return;

    // Run action check initially on load
    checkLaunchNotification();

    // Set up app state resume listener
    let appStateListener: any = null;

    const setupListener = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          const { App } = await import('@capacitor/app');
          appStateListener = await App.addListener('appStateChange', (state) => {
            if (state.isActive) {
              checkLaunchNotification();
            }
          });
        }
      } catch (err) {
        console.warn('App state listener registration failed:', err);
      }
    };

    setupListener();

    return () => {
      if (appStateListener) {
        appStateListener.remove();
      }
    };
  }, [isLoaded, checkLaunchNotification]);
  // #endregion

  const resetForFreshOnboarding = useCallback(async () => {
    setAccessState('clearing');
    try {
      await withPersistenceSuspended(async () => {
        // Clear all Flow-owned keys (excluding replace-in-progress)
        await Promise.all(FLOW_OWNED_KEYS.map(k => {
          if (k !== 'flow-replace-in-progress') {
            return storage.removeItem(k);
          }
          return Promise.resolve();
        }));
      });

      // Write flow-onboarded LAST!
      await storage.setItem('flow-onboarded', 'false');

      // Reset all in-memory states to defaults
      const freshState = createFreshOnboardingState();
      
      setExpenses(freshState.expenses);
      setCategories(freshState.categories);
      setBudgets(freshState.budgets);
      setNotes(freshState.notes);
      setDateEvents(freshState.dateEvents);
      setUserProfile(freshState.userProfile);
      setCurrency(freshState.currency);
      setColorThemeName(freshState.colorThemeName);
      setGraphStyle(freshState.graphStyle);
      setGraphXAxis(freshState.graphXAxis);
      setIsSampleData(freshState.isSampleData);
      setExpenseRemindersEnabled(freshState.expenseRemindersEnabled);
      setLastExpenseAddedAt(freshState.lastExpenseAddedAt);
      
      setOnboarded(false);
      setCurrentStep('welcome');
      setAccessState('requiresOnboarding');
      
      // Close overlays/dialogs
      OverlayStack.clear();
      
      router.replace('/welcome');
    } catch (err) {
      console.error('Reset failed:', err);
      // Fail-closed target: keep requiresOnboarding accessState and route to /welcome
      setAccessState('requiresOnboarding');
      router.replace('/welcome');
      throw err;
    }
  }, [
    router,
    setExpenses,
    setCategories,
    setBudgets,
    setNotes,
    setDateEvents,
    setUserProfile,
    setCurrency,
    setColorThemeName,
    setGraphStyle,
    setGraphXAxis,
    setIsSampleData,
    setExpenseRemindersEnabled,
    setLastExpenseAddedAt,
    setOnboarded,
    setAccessState,
    setCurrentStep
  ]);

  // Memoize context value
  const contextValue = useMemo(() => ({
    isFirstTime, accessState, currentStep, expenses: deserializedExpenses, categories, budgets, notes: deserializedNotes, dateEvents, userProfile,
    currency, experimentalSettings, colorThemeName, graphStyle, graphXAxis, isSampleData, isLoaded, isMotionReady,
    expenseRemindersEnabled,
    setIsFirstTime, setAccessState, setCurrentStep, setExpenses, setCategories, setBudgets, setNotes, setDateEvents, setUserProfile,
    setCurrency, setExperimentalSettings, setColorThemeName, setGraphStyle, setGraphXAxis, setIsSampleData,
    setExpenseRemindersEnabled,
    addExpense, updateExpense, deleteExpense,
    addCategory, updateCategory, deleteCategory,
    updateBudget,
    deleteBudgetAllocationForMonth,
    reassignExpensesAndTransferBudget,
    addNote, updateNote, deleteNote,
    setDateEvent,
    finishOnboarding, nextStep, prevStep, removeSampleData, loadSampleDataFromSettings, loadStressTestData,
    triggerTestReminder,
    syncAutoBackupPayload,
    replaceAppData,
    replaceAppDataWithOptions: replaceAppData,
    resetForFreshOnboarding,
  }), [
    isFirstTime, accessState, currentStep, deserializedExpenses, categories, budgets, deserializedNotes, dateEvents, userProfile,
    currency, experimentalSettings, colorThemeName, graphStyle, graphXAxis, isSampleData, isLoaded, isMotionReady,
    expenseRemindersEnabled,
    setIsFirstTime, setAccessState, setCurrentStep, setExpenses, setCategories, setBudgets, setNotes, setDateEvents, setUserProfile,
    setCurrency, setExperimentalSettings, setColorThemeName, setGraphStyle, setGraphXAxis, setIsSampleData,
    setExpenseRemindersEnabled,
    addExpense, updateExpense, deleteExpense, addCategory, updateCategory, deleteCategory, updateBudget,
    deleteBudgetAllocationForMonth, reassignExpensesAndTransferBudget,
    addNote, updateNote, deleteNote, setDateEvent, finishOnboarding, nextStep, prevStep, removeSampleData, loadSampleDataFromSettings, loadStressTestData,
    triggerTestReminder, syncAutoBackupPayload, replaceAppData, resetForFreshOnboarding
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      <ThemeWrapper>
        <OverlayProvider>
          {children}
        </OverlayProvider>
      </ThemeWrapper>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
