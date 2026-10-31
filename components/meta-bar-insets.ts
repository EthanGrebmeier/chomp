import { createContext } from 'react';

import { SHEET_CONTENT_INSET } from './sheet-content';

/** A sibling action owns the trailing edge; otherwise scroll to the sheet edge. */
export const MetaBarTrailingInsetContext =
  createContext<number>(SHEET_CONTENT_INSET);
