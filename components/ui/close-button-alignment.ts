import { createContext } from 'react';

/** Sheet headers account for the glyph inset; standalone screens do not. */
export const CloseButtonAlignmentContext = createContext<'center' | 'leading'>(
  'leading'
);
