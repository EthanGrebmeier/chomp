import { describe, expect, it } from 'vitest';

import { shouldPresentOnOpenRequest } from '../present-on-open-request';

describe('shouldPresentOnOpenRequest', () => {
  it('presents once for a new open request and ignores later selection changes', () => {
    expect(shouldPresentOnOpenRequest(undefined, undefined)).toBe(false);
    expect(shouldPresentOnOpenRequest(1, undefined)).toBe(true);
    expect(shouldPresentOnOpenRequest(1, 1)).toBe(false);
    expect(shouldPresentOnOpenRequest(2, 1)).toBe(true);
  });
});
