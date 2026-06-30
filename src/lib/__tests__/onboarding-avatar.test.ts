import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getSafeAvatarInitial } from '../utils';
import { createFreshOnboardingState } from '../onboarding-factory';
import { withPersistenceSuspended, isPersistenceSuspended, storage, resetMigrationForTesting } from '../storage';
import { FLOW_OWNED_KEYS, STORAGE_KEYS } from '../../constants/storage-keys';
import localForage from 'localforage';

describe('Onboarding And Avatar', () => {

  // 1. Initials Generation
  describe('Initials Generation - getSafeAvatarInitial', () => {
    it('should derive "AS" for "Apex Studio"', () => {
      assert.strictEqual(getSafeAvatarInitial('Apex Studio'), 'AS');
    });

    it('should derive "SR" for "Subhodeep Rajak"', () => {
      assert.strictEqual(getSafeAvatarInitial('Subhodeep Rajak'), 'SR');
    });

    it('should derive "A" for a single word "Alex"', () => {
      assert.strictEqual(getSafeAvatarInitial('Alex'), 'A');
    });

    it('should derive "" for empty name or spaces', () => {
      assert.strictEqual(getSafeAvatarInitial(''), '');
      assert.strictEqual(getSafeAvatarInitial('   '), '');
    });

    it('should normalize multiple spaces and ignore outer whitespace', () => {
      assert.strictEqual(getSafeAvatarInitial('  John    Doe  '), 'JD');
    });

    it('should handle leading/trailing emoji', () => {
      assert.strictEqual(getSafeAvatarInitial('😆 Studio'), 'S');
      assert.strictEqual(getSafeAvatarInitial('Studio 😀'), 'S');
    });

    it('should handle emoji-only words', () => {
      assert.strictEqual(getSafeAvatarInitial('😀 Apex Studio 😆'), 'AS');
    });

    it('should handle emoji between valid words', () => {
      assert.strictEqual(getSafeAvatarInitial('Apex 😀 Studio'), 'AS');
    });

    it('should handle mixed emoji and letters in one segment', () => {
      assert.strictEqual(getSafeAvatarInitial('😆Studio'), 'S');
      assert.strictEqual(getSafeAvatarInitial('Studio😀'), 'S');
    });

    it('should handle punctuation and word boundaries', () => {
      assert.strictEqual(getSafeAvatarInitial('Apex-Studio'), 'AS');
      assert.strictEqual(getSafeAvatarInitial('John, Doe.'), 'JD');
    });

    it('should handle accented Latin names', () => {
      assert.strictEqual(getSafeAvatarInitial('Élodie Durand'), 'ÉD');
    });

    it('should handle non-Latin scripts', () => {
      assert.strictEqual(getSafeAvatarInitial('李 小龙'), '李小');
    });

    it('should handle numbers in segment', () => {
      assert.strictEqual(getSafeAvatarInitial('Studio 2'), 'S2');
    });

    it('should handle emoji-only, symbols, and punctuation fallbacks to ""', () => {
      assert.strictEqual(getSafeAvatarInitial('😀'), '');
      assert.strictEqual(getSafeAvatarInitial('😆 😀'), '');
      assert.strictEqual(getSafeAvatarInitial('@'), '');
      assert.strictEqual(getSafeAvatarInitial('...'), '');
    });
  });

  // 2. Fresh Onboarding State Factory
  describe('Fresh Onboarding State Factory', () => {
    it('should initialize with correct defaults', () => {
      const state = createFreshOnboardingState();
      assert.strictEqual(state.currentStep, 'welcome');
      assert.strictEqual(state.userProfile.name, 'Apex Studio');
      assert.strictEqual(state.userProfile.avatarUrl, null);
      assert.strictEqual(state.userProfile.isGeneratedAvatar, true);
      assert.strictEqual(state.currency, 'USD');
      assert.strictEqual(state.colorThemeName, 'Ocean');
      assert.strictEqual(state.graphStyle, 'bar');
      assert.strictEqual(state.graphXAxis, 'category');
      assert.strictEqual(state.onboarded, false);
      assert.ok(state.categories.length > 0);
      assert.strictEqual(state.categories[0].name, 'Other');
    });
  });

  // 3. Reset and Logout Deletion
  describe('Reset and Logout Mechanics', () => {
    it('should suspend persistence during scoped block and resume afterwards', async () => {
      let executed = false;
      assert.strictEqual(isPersistenceSuspended(), false);

      await withPersistenceSuspended(async () => {
        assert.strictEqual(isPersistenceSuspended(), true);
        executed = true;
      });

      assert.strictEqual(isPersistenceSuspended(), false);
      assert.ok(executed);
    });

    it('should resume persistence even if the scoped block throws an error', async () => {
      assert.strictEqual(isPersistenceSuspended(), false);

      await assert.rejects(async () => {
        await withPersistenceSuspended(async () => {
          assert.strictEqual(isPersistenceSuspended(), true);
          throw new Error('Test clearing error');
        });
      }, /Test clearing error/);

      assert.strictEqual(isPersistenceSuspended(), false);
    });

    it('should clear only Flow-owned keys', async () => {
      // Load a fresh storage to isolate from dirty global state
      const { storage: freshStorage } = await import(`../storage.ts?cb=reset_${Date.now()}`);

      const mockStorage: Record<string, string> = {
        'flow-expenses': '[]',
        'flow-categories': '[]',
        'flow-user-profile': '{"name":"User"}',
        'unrelated-capacitor-plugin-key': 'keep-me'
      };

      const originalRemoveItem = freshStorage.removeItem;
      const originalSetItem = freshStorage.setItem;

      const removedKeys: string[] = [];

      freshStorage.removeItem = async (key: string) => {
        removedKeys.push(key);
        delete mockStorage[key];
      };

      freshStorage.setItem = async (key: string, value: string) => {
        mockStorage[key] = value;
      };

      try {
        await withPersistenceSuspended(async () => {
          await Promise.all(FLOW_OWNED_KEYS.map(k => {
            if (k !== 'flow-replace-in-progress') {
              return freshStorage.removeItem(k);
            }
            return Promise.resolve();
          }));
        });

        // Verify only Flow-owned keys were removed, unrelated keys survive
        assert.strictEqual(mockStorage['unrelated-capacitor-plugin-key'], 'keep-me');
        assert.ok(removedKeys.includes('flow-expenses'));
        assert.ok(removedKeys.includes('flow-user-profile'));
        assert.ok(!removedKeys.includes('unrelated-capacitor-plugin-key'));
      } finally {
        freshStorage.removeItem = originalRemoveItem;
        freshStorage.setItem = originalSetItem;
      }
    });
  });

  // 4. In-flight Writes Blocking
  describe('In-flight Writes Blocking', () => {
    it('should await active write promises before executing the suspended callback', async () => {
      const { storage: freshStorage, withPersistenceSuspended: freshWithPersistenceSuspended } = await import(`../storage.ts?cb=inflight_${Date.now()}`);

      // 1. Mock window and localStorage
      const mockLocalStorage: Record<string, string> = {
        'flow.storage.baselineMigration.completed': 'true',
        'flow.storage.avatarMigration.completed': 'true',
      };
      (global as any).window = {
        localStorage: {
          getItem: (key: string) => mockLocalStorage[key] || null,
          setItem: (key: string, value: string) => { mockLocalStorage[key] = value; },
          removeItem: (key: string) => { delete mockLocalStorage[key]; },
        }
      };

      // 2. Mock localForage.setItem to be slow
      const originalLocalForageSetItem = localForage.setItem;
      let writeCompleted = false;

      localForage.setItem = async (key: string, value: any) => {
        return new Promise<any>((resolve) => {
          setTimeout(() => {
            writeCompleted = true;
            resolve(value);
          }, 30);
        });
      };

      try {
        // Trigger a write without await so it runs in background
        const writePromise = freshStorage.setItem('flow-expenses', '[]');

        await freshWithPersistenceSuspended(async () => {
          // Inside the suspended block, the active writes must be fully resolved
          assert.strictEqual(writeCompleted, true);
        });

        await writePromise;
      } finally {
        // Restore localForage and clean window
        localForage.setItem = originalLocalForageSetItem;
        delete (global as any).window;
      }
    });
  });

  // 5. Avatar Migration
  describe('Avatar Migration', () => {
    it('should migrate legacy SVG avatars to null and keep custom photos', async () => {
      resetMigrationForTesting();

      const mockLocalStorage: Record<string, string> = {
        'flow.storage.baselineMigration.completed': 'true',
        'flow.storage.avatarMigration.completed': 'false', // trigger avatar migration
        'flow-user-profile': JSON.stringify({
          name: 'Test SVG User',
          avatarUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmci...',
          isGeneratedAvatar: true
        })
      };

      (global as any).window = {
        localStorage: {
          getItem: (key: string) => mockLocalStorage[key] || null,
          setItem: (key: string, value: string) => { mockLocalStorage[key] = value; },
          removeItem: (key: string) => { delete mockLocalStorage[key]; },
        }
      };

      try {
        // Trigger checkAndMigrate by calling getItem
        await storage.getItem('flow-user-profile');

        const migratedProfile = JSON.parse(mockLocalStorage['flow-user-profile']);
        assert.strictEqual(migratedProfile.avatarUrl, null);
        assert.strictEqual(migratedProfile.isGeneratedAvatar, true);
        assert.strictEqual(mockLocalStorage['flow.storage.avatarMigration.completed'], 'true');
      } finally {
        delete (global as any).window;
      }
    });

    it('should preserve custom photos during migration', async () => {
      resetMigrationForTesting();

      const mockLocalStorage: Record<string, string> = {
        'flow.storage.baselineMigration.completed': 'true',
        'flow.storage.avatarMigration.completed': 'false', // trigger avatar migration
        'flow-user-profile': JSON.stringify({
          name: 'Test Custom Photo User',
          avatarUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...',
          isGeneratedAvatar: true // wrong flag stored
        })
      };

      (global as any).window = {
        localStorage: {
          getItem: (key: string) => mockLocalStorage[key] || null,
          setItem: (key: string, value: string) => { mockLocalStorage[key] = value; },
          removeItem: (key: string) => { delete mockLocalStorage[key]; },
        }
      };

      try {
        // Trigger checkAndMigrate by calling getItem
        await storage.getItem('flow-user-profile');

        const migratedProfile = JSON.parse(mockLocalStorage['flow-user-profile']);
        assert.strictEqual(migratedProfile.avatarUrl, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...');
        assert.strictEqual(migratedProfile.isGeneratedAvatar, false); // should be corrected
        assert.strictEqual(mockLocalStorage['flow.storage.avatarMigration.completed'], 'true');
      } finally {
        delete (global as any).window;
      }
    });
  });

  // 6. FlowAvatar Props and Accessibility Logic
  describe('FlowAvatar Props and Accessibility Logic', () => {
    it('should derive correct accessible labels', () => {
      const getLabel = (name: string) => name ? `Profile avatar for ${name}` : "Profile avatar";
      assert.strictEqual(getLabel('Apex Studio'), 'Profile avatar for Apex Studio');
      assert.strictEqual(getLabel('@'), 'Profile avatar for @');
      assert.strictEqual(getLabel(''), 'Profile avatar');
    });

    it('should determine whether fallback UserRound should be shown', () => {
      const shouldShowUserRound = (name: string, isGeneratedAvatar: boolean, avatarUrl: string | null) => {
        const showImage = !isGeneratedAvatar && !!avatarUrl;
        if (showImage) return false;
        const initials = getSafeAvatarInitial(name);
        return !initials;
      };

      // Custom photo overrides everything
      assert.strictEqual(shouldShowUserRound('Apex Studio', false, 'data:image/png;...'), false);
      assert.strictEqual(shouldShowUserRound('@', false, 'data:image/png;...'), false);

      // Valid initials does not show UserRound
      assert.strictEqual(shouldShowUserRound('Apex Studio', true, null), false);
      assert.strictEqual(shouldShowUserRound('Alex', true, null), false);

      // Empty, symbol, emoji, punctuation-only names show UserRound
      assert.strictEqual(shouldShowUserRound('@', true, null), true);
      assert.strictEqual(shouldShowUserRound('😀', true, null), true);
      assert.strictEqual(shouldShowUserRound('...', true, null), true);
      assert.strictEqual(shouldShowUserRound('', true, null), true);
    });
  });
});
