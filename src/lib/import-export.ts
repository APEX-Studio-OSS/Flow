import { storage } from '@/lib/storage';
import { validateBackupData, migrateBackup, mapLegacyIcon } from '@/lib/backup-validation';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { SUPPORTED_ICONS } from '@/lib/icon-registry';
import { repairDataObjects } from '@/lib/other-repair';

const KEY_MAPPING: Record<string, string> = {
  [STORAGE_KEYS.userProfile]: 'userProfile',
  [STORAGE_KEYS.expenses]: 'expenses',
  [STORAGE_KEYS.categories]: 'categories',
  [STORAGE_KEYS.budgets]: 'budgets',
  [STORAGE_KEYS.notes]: 'notes',
  [STORAGE_KEYS.dateEvents]: 'dateEvents',
  [STORAGE_KEYS.currency]: 'currency',
  [STORAGE_KEYS.experimentalSettings]: 'experimentalSettings',
  [STORAGE_KEYS.colorPalette]: 'colorThemeName',
  [STORAGE_KEYS.graphStyle]: 'graphStyle',
  [STORAGE_KEYS.graphXAxis]: 'graphXAxis',
  [STORAGE_KEYS.isSampleData]: 'isSampleData',
  [STORAGE_KEYS.expenseRemindersEnabled]: 'expenseRemindersEnabled',
};

/**
 * Generates a JSON string representing the complete export of the database state.
 */
export async function generateBackupJSON(): Promise<string> {
  const dataToExport: Record<string, any> = {};

  for (const [storageKey, dataKey] of Object.entries(KEY_MAPPING)) {
    const rawData = await storage.getItem(storageKey);
    if (rawData) {
      try {
        dataToExport[dataKey] = JSON.parse(rawData);
      } catch (e) {
        dataToExport[dataKey] = rawData.replace(/"/g, '');
      }
    }
  }

  if (Object.keys(dataToExport).length === 0) {
    throw new Error('Export failed: No data found.');
  }

  const backupData = {
    version: '1.2.0',
    exportedAt: new Date().toISOString(),
    data: dataToExport,
  };

  return JSON.stringify(backupData, null, 2);
}

function normalizeBackupData(data: any): any {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { categories: [{ id: 'cat-8', name: 'Other', icon: 'Circle', color: '#909296' }] };
  }

  // 1. Categories
  const rawCategories = Array.isArray(data.categories) ? data.categories : [];
  const normalizedCategories: any[] = [];
  const categoryNamesSet = new Set<string>();
  const categoryIdsSet = new Set<string>();

  for (const cat of rawCategories) {
    if (!cat || typeof cat !== 'object' || Array.isArray(cat)) continue;
    
    const id = typeof cat.id === 'string' && cat.id.trim() ? cat.id.trim() : `cat-gen-${Math.random().toString(36).substring(2, 9)}`;
    const name = typeof cat.name === 'string' && cat.name.trim() ? cat.name.trim() : 'Unnamed Category';
    
    // Check duplicates
    const normName = name.toLowerCase();
    if (categoryNamesSet.has(normName) || categoryIdsSet.has(id)) continue;
    
    const icon = typeof cat.icon === 'string' ? mapLegacyIcon(cat.icon) : 'Circle';
    
    let color = '#909296';
    if (typeof cat.color === 'string') {
      const isColorValid = /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(cat.color) ||
                           /^(rgb|rgba|hsl|hsla)\(.*\)$/.test(cat.color);
      if (isColorValid) color = cat.color;
    }

    categoryNamesSet.add(normName);
    categoryIdsSet.add(id);
    normalizedCategories.push({ id, name, icon, color });
  }

  // Ensure "Other" category exists
  if (!categoryNamesSet.has('other')) {
    normalizedCategories.push({
      id: 'cat-other-fallback',
      name: 'Other',
      icon: 'Circle',
      color: '#909296'
    });
    categoryNamesSet.add('other');
  }

  // Resolve category name (case-insensitive match to actual category name)
  const getCategoryMatch = (name: string): string => {
    const trimmed = (name || '').trim();
    const match = normalizedCategories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    return match ? match.name : 'Other';
  };

  // 2. Expenses
  const rawExpenses = Array.isArray(data.expenses) ? data.expenses : [];
  const normalizedExpenses: any[] = [];
  const expenseIdsSet = new Set<string>();

  for (const exp of rawExpenses) {
    if (!exp || typeof exp !== 'object' || Array.isArray(exp)) continue;
    
    const id = typeof exp.id === 'string' && exp.id.trim() ? exp.id.trim() : `exp-gen-${Math.random().toString(36).substring(2, 9)}`;
    if (expenseIdsSet.has(id)) continue;

    const amount = Number(exp.amount);
    if (isNaN(amount) || !Number.isFinite(amount) || amount <= 0) continue; // Skip invalid amounts

    const description = typeof exp.description === 'string' ? exp.description : '';
    const category = typeof exp.category === 'string' ? getCategoryMatch(exp.category) : 'Other';

    let date = exp.date;
    const parsedDate = date instanceof Date ? date : new Date(date);
    if (isNaN(parsedDate.getTime())) {
      date = new Date().toISOString();
    } else {
      date = parsedDate.toISOString();
    }

    const isOnline = typeof exp.isOnline === 'boolean' ? exp.isOnline : false;

    expenseIdsSet.add(id);
    normalizedExpenses.push({ id, amount, description, category, date, isOnline });
  }

  // 3. Budgets
  const rawBudgets = Array.isArray(data.budgets) ? data.budgets : [];
  const normalizedBudgets: any[] = [];
  const budgetKeysSet = new Set<string>(); // category_month

  for (const b of rawBudgets) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) continue;

    const category = typeof b.category === 'string' ? getCategoryMatch(b.category) : 'Other';
    const limit = Number(b.limit);
    if (isNaN(limit) || !Number.isFinite(limit) || limit < 0) continue;

    let month = b.month;
    if (typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      month = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    }

    const budgetKey = `${category.toLowerCase()}_${month}`;
    if (budgetKeysSet.has(budgetKey)) continue; // Skip duplicates: prevents duplicate allocations!

    const catDetails = normalizedCategories.find(c => c.name === category);

    budgetKeysSet.add(budgetKey);
    normalizedBudgets.push({
      category,
      limit,
      month,
      categoryName: category,
      categoryIcon: catDetails?.icon || 'Circle',
      categoryColor: catDetails?.color || '#909296'
    });
  }

  // 4. Notes
  const rawNotes = Array.isArray(data.notes) ? data.notes : [];
  const normalizedNotes: any[] = [];
  const noteIdsSet = new Set<string>();

  for (const n of rawNotes) {
    if (!n || typeof n !== 'object' || Array.isArray(n)) continue;

    const id = typeof n.id === 'string' && n.id.trim() ? n.id.trim() : `note-gen-${Math.random().toString(36).substring(2, 9)}`;
    if (noteIdsSet.has(id)) continue;

    const amount = Number(n.amount);
    if (isNaN(amount) || !Number.isFinite(amount) || amount <= 0) continue;

    const description = typeof n.description === 'string' ? n.description : '';
    const category = typeof n.category === 'string' ? getCategoryMatch(n.category) : 'Other';

    let date = n.date;
    const parsedDate = date instanceof Date ? date : new Date(date);
    if (isNaN(parsedDate.getTime())) {
      date = new Date().toISOString();
    } else {
      date = parsedDate.toISOString();
    }

    const person = typeof n.person === 'string' && n.person.trim() ? n.person.trim() : 'Unknown';

    noteIdsSet.add(id);
    normalizedNotes.push({ id, amount, description, category, date, person });
  }

  // 5. Date Events
  const normalizedDateEvents: Record<string, string> = {};
  if (data.dateEvents && typeof data.dateEvents === 'object' && !Array.isArray(data.dateEvents)) {
    for (const [key, val] of Object.entries(data.dateEvents)) {
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key)) {
        normalizedDateEvents[key] = val;
      }
    }
  }

  // 6. User Profile
  let normalizedProfile = undefined;
  if (data.userProfile !== undefined && data.userProfile !== null && typeof data.userProfile === 'object' && !Array.isArray(data.userProfile)) {
    const rawProfile = data.userProfile;
    normalizedProfile = {
      name: typeof rawProfile.name === 'string' && rawProfile.name.trim() ? rawProfile.name.trim() : 'Apex Studio',
      avatarUrl: typeof rawProfile.avatarUrl === 'string' ? rawProfile.avatarUrl : null,
      isGeneratedAvatar: typeof rawProfile.isGeneratedAvatar === 'boolean' ? rawProfile.isGeneratedAvatar : true
    };
  }

  // 7. General Settings & Preferences
  const currency = typeof data.currency === 'string' ? data.currency : undefined;
  const colorThemeName = typeof data.colorThemeName === 'string' ? data.colorThemeName : undefined;
  
  let graphStyle = undefined;
  if (data.graphStyle === 'bar' || data.graphStyle === 'line' || data.graphStyle === 'donut') {
    graphStyle = data.graphStyle;
  }

  let graphXAxis = undefined;
  if (['category', 'date', 'event', 'person'].includes(data.graphXAxis)) {
    graphXAxis = data.graphXAxis;
  }

  const isSampleData = typeof data.isSampleData === 'boolean' ? data.isSampleData : undefined;
  const expenseRemindersEnabled = typeof data.expenseRemindersEnabled === 'boolean' ? data.expenseRemindersEnabled : undefined;

  const repaired = repairDataObjects(normalizedCategories, normalizedExpenses, normalizedBudgets, normalizedNotes);

  return {
    categories: repaired.categories,
    expenses: repaired.expenses,
    budgets: repaired.budgets,
    notes: repaired.notes,
    dateEvents: normalizedDateEvents,
    userProfile: normalizedProfile,
    currency,
    colorThemeName,
    graphStyle,
    graphXAxis,
    isSampleData,
    expenseRemindersEnabled
  };
}

/**
 * Parses raw JSON string content and validates it deeply.
 * Throws an Error if invalid, otherwise returns the parsed backup data object.
 */
export function parseAndValidateBackup(jsonString: string): any {
  let parsedData: any;
  try {
    parsedData = JSON.parse(jsonString);
  } catch (err) {
    throw new Error('Invalid JSON format: file cannot be parsed.');
  }

  // 1. Run migrations in memory first (converts 1.0.0/1.1.0 to 1.2.0, handles icon aliases)
  const migratedBackup = migrateBackup(parsedData);

  // 2. Normalize database fields, deduplicate categories/budgets, and resolve references
  migratedBackup.data = normalizeBackupData(migratedBackup.data);

  // 3. Deep validate the migrated, normalized complete backup
  validateBackupData(migratedBackup);

  return migratedBackup;
}
