import { createContext, useContext } from 'react';

/** Default exit for this native sheet. Explicit header actions take precedence. */
export const SheetExitContext = createContext<(() => void) | undefined>(
  undefined
);
export const useSheetExit = () => useContext(SheetExitContext);
