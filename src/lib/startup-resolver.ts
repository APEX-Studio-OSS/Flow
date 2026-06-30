import { isSetupComplete } from './security-gate';

export type StartupState =
  | 'loading'
  | 'needs_onboarding'
  | 'ready_dashboard'
  | 'needs_repair'
  | 'incomplete_restore'
  | 'corrupt';

export interface StartupResolution {
  state: StartupState;
  destination: '/welcome' | '/dashboard';
}

/**
 * Resolves the startup destination screen for Flow app based on database state.
 */
export function resolveStartupDestination(options: {
  categories: any[];
  expenses: any[];
  budgets: any[];
  notes: any[];
  onboarded: boolean;
  replaceInProgress: boolean;
  userProfile: any;
}): StartupResolution {
  const { categories, expenses, budgets, notes, onboarded, replaceInProgress, userProfile } = options;

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

  const hasExpenses = Array.isArray(expenses) && expenses.length > 0;
  const hasRealCategories = Array.isArray(categories) && categories.some(cat => cat && cat.name && cat.name.toLowerCase() !== 'other');
  const hasRealData = hasRealCategories || hasExpenses;

  const hasAnyCategories = Array.isArray(categories) && categories.length > 0;

  if (isDbCorrupt) {
    return { state: 'corrupt', destination: '/welcome' };
  }

  if (!isSetupComplete(onboarded, userProfile)) {
    return { state: 'needs_onboarding', destination: '/welcome' };
  }

  // If onboarding flag is true but categories and expenses databases are completely empty -> treat as incomplete restore
  if (onboarded && !hasAnyCategories && !hasExpenses) {
    return { state: 'incomplete_restore', destination: '/welcome' };
  }

  // Otherwise, the database has valid data and is marked as onboarded
  return { state: 'ready_dashboard', destination: '/dashboard' };
}
