import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ONBOARDING_STEPS } from '../../components/providers/app-provider';
import { getSafeAvatarInitial } from '../utils';
import { createFreshOnboardingState } from '../onboarding-factory';

describe('Welcome Flow', () => {

  // 1. Step Order & Length
  describe('Onboarding Steps Sequence', () => {
    it('should have exactly 3 steps in the specified sequence', () => {
      assert.strictEqual(ONBOARDING_STEPS.length, 3);
      assert.strictEqual(ONBOARDING_STEPS[0], 'welcome');
      assert.strictEqual(ONBOARDING_STEPS[1], 'profile');
      assert.strictEqual(ONBOARDING_STEPS[2], 'preferences-data');
    });

    it('should not contain any obsolete step IDs', () => {
      const obsoleteSteps = ['overview', 'currency', 'appearance', 'notification', 'complete', 'about', 'setup-intro'];
      obsoleteSteps.forEach(step => {
        assert.ok(!ONBOARDING_STEPS.includes(step as any), `Obsolete step "${step}" should not be in sequence`);
      });
    });
  });

  // 2. Navigation State Step Mechanics
  describe('Step Navigation Transitions', () => {
    it('should simulate step transitions forward correctly', () => {
      let current: typeof ONBOARDING_STEPS[number] = 'welcome';
      
      const nextStep = () => {
        const idx = ONBOARDING_STEPS.indexOf(current);
        if (idx !== -1 && idx < ONBOARDING_STEPS.length - 1) {
          current = ONBOARDING_STEPS[idx + 1];
        }
      };

      nextStep();
      assert.strictEqual(current, 'profile');
      
      nextStep();
      assert.strictEqual(current, 'preferences-data');

      // Ensure boundary lock at last step
      nextStep();
      assert.strictEqual(current, 'preferences-data');
    });

    it('should simulate step transitions backward correctly', () => {
      let current: typeof ONBOARDING_STEPS[number] = 'preferences-data';
      
      const prevStep = () => {
        const idx = ONBOARDING_STEPS.indexOf(current);
        if (idx > 0) {
          current = ONBOARDING_STEPS[idx - 1];
        }
      };

      prevStep();
      assert.strictEqual(current, 'profile');
      
      prevStep();
      assert.strictEqual(current, 'welcome');

      // Ensure boundary lock at first step
      prevStep();
      assert.strictEqual(current, 'welcome');
    });
  });

  // 3. User Profile Controlled Defaults
  describe('Profile Controlled State Defaults', () => {
    it('should initialize profile name to "Apex Studio" and derive initials "AS"', () => {
      const freshState = createFreshOnboardingState();
      assert.strictEqual(freshState.userProfile.name, 'Apex Studio');
      assert.strictEqual(getSafeAvatarInitial(freshState.userProfile.name), 'AS');
    });

    it('should update initials dynamically on name change', () => {
      assert.strictEqual(getSafeAvatarInitial('John Doe'), 'JD');
      assert.strictEqual(getSafeAvatarInitial('Flow Beta App'), 'FA');
      assert.strictEqual(getSafeAvatarInitial('Subhodeep'), 'S');
    });
  });

  // 4. Transactional Completion Input Validation
  describe('Transactional Completion Validation', () => {
    it('should fail validation if display name is empty or spaces only', () => {
      const validateProfile = (name: string) => {
        const trimmed = name.trim();
        return trimmed.length > 0 && trimmed.length <= 100;
      };

      assert.strictEqual(validateProfile(''), false);
      assert.strictEqual(validateProfile('    '), false);
      assert.strictEqual(validateProfile('Apex Studio'), true);
    });
  });
});
