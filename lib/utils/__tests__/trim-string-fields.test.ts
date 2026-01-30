import { describe, expect, it } from 'vitest';

import { trimStringFields } from '../trim-string-fields';

describe('trimStringFields', () => {
  it('trims nested strings in objects and arrays', () => {
    const input = {
      title: '  Grocery  ',
      tags: ['  fresh ', 'bulk'],
      meta: { note: '  remember ' },
    };

    expect(trimStringFields(input)).toEqual({
      title: 'Grocery',
      tags: ['fresh', 'bulk'],
      meta: { note: 'remember' },
    });
  });
});
