import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SUPPORTED_ICONS } from '../icon-registry';
import { migrateBackup, mapLegacyIcon, validateBackupData } from '../backup-validation';
import { parseAndValidateBackup, generateBackupJSON } from '../import-export';
import { colorPresets } from '../../features/settings/category-picker-popover';
import { storage } from '../storage';

// Helper to create a valid base backup payload structure
function createBaseBackupPayload(dataOverride: any = {}) {
  return {
    version: '1.2.0',
    exportedAt: new Date().toISOString(),
    data: {
      userProfile: {
        name: 'Apex Studio',
        avatarUrl: null,
        isGeneratedAvatar: true
      },
      currency: 'USD',
      colorThemeName: 'Ocean',
      categories: [
        { id: 'cat-8', name: 'Other', icon: 'Circle', color: '#909296' }
      ],
      expenses: [],
      budgets: [],
      notes: [],
      dateEvents: {},
      isSampleData: false,
      expenseRemindersEnabled: false,
      experimentalSettings: { isNotesEnabled: false },
      ...dataOverride
    }
  };
}

describe('Backup Import And Export', () => {

  // 1. Wifi Import Test
  it('should successfully import category with Wifi icon (case-insensitive)', () => {
    const payload = createBaseBackupPayload({
      categories: [
        { id: 'cat-8', name: 'Other', icon: 'Circle', color: '#909296' },
        { id: 'cat-wifi', name: 'Wi-Fi', icon: 'wifi', color: '#3B82F6' }
      ]
    });

    const jsonString = JSON.stringify(payload);
    const imported = parseAndValidateBackup(jsonString);

    assert.strictEqual(imported.version, '1.2.0');
    const wifiCat = imported.data.categories.find((c: any) => c.id === 'cat-wifi');
    assert.ok(wifiCat);
    assert.strictEqual(wifiCat.icon, 'Wifi'); // Should map to canonical capitalized 'Wifi'
  });

  // 2. Every Registered Icon Test
  it('should validate every registered icon successfully', () => {
    SUPPORTED_ICONS.forEach((iconName) => {
      const payload = createBaseBackupPayload({
        categories: [
          { id: 'cat-8', name: 'Other', icon: 'Circle', color: '#909296' },
          { id: `cat-${iconName}`, name: `Cat ${iconName}`, icon: iconName, color: '#3B82F6' }
        ]
      });

      const jsonString = JSON.stringify(payload);
      const imported = parseAndValidateBackup(jsonString);
      
      const testedCat = imported.data.categories.find((c: any) => c.id === `cat-${iconName}`);
      assert.ok(testedCat, `Category for icon ${iconName} should exist`);
      assert.strictEqual(testedCat.icon, iconName);
    });
  });

  // 3. Every Registered Colour Test
  it('should validate every registered color preset successfully', () => {
    colorPresets.forEach((preset) => {
      const payload = createBaseBackupPayload({
        categories: [
          { id: 'cat-8', name: 'Other', icon: 'Circle', color: '#909296' },
          { id: `cat-${preset.name}`, name: `Cat ${preset.name}`, icon: 'Circle', color: preset.value }
        ]
      });

      const jsonString = JSON.stringify(payload);
      const imported = parseAndValidateBackup(jsonString);
      
      const testedCat = imported.data.categories.find((c: any) => c.id === `cat-${preset.name}`);
      assert.ok(testedCat, `Category for color ${preset.name} should exist`);
      assert.strictEqual(testedCat.color.toLowerCase(), preset.value.toLowerCase());
    });
  });

  // 4. Current-version Export/Import Round Trip Test
  it('should run a complete export/import round trip successfully', async () => {
    // Mock storage records
    const mockStorage: Record<string, string> = {
      'flow-user-profile': JSON.stringify({ name: 'Apex Studio Test', avatarUrl: 'http://test', isGeneratedAvatar: false }),
      'flow-currency': JSON.stringify('EUR'),
      'flow-color-palette': JSON.stringify('Violet'),
      'flow-categories': JSON.stringify([
        { id: 'cat-8', name: 'Other', icon: 'Circle', color: '#909296' },
        { id: 'cat-1', name: 'Coffee', icon: 'Wifi', color: '#EF4444' }
      ]),
      'flow-expenses': JSON.stringify([
        { id: 'exp-1', amount: 5.5, description: 'Latte', category: 'Coffee', date: new Date().toISOString(), isOnline: false }
      ]),
      'flow-budgets': JSON.stringify([
        { category: 'Coffee', limit: 100, month: '2026-06', categoryName: 'Coffee', categoryIcon: 'Wifi', categoryColor: '#EF4444' }
      ]),
      'flow-notes': JSON.stringify([
        { id: 'note-1', amount: 10, description: 'Tip', category: 'Coffee', date: new Date().toISOString(), person: 'John' }
      ]),
      'flow-date-events': JSON.stringify({ '2026-06-21': 'Test Event' }),
      'flow-is-sample-data': JSON.stringify(false),
      'flow-expense-reminders-enabled': JSON.stringify(true),
      'flow-experimental-settings': JSON.stringify({ isNotesEnabled: true }),
      'flow-graph-style': JSON.stringify('donut'),
      'flow-graph-xaxis': JSON.stringify('category')
    };

    // Override storage methods in-memory for testing
    const originalGetItem = storage.getItem;
    const originalSetItem = storage.setItem;
    
    storage.getItem = async (key: string) => {
      // Strip 'flow.' prefix if storage adds it
      const cleanKey = key.startsWith('flow.') ? key : `flow.${key}`;
      const originalKey = cleanKey.slice(5); // removes 'flow.'
      return mockStorage[originalKey] || mockStorage[key] || null;
    };

    try {
      const exportedJson = await generateBackupJSON();
      const parsedExported = JSON.parse(exportedJson);

      assert.strictEqual(parsedExported.version, '1.2.0');
      assert.strictEqual(parsedExported.data.currency, 'EUR');
      assert.strictEqual(parsedExported.data.colorThemeName, 'Violet');
      
      const importedData = parseAndValidateBackup(exportedJson);
      assert.strictEqual(importedData.data.currency, 'EUR');
      assert.strictEqual(importedData.data.categories.length, 2);
      assert.strictEqual(importedData.data.expenses[0].description, 'Latte');
      assert.strictEqual(importedData.data.budgets[0].limit, 100);
      assert.strictEqual(importedData.data.notes[0].person, 'John');
      assert.strictEqual(importedData.data.dateEvents['2026-06-21'], 'Test Event');
      assert.strictEqual(importedData.data.expenseRemindersEnabled, true);
    } finally {
      storage.getItem = originalGetItem;
      storage.setItem = originalSetItem;
    }
  });

  // 5. Legacy Backup Migration Test
  it('should migrate legacy backup schemas successfully', () => {
    // Test v1.0.0 migration (maps category icons, defaults missing data fields)
    const legacyV100 = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        categories: [
          { id: 'cat-8', name: 'Other', icon: 'morehorizontal', color: '#adb5bd' },
          { id: 'cat-telephony', name: 'Phone', icon: 'telephony', color: '#748ffc' }
        ]
      }
    };

    const migrated = migrateBackup(legacyV100);
    assert.strictEqual(migrated.version, '1.2.0');
    assert.strictEqual(migrated.data.categories[0].icon, 'MoreHorizontal');
    assert.strictEqual(migrated.data.categories[1].icon, 'Phone');

    // Test v1.1.0 migration (maps pie graphStyle to donut)
    const legacyV110 = {
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      data: {
        categories: [
          { id: 'cat-8', name: 'Other', icon: 'Circle', color: '#909296' }
        ],
        graphStyle: 'pie'
      }
    };

    const migratedV110 = migrateBackup(legacyV110);
    assert.strictEqual(migratedV110.version, '1.2.0');
    assert.strictEqual(migratedV110.data.graphStyle, 'donut');
  });

  // 6. Unknown Icon Handling Test
  it('should fallback unknown/unsupported icons to Circle during normalization', () => {
    const payload = createBaseBackupPayload({
      categories: [
        { id: 'cat-8', name: 'Other', icon: 'Circle', color: '#909296' },
        { id: 'cat-unknown', name: 'Unknown Cat', icon: 'NotARealIconName', color: '#3B82F6' }
      ]
    });

    const jsonString = JSON.stringify(payload);
    const imported = parseAndValidateBackup(jsonString);

    const unknownCat = imported.data.categories.find((c: any) => c.id === 'cat-unknown');
    assert.ok(unknownCat);
    assert.strictEqual(unknownCat.icon, 'Circle'); // Normalization maps it to Circle
  });

  // 7. Malformed JSON Test
  it('should reject malformed JSON with an explicit error', () => {
    assert.throws(() => {
      parseAndValidateBackup('{ malformed json');
    }, /Invalid JSON format: file cannot be parsed/);
  });

  // 8. Unsupported Future Schema Test
  it('should reject future backup schema versions (> 1.2.0)', () => {
    const payload = createBaseBackupPayload();
    payload.version = '1.3.0'; // Future minor
    assert.throws(() => {
      parseAndValidateBackup(JSON.stringify(payload));
    }, /Unsupported future backup schema version/);

    payload.version = '2.0.0'; // Future major
    assert.throws(() => {
      parseAndValidateBackup(JSON.stringify(payload));
    }, /Unsupported future backup schema version/);
  });

  // 9. Strict preference and property rejection
  it('should reject unknown arbitrary currency or color theme values', () => {
    const invalidCurrencyPayload = createBaseBackupPayload({ currency: 'XYZ' });
    assert.throws(() => {
      validateBackupData(invalidCurrencyPayload);
    }, /Unsupported or invalid currency/);

    const invalidPalettePayload = createBaseBackupPayload({ colorThemeName: 'InvalidThemeName' });
    assert.throws(() => {
      validateBackupData(invalidPalettePayload);
    }, /Unsupported or invalid color theme/);
  });
});
