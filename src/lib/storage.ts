
/**
 * @fileoverview
 * This file defines a platform-agnostic storage interface.
 * By abstracting the storage mechanism, we can easily swap out `localStorage`
 * for a native storage solution (like file system access or a database)
 * when building for native platforms like Android. The rest of the application
 * interacts with this interface, not the underlying implementation.
 */

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import localForage from 'localforage';

const PREFIX = 'flow.';
const MIGRATION_FLAG = `${PREFIX}storage.migration.v1.completed`;
const NEW_MIGRATION_FLAG = `${PREFIX}storage.baselineMigration.completed`;
const AVATAR_MIGRATION_FLAG = `${PREFIX}storage.avatarMigration.completed`;

/**
 * Defines the contract for a storage adapter. Any storage mechanism
 * (web localStorage, native file system, etc.) must implement this interface.
 */
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

/**
 * An implementation of the StorageAdapter for the web using `window.localStorage`.
 * This serves as the default adapter for the web application.
 */
const localStorageAdapter: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
  async getAllKeys(): Promise<string[]> {
    if (typeof window === 'undefined') return [];
    return Object.keys(window.localStorage);
  }
};

const LIGHTWEIGHT_SETTINGS_KEYS = new Set([
  'flow-onboarded',
  'flow-color-palette',
  'flow-ui-theme',
  'flow-currency',
  'flow-experimental-settings',
  'flow-user-profile',
  'flow-graph-style',
  'flow-graph-xaxis',
  'flow-expense-reminders-enabled',
  'flow-last-expense-added-at'
]);

const GROWING_DATA_KEYS = new Set([
  'flow-expenses',
  'flow-categories',
  'flow-budgets',
  'flow-notes',
  'flow-date-events'
]);

const getPrefsKey = (key: string) => {
  if (key.startsWith(PREFIX)) return key;
  return `${PREFIX}${key}`;
};

const getOriginalKey = (key: string) => {
  if (key.startsWith(PREFIX)) return key.slice(PREFIX.length);
  return key;
};

const isSettingKey = (key: string): boolean => {
  const originalKey = getOriginalKey(key);
  return LIGHTWEIGHT_SETTINGS_KEYS.has(originalKey);
};

// Configure localForage instance for growing transaction tables
if (typeof window !== 'undefined') {
  localForage.config({
    name: 'Flow',
    storeName: 'flow_data',
    description: 'Durable local database for Flow transaction and expense records'
  });
}

let migrationPromise: Promise<void> | null = null;

export function resetMigrationForTesting() {
  migrationPromise = null;
}

function checkAndMigrate(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  if (!migrationPromise) {
    migrationPromise = (async () => {
      try {
        let isMigrationDone = false;

        const oldMigrationVal = Capacitor.isNativePlatform()
          ? (await Preferences.get({ key: MIGRATION_FLAG })).value
          : window.localStorage.getItem(MIGRATION_FLAG);

        const newMigrationVal = Capacitor.isNativePlatform()
          ? (await Preferences.get({ key: NEW_MIGRATION_FLAG })).value
          : window.localStorage.getItem(NEW_MIGRATION_FLAG);

        isMigrationDone = (oldMigrationVal === 'true' || newMigrationVal === 'true');

        // Migrate theme settings key (flow-theme-v2 -> flow-color-palette)
        const validThemes = ['Ocean', 'Violet', 'Orchid', 'Mint', 'Sky', 'Sunset', 'Forest', 'Ruby'];
        if (Capacitor.isNativePlatform()) {
          const oldTheme = await Preferences.get({ key: getPrefsKey('flow-theme-v2') });
          const newTheme = await Preferences.get({ key: getPrefsKey('flow-color-palette') });
          if (oldTheme.value && validThemes.includes(oldTheme.value) && !newTheme.value) {
            await Preferences.set({ key: getPrefsKey('flow-color-palette'), value: oldTheme.value });
          }
        } else {
          const oldTheme = window.localStorage.getItem('flow-theme-v2');
          const newTheme = window.localStorage.getItem('flow-color-palette');
          if (oldTheme && validThemes.includes(oldTheme) && !newTheme) {
            window.localStorage.setItem('flow-color-palette', oldTheme);
          }
        }

        // Hydration-level user profile avatar URL migration
        try {
          const avatarMigrationDone = Capacitor.isNativePlatform()
            ? (await Preferences.get({ key: AVATAR_MIGRATION_FLAG })).value === 'true'
            : window.localStorage.getItem(AVATAR_MIGRATION_FLAG) === 'true';

          if (!avatarMigrationDone) {
            let profileStr: string | null = null;
            if (Capacitor.isNativePlatform()) {
              profileStr = (await Preferences.get({ key: getPrefsKey('flow-user-profile') })).value;
            } else {
              profileStr = window.localStorage.getItem('flow-user-profile');
            }

            if (profileStr) {
              try {
                const profile = JSON.parse(profileStr);
                if (profile && typeof profile === 'object') {
                  let updated = false;
                  if (profile.avatarUrl && typeof profile.avatarUrl === 'string') {
                    if (profile.avatarUrl.includes('image/svg+xml')) {
                      profile.avatarUrl = null;
                      profile.isGeneratedAvatar = true;
                      updated = true;
                    } else if (profile.isGeneratedAvatar) {
                      profile.isGeneratedAvatar = false;
                      updated = true;
                    }
                  }

                  if (updated) {
                    const newStr = JSON.stringify(profile);
                    if (Capacitor.isNativePlatform()) {
                      await Preferences.set({ key: getPrefsKey('flow-user-profile'), value: newStr });
                    } else {
                      window.localStorage.setItem('flow-user-profile', newStr);
                    }
                  }
                }
              } catch (e) {
                console.error('Failed to migrate user profile avatar:', e);
              }
            }

            if (Capacitor.isNativePlatform()) {
              await Preferences.set({ key: AVATAR_MIGRATION_FLAG, value: 'true' });
            } else {
              window.localStorage.setItem(AVATAR_MIGRATION_FLAG, 'true');
            }
          }
        } catch (e) {
          console.error('Failed to execute checkAndMigrate user profile avatar migration:', e);
        }

        if (isMigrationDone) {
          // Ensure new migration flag is recorded
          if (Capacitor.isNativePlatform()) {
            await Preferences.set({ key: NEW_MIGRATION_FLAG, value: 'true' });
          } else {
            window.localStorage.setItem(NEW_MIGRATION_FLAG, 'true');
          }
          return;
        }

        // 1. Perform Migration for Native Android Platform
        if (Capacitor.isNativePlatform()) {
          // Migrate lightweight settings to Capacitor Preferences
          for (const key of LIGHTWEIGHT_SETTINGS_KEYS) {
            const prefsKey = getPrefsKey(key);
            const nativePref = await Preferences.get({ key: prefsKey });
            if (!nativePref.value) {
              const localVal = window.localStorage.getItem(key);
              if (localVal !== null) {
                await Preferences.set({ key: prefsKey, value: localVal });
              }
            }
          }

          // Migrate growing financial data to localForage (IndexedDB)
          for (const key of GROWING_DATA_KEYS) {
            const forageVal = await localForage.getItem<string>(key);
            if (forageVal === null) {
              const nativePref = await Preferences.get({ key: getPrefsKey(key) });
              let sourceVal: string | null = null;

              if (nativePref.value !== null) {
                sourceVal = nativePref.value;
              } else {
                sourceVal = window.localStorage.getItem(key);
              }

              if (sourceVal !== null) {
                await localForage.setItem(key, sourceVal);
              }
            }
          }

          // Mark migration complete in Preferences and localStorage
          await Preferences.set({ key: NEW_MIGRATION_FLAG, value: 'true' });
          window.localStorage.setItem(NEW_MIGRATION_FLAG, 'true');
        }
        // 2. Perform Migration for Web Platform
        else {
          // Migrate growing financial data from localStorage to localForage (IndexedDB) on Web
          for (const key of GROWING_DATA_KEYS) {
            const forageVal = await localForage.getItem<string>(key);
            if (forageVal === null) {
              const localVal = window.localStorage.getItem(key);
              if (localVal !== null) {
                await localForage.setItem(key, localVal);
              }
            }
          }

          window.localStorage.setItem(NEW_MIGRATION_FLAG, 'true');
        }
      } catch (e) {
        console.error('Storage migration to localForage and Preferences failed:', e);
      }
    })();
  }
  return migrationPromise;
}

let persistenceSuspended = false;
const activeWrites = new Set<Promise<any>>();

export function suspendPersistence() {
  persistenceSuspended = true;
}

export function resumePersistence() {
  persistenceSuspended = false;
}

export function isPersistenceSuspended() {
  return persistenceSuspended;
}

export async function withPersistenceSuspended<T>(fn: () => Promise<T>): Promise<T> {
  persistenceSuspended = true;
  try {
    await Promise.all(Array.from(activeWrites));
    return await fn();
  } finally {
    persistenceSuspended = false;
  }
}

export async function setItemIgnoringSuspension(key: string, value: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const promise = (async () => {
    await checkAndMigrate();
    if (isSettingKey(key)) {
      if (Capacitor.isNativePlatform()) {
        const prefsKey = getPrefsKey(key);
        try {
          await Preferences.set({ key: prefsKey, value });
        } catch (e) {
          console.error(`Error setting native preference for key ${key}:`, e);
        }
        return;
      }
      window.localStorage.setItem(key, value);
    } else {
      try {
        await localForage.setItem(key, value);
      } catch (e) {
        console.error(`Error setting localForage data for key ${key}:`, e);
      }
    }
  })();

  activeWrites.add(promise);
  try {
    await promise;
  } finally {
    activeWrites.delete(promise);
  }
}

/**
 * The single storage instance used throughout the application.
 * Natively, it routes lightweight settings keys to SharedPreferences (Capacitor Preferences)
 * and keeps growing transaction history keys inside localForage (IndexedDB).
 */
export const storage: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    await checkAndMigrate();

    if (isSettingKey(key)) {
      if (Capacitor.isNativePlatform()) {
        const prefsKey = getPrefsKey(key);
        try {
          const { value } = await Preferences.get({ key: prefsKey });
          return value;
        } catch (e) {
          console.error(`Error getting native preference for key ${key}:`, e);
          return null;
        }
      }
      return window.localStorage.getItem(key);
    } else {
      try {
        const value = await localForage.getItem<string>(key);
        return value;
      } catch (e) {
        console.error(`Error getting localForage data for key ${key}:`, e);
        return null;
      }
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (persistenceSuspended) return;
    if (typeof window === 'undefined') return;

    const promise = (async () => {
      await checkAndMigrate();
      if (isSettingKey(key)) {
        if (Capacitor.isNativePlatform()) {
          const prefsKey = getPrefsKey(key);
          try {
            await Preferences.set({ key: prefsKey, value });
          } catch (e) {
            console.error(`Error setting native preference for key ${key}:`, e);
          }
          return;
        }
        window.localStorage.setItem(key, value);
      } else {
        try {
          await localForage.setItem(key, value);
        } catch (e) {
          console.error(`Error setting localForage data for key ${key}:`, e);
        }
      }
    })();

    activeWrites.add(promise);
    try {
      await promise;
    } finally {
      activeWrites.delete(promise);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') return;

    const promise = (async () => {
      await checkAndMigrate();
      if (isSettingKey(key)) {
        if (Capacitor.isNativePlatform()) {
          const prefsKey = getPrefsKey(key);
          try {
            await Preferences.remove({ key: prefsKey });
          } catch (e) {
            console.error(`Error removing native preference for key ${key}:`, e);
          }
          return;
        }
        window.localStorage.removeItem(key);
      } else {
        try {
          await localForage.removeItem(key);
        } catch (e) {
          console.error(`Error removing localForage data for key ${key}:`, e);
        }
      }
    })();

    activeWrites.add(promise);
    try {
      await promise;
    } finally {
      activeWrites.delete(promise);
    }
  },

  async getAllKeys(): Promise<string[]> {
    if (typeof window === 'undefined') return [];
    await checkAndMigrate();

    try {
      const forageKeys = await localForage.keys();

      if (Capacitor.isNativePlatform()) {
        try {
          const { keys } = await Preferences.keys();
          const nativeKeys = keys
            .filter(k => k.startsWith(PREFIX))
            .map(k => k.slice(PREFIX.length))
            .filter(k => k !== 'migrated-settings-v2' && k !== 'storage.migration.v1.completed' && k !== 'storage.baselineMigration.completed');

          const combined = new Set([...nativeKeys, ...forageKeys]);
          return Array.from(combined);
        } catch (e) {
          console.error('Error getting all native keys:', e);
          return forageKeys;
        }
      }

      const localKeys = Object.keys(window.localStorage).filter(k => k !== MIGRATION_FLAG);
      const combined = new Set([...localKeys, ...forageKeys]);
      return Array.from(combined);
    } catch (e) {
      console.error('Error listing all keys:', e);
      return [];
    }
  }
};

/**
 * One-time migration to clean up removed feature keys from localForage/Preferences
 */
export async function cleanupRemovedFeatureKeys() {
  const keysToRemove = [
    'flow-is-sample-data',
    'flow-auto-backup-enabled',
    'flow-auto-backup-retention',
    'flow-last-auto-backup-at',
    'flow-last-auto-backup-status',
    'flow-last-auto-backup-file-name',
    'flow-last-auto-backup-error',
    'developerOptionsEnabled',
    'flow-developerOptionsEnabled',
    'developerOptions'
  ];
  for (const key of keysToRemove) {
    try {
      if (Capacitor.isNativePlatform()) {
        const prefsKey = key.startsWith('flow.') ? key : `flow.${key}`;
        await Preferences.remove({ key: prefsKey });
      }
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        if (!key.startsWith('flow.')) {
          window.localStorage.removeItem(`flow.${key}`);
        }
        await localForage.removeItem(key);
      }
    } catch (e) {
      console.warn(`Cleanup key ${key} failed:`, e);
    }
  }
}
