import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateLogoutName } from '../utils';

describe('Logout Confirmation', () => {

  const targetName = 'Apex Studio';

  // 1. Exact Match
  describe('Exact Match Validation', () => {
    it('should pass on exact matching string', () => {
      assert.strictEqual(validateLogoutName('Apex Studio', targetName), true);
    });
  });

  // 2. Casing Mismatch
  describe('Casing Mismatch Validation', () => {
    it('should fail on lowercased match', () => {
      assert.strictEqual(validateLogoutName('apex studio', targetName), false);
    });

    it('should fail on uppercased match', () => {
      assert.strictEqual(validateLogoutName('APEX STUDIO', targetName), false);
    });

    it('should fail on mixed-case mismatch', () => {
      assert.strictEqual(validateLogoutName('Apex studio', targetName), false);
    });
  });

  // 3. Leading/Trailing Whitespace
  describe('Whitespace Padding Validation', () => {
    it('should fail on leading whitespace', () => {
      assert.strictEqual(validateLogoutName(' Apex Studio', targetName), false);
    });

    it('should fail on trailing whitespace', () => {
      assert.strictEqual(validateLogoutName('Apex Studio ', targetName), false);
    });
  });

  // 4. Repeated Internal Whitespace
  describe('Internal Whitespace Validation', () => {
    it('should fail on repeated internal whitespace', () => {
      assert.strictEqual(validateLogoutName('Apex  Studio', targetName), false);
    });
  });

  // 5. Empty and Partial Input
  describe('Empty and Partial Input Validation', () => {
    it('should fail on empty input', () => {
      assert.strictEqual(validateLogoutName('', targetName), false);
    });

    it('should fail on partial name', () => {
      assert.strictEqual(validateLogoutName('Apex', targetName), false);
    });
  });

  // 6. Non-ASCII Names
  describe('Non-ASCII Character Exact Validation', () => {
    const nonAsciiName = 'Åpex Stüdiø';

    it('should pass on exact non-ASCII match', () => {
      assert.strictEqual(validateLogoutName('Åpex Stüdiø', nonAsciiName), true);
    });

    it('should fail on casing mismatch with non-ASCII', () => {
      assert.strictEqual(validateLogoutName('åpex stüdiø', nonAsciiName), false);
    });
  });

  // 7. Dynamic Profile Name Update
  describe('Profile Name Update Simulation', () => {
    it('should validate against the latest name reference', () => {
      let currentProfile = { name: 'Apex Studio' };
      
      // Before update
      assert.strictEqual(validateLogoutName('Apex Studio', currentProfile.name), true);
      assert.strictEqual(validateLogoutName('Updated Studio', currentProfile.name), false);

      // Perform profile update
      currentProfile.name = 'Updated Studio';

      // After update
      assert.strictEqual(validateLogoutName('Updated Studio', currentProfile.name), true);
      assert.strictEqual(validateLogoutName('Apex Studio', currentProfile.name), false);
    });
  });

  // 8. Rapid Repeated Verification Simulation
  describe('Throttling Repeated Verify Taps', () => {
    it('should block execution while verify lock is active', async () => {
      let isVerifying = false;
      let submissionCount = 0;

      const triggerVerification = () => {
        if (isVerifying) return;
        isVerifying = true;
        submissionCount++;

        // Simulate lock release on fail (like the 500ms timeout)
        setTimeout(() => {
          isVerifying = false;
        }, 50);
      };

      // First call (acquires lock, increments count)
      triggerVerification();
      
      // Second call instantly (locked, should be ignored)
      triggerVerification();

      assert.strictEqual(submissionCount, 1);
      assert.strictEqual(isVerifying, true);

      // Wait for lock to release
      await new Promise(resolve => setTimeout(resolve, 60));

      // Third call (lock is released, should succeed)
      triggerVerification();
      assert.strictEqual(submissionCount, 2);
    });
  });

  // 9. Keyboard Enter Submission Event handling
  describe('Keyboard Enter Submission', () => {
    it('should submit verification on Enter and preventDefault', () => {
      let submitted = false;
      let defaultPrevented = false;

      const onKeyDownHandler = (e: { key: string; preventDefault: () => void }) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitted = true;
        }
      };

      onKeyDownHandler({
        key: 'Enter',
        preventDefault: () => { defaultPrevented = true; }
      });

      assert.strictEqual(submitted, true);
      assert.strictEqual(defaultPrevented, true);
    });

    it('should ignore other keyboard triggers', () => {
      let submitted = false;
      let defaultPrevented = false;

      const onKeyDownHandler = (e: { key: string; preventDefault: () => void }) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitted = true;
        }
      };

      onKeyDownHandler({
        key: 'Escape',
        preventDefault: () => { defaultPrevented = true; }
      });

      assert.strictEqual(submitted, false);
      assert.strictEqual(defaultPrevented, false);
    });
  });
});
