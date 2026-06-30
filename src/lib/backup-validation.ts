import { 
  SUPPORTED_ICONS, 
  ICON_ALIASES, 
  SUPPORTED_CURRENCIES, 
  SUPPORTED_PALETTES 
} from './icon-registry';

// #region --- Backward Compatibility Migrations ---

export interface BackupPayload {
  version: string;
  exportedAt?: string;
  data: any;
}

/**
 * Normalizes case-insensitive or legacy icon names using the canonical registry.
 */
export function mapLegacyIcon(iconName: string): string {
  if (typeof iconName !== 'string') return 'Circle';
  const trimmed = iconName.trim();
  const lower = trimmed.toLowerCase();
  
  const alias = ICON_ALIASES[lower] || ICON_ALIASES[trimmed];
  if (alias) return alias;

  const matchedIcon = SUPPORTED_ICONS.find(i => i.toLowerCase() === lower);
  if (matchedIcon) return matchedIcon;

  if (SUPPORTED_ICONS.includes(trimmed)) {
    return trimmed;
  }
  
  return 'Circle';
}

/**
 * Sequential migration runner for database backup schemas.
 */
export function migrateBackup(backup: any): BackupPayload {
  if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
    throw new Error('Invalid backup structure: root must be an object.');
  }

  let version = backup.version;
  let data = backup.data;

  // Fallback to legacy structure wrapping if 'data' is missing but schema elements exist at root
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    if (backup.categories || backup.expenses) {
      data = { ...backup };
      delete data.version;
      delete data.exportedAt;
      version = version || '1.0.0';
    } else {
      throw new Error('Invalid backup: missing data payload.');
    }
  }

  // Default to v1.0.0 if version field is completely missing
  if (typeof version !== 'string' || !version.trim()) {
    version = '1.0.0';
  }

  // Reject future/unsupported versions
  const vParts = version.split('.').map(Number);
  if (vParts[0] > 1 || (vParts[0] === 1 && vParts[1] > 2)) {
    throw new Error(`Unsupported future backup schema version: ${version}. Please update the application.`);
  }

  // Deep clone data before executing in-memory migrations
  let migratedData = JSON.parse(JSON.stringify(data));

  // Migration: v1.0.0 -> v1.1.0
  if (version === '1.0.0') {
    if (Array.isArray(migratedData.categories)) {
      migratedData.categories = migratedData.categories.map((cat: any) => {
        if (cat && typeof cat === 'object' && typeof cat.icon === 'string') {
          return {
            ...cat,
            icon: mapLegacyIcon(cat.icon)
          };
        }
        return cat;
      });
    }
    version = '1.1.0';
  }

  // Migration: v1.1.0 -> v1.2.0
  if (version === '1.1.0') {
    if (migratedData.graphStyle === 'pie') {
      migratedData.graphStyle = 'donut';
    }
    version = '1.2.0';
  }

  return {
    version: '1.2.0',
    exportedAt: backup.exportedAt || new Date().toISOString(),
    data: migratedData
  };
}

// #endregion

// #region --- Deep Data Validation ---

export const validateAppDataDeep = (data: any): void => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Data must be an object.');
  }

  // 1. Categories Validation
  if (!Array.isArray(data.categories)) {
    throw new Error("'categories' must be an array.");
  }
  
  const categoryIds = new Set<string>();
  const categoryNames = new Set<string>();
  let hasOther = false;

  for (let i = 0; i < data.categories.length; i++) {
    const cat = data.categories[i];
    if (!cat || typeof cat !== 'object' || Array.isArray(cat)) {
      throw new Error(`Category at index ${i} is not a valid object.`);
    }
    if (typeof cat.id !== 'string' || !cat.id.trim()) {
      throw new Error(`Category at index ${i} has an invalid or missing 'id'.`);
    }
    if (categoryIds.has(cat.id)) {
      throw new Error(`Duplicate category ID detected: ${cat.id}`);
    }
    categoryIds.add(cat.id);

    if (typeof cat.name !== 'string' || !cat.name.trim()) {
      throw new Error(`Category at index ${i} has an invalid or missing 'name'.`);
    }
    const normName = cat.name.trim().toLowerCase();
    if (categoryNames.has(normName)) {
      throw new Error(`Duplicate category name detected: ${cat.name}`);
    }
    categoryNames.add(normName);

    if (normName === 'other') {
      hasOther = true;
    }

    if (typeof cat.icon !== 'string' || !cat.icon.trim()) {
      throw new Error(`Category "${cat.name}" has an invalid or missing 'icon'.`);
    }
    if (!SUPPORTED_ICONS.includes(cat.icon)) {
      throw new Error(`Category "${cat.name}" has an invalid or unsupported icon: "${cat.icon}".`);
    }

    if (typeof cat.color !== 'string' || !cat.color.trim()) {
      throw new Error(`Category "${cat.name}" has an invalid or missing 'color'.`);
    }
    const isColorValid = /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(cat.color) ||
                         /^(rgb|rgba|hsl|hsla)\(.*\)$/.test(cat.color);
    if (!isColorValid) {
      throw new Error(`Category "${cat.name}" has an invalid color format: "${cat.color}".`);
    }
  }

  if (!hasOther) {
    throw new Error('Required default category "Other" is missing from categories.');
  }

  // 2. Expenses Validation
  if (data.expenses !== undefined) {
    if (!Array.isArray(data.expenses)) {
      throw new Error("'expenses' must be an array.");
    }
    const expenseIds = new Set<string>();
    for (let i = 0; i < data.expenses.length; i++) {
      const exp = data.expenses[i];
      if (!exp || typeof exp !== 'object' || Array.isArray(exp)) {
        throw new Error(`Expense at index ${i} is not a valid object.`);
      }
      if (typeof exp.id !== 'string' || !exp.id.trim()) {
        throw new Error(`Expense at index ${i} has an invalid or missing 'id'.`);
      }
      if (expenseIds.has(exp.id)) {
        throw new Error(`Duplicate expense ID detected: ${exp.id}`);
      }
      expenseIds.add(exp.id);

      if (typeof exp.description !== 'string') {
        throw new Error(`Expense with ID "${exp.id}" description must be a string.`);
      }
      if (typeof exp.amount !== 'number' || !Number.isFinite(exp.amount) || exp.amount <= 0) {
        throw new Error(`Expense "${exp.description || exp.id}" amount must be a finite positive number.`);
      }
      if (typeof exp.category !== 'string' || !exp.category.trim()) {
        throw new Error(`Expense "${exp.description || exp.id}" has an invalid or missing category.`);
      }
      if (!categoryNames.has(exp.category.trim().toLowerCase())) {
        throw new Error(`Expense "${exp.description || exp.id}" references category "${exp.category}" which does not exist in categories.`);
      }
      
      const parsedDate = exp.date instanceof Date ? exp.date : new Date(exp.date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error(`Expense "${exp.description || exp.id}" date must be a valid parseable date.`);
      }

      if (exp.isOnline !== undefined && typeof exp.isOnline !== 'boolean') {
        throw new Error(`Expense "${exp.description || exp.id}" isOnline must be a boolean.`);
      }
    }
  }

  // 3. Budgets Validation
  if (data.budgets !== undefined) {
    if (!Array.isArray(data.budgets)) {
      throw new Error("'budgets' must be an array.");
    }
    const budgetKeys = new Set<string>();
    for (let i = 0; i < data.budgets.length; i++) {
      const b = data.budgets[i];
      if (!b || typeof b !== 'object' || Array.isArray(b)) {
        throw new Error(`Budget at index ${i} is not a valid object.`);
      }
      if (typeof b.category !== 'string' || !b.category.trim()) {
        throw new Error(`Budget at index ${i} must have a valid 'category' name.`);
      }
      if (!categoryNames.has(b.category.trim().toLowerCase())) {
        throw new Error(`Budget at index ${i} references category "${b.category}" which does not exist in categories.`);
      }
      if (typeof b.limit !== 'number' || !Number.isFinite(b.limit) || b.limit < 0) {
        throw new Error(`Budget for category "${b.category}" limit must be a finite non-negative number.`);
      }
      if (typeof b.month !== 'string' || !/^\d{4}-\d{2}$/.test(b.month)) {
        throw new Error(`Budget for category "${b.category}" month must be in YYYY-MM format.`);
      }

      const budgetKey = `${b.category.trim().toLowerCase()}_${b.month}`;
      if (budgetKeys.has(budgetKey)) {
        throw new Error(`Duplicate budget key detected for category "${b.category}" and month "${b.month}".`);
      }
      budgetKeys.add(budgetKey);

      if (b.categoryName !== undefined && typeof b.categoryName !== 'string') {
        throw new Error(`Budget categoryName must be a string.`);
      }
      if (b.categoryIcon !== undefined && typeof b.categoryIcon !== 'string') {
        throw new Error(`Budget categoryIcon must be a string.`);
      }
      if (b.categoryColor !== undefined && typeof b.categoryColor !== 'string') {
        throw new Error(`Budget categoryColor must be a string.`);
      }
    }
  }

  // 4. Notes Validation
  if (data.notes !== undefined) {
    if (!Array.isArray(data.notes)) {
      throw new Error("'notes' must be an array.");
    }
    const noteIds = new Set<string>();
    for (let i = 0; i < data.notes.length; i++) {
      const note = data.notes[i];
      if (!note || typeof note !== 'object' || Array.isArray(note)) {
        throw new Error(`Note at index ${i} is not a valid object.`);
      }
      if (typeof note.id !== 'string' || !note.id.trim()) {
        throw new Error(`Note at index ${i} has an invalid or missing 'id'.`);
      }
      if (noteIds.has(note.id)) {
        throw new Error(`Duplicate note ID detected: ${note.id}`);
      }
      noteIds.add(note.id);

      if (typeof note.description !== 'string') {
        throw new Error(`Note with ID "${note.id}" description must be a string.`);
      }
      if (typeof note.category !== 'string' || !note.category.trim()) {
        throw new Error(`Note with ID "${note.id}" category must be a string.`);
      }
      if (!categoryNames.has(note.category.trim().toLowerCase())) {
        throw new Error(`Note with ID "${note.id}" references category "${note.category}" which does not exist in categories.`);
      }
      if (typeof note.amount !== 'number' || !Number.isFinite(note.amount) || note.amount <= 0) {
        throw new Error(`Note with ID "${note.id}" amount must be a finite positive number.`);
      }
      
      const parsedDate = note.date instanceof Date ? note.date : new Date(note.date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error(`Note with ID "${note.id}" date must be a valid parseable date.`);
      }
      
      if (typeof note.person !== 'string' || !note.person.trim()) {
        throw new Error(`Note with ID "${note.id}" person must be a non-empty string.`);
      }
    }
  }

  // 5. Date Events Validation
  if (data.dateEvents !== undefined) {
    if (typeof data.dateEvents !== 'object' || Array.isArray(data.dateEvents)) {
      throw new Error("'dateEvents' must be an object (key-value map).");
    }
    for (const [key, val] of Object.entries(data.dateEvents)) {
      if (typeof val !== 'string') {
        throw new Error(`dateEvents value for key "${key}" must be a string.`);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
        throw new Error(`dateEvents key "${key}" must be in YYYY-MM-DD format.`);
      }
    }
  }

  // 6. User Profile Validation
  if (data.userProfile !== undefined) {
    if (!data.userProfile || typeof data.userProfile !== 'object' || Array.isArray(data.userProfile)) {
      throw new Error("'userProfile' must be an object.");
    }
    if (typeof data.userProfile.name !== 'string' || !data.userProfile.name.trim()) {
      throw new Error("UserProfile name must be a non-empty string.");
    }
    if (data.userProfile.avatarUrl !== null && typeof data.userProfile.avatarUrl !== 'string') {
      throw new Error("UserProfile avatarUrl must be a string or null.");
    }
    if (typeof data.userProfile.isGeneratedAvatar !== 'boolean') {
      throw new Error("UserProfile isGeneratedAvatar must be a boolean.");
    }
  }

  // 7. General Preferences Strict Validation
  if (data.currency !== undefined) {
    if (typeof data.currency !== 'string' || !SUPPORTED_CURRENCIES.includes(data.currency)) {
      throw new Error(`Unsupported or invalid currency preference: "${data.currency}".`);
    }
  }
  if (data.colorThemeName !== undefined) {
    if (typeof data.colorThemeName !== 'string' || !SUPPORTED_PALETTES.includes(data.colorThemeName)) {
      throw new Error(`Unsupported or invalid color theme/palette: "${data.colorThemeName}".`);
    }
  }
  if (data.graphStyle !== undefined) {
    if (data.graphStyle !== 'bar' && data.graphStyle !== 'line' && data.graphStyle !== 'donut') {
      throw new Error("graphStyle must be 'bar', 'line', or 'donut'.");
    }
  }
  if (data.graphXAxis !== undefined) {
    if (!['category', 'date', 'event', 'person'].includes(data.graphXAxis)) {
      throw new Error("graphXAxis must be 'category', 'date', 'event', or 'person'.");
    }
  }
  if (data.isSampleData !== undefined && typeof data.isSampleData !== 'boolean') {
    throw new Error("isSampleData must be a boolean.");
  }
  if (data.experimentalSettings !== undefined) {
    if (!data.experimentalSettings || typeof data.experimentalSettings !== 'object' || Array.isArray(data.experimentalSettings)) {
      throw new Error("'experimentalSettings' must be an object.");
    }
    if (typeof data.experimentalSettings.isNotesEnabled !== 'boolean') {
      throw new Error("experimentalSettings.isNotesEnabled must be a boolean.");
    }
  }
  if (data.expenseRemindersEnabled !== undefined && typeof data.expenseRemindersEnabled !== 'boolean') {
    throw new Error("expenseRemindersEnabled must be a boolean.");
  }
};

export const validateBackupData = (backup: any): void => {
  if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
    throw new Error('Invalid backup file structure: root must be an object.');
  }
  if (typeof backup.version !== 'string') {
    throw new Error("Missing or invalid 'version' field. It must be a string.");
  }
  if (!backup.data || typeof backup.data !== 'object' || Array.isArray(backup.data)) {
    throw new Error("Missing or invalid 'data' object in backup file.");
  }
  
  validateAppDataDeep(backup.data);
};

// #endregion
