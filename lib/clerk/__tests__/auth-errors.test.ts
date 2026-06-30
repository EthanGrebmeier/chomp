import { describe, expect, it } from 'vitest';

import {
  getClerkErrorMessage,
  getSafeClerkErrorMessage,
  isClerkMissingSessionError,
} from '../auth-errors';

describe('Clerk auth error helpers', () => {
  it('detects stale missing-session Clerk errors and hides them from safe copy', () => {
    const error = {
      errors: [
        {
          code: 'resource_not_found',
          message: 'Session sess_123 does not exist',
          longMessage: 'Session sess_123 does not exist',
        },
      ],
    };

    expect(isClerkMissingSessionError(error)).toBe(true);
    expect(getClerkErrorMessage(error)).toBe(
      'Session sess_123 does not exist'
    );
    expect(getSafeClerkErrorMessage(error)).toBeNull();
  });

  it('keeps normal Clerk validation messages user-facing', () => {
    const error = {
      errors: [
        {
          code: 'form_code_incorrect',
          message: 'Code is incorrect',
          longMessage: 'The verification code is incorrect.',
        },
      ],
    };

    expect(isClerkMissingSessionError(error)).toBe(false);
    expect(getSafeClerkErrorMessage(error)).toBe(
      'The verification code is incorrect.'
    );
  });

  it('falls back to plain Error messages when they are not stale session errors', () => {
    const error = new Error('Network request failed');

    expect(isClerkMissingSessionError(error)).toBe(false);
    expect(getSafeClerkErrorMessage(error)).toBe('Network request failed');
  });
});
