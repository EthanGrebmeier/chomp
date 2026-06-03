import { afterEach, describe, expect, it } from 'vitest';

import { buildListURL } from '../navigation';

const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;

describe('buildListURL', () => {
  afterEach(() => {
    process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
  });

  it('uses the public app URL when the API URL is not configured', () => {
    delete process.env.EXPO_PUBLIC_API_URL;

    expect(buildListURL('ABC123')).toBe(
      'https://chompgrocery.com/join-list/ABC123'
    );
  });

  it('uses the configured API URL without duplicating slashes', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com/';

    expect(buildListURL('ABC123')).toBe(
      'https://api.example.com/join-list/ABC123'
    );
  });
});
