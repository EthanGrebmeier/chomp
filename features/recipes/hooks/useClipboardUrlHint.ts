import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { validateRecipeUrl } from '../utils/validate-recipe-url';

/**
 * Tells the import screen whether it's worth offering a "Paste link" shortcut.
 *
 * Deliberately never *reads* the clipboard until the user taps: iOS 16+ and
 * Android 12+ both show a system "pasted from X" banner on read, which feels
 * creepy if it fires the moment a screen opens. `hasUrlAsync` / `hasStringAsync`
 * only inspect content types, so they're banner-free.
 *
 * iOS can tell us it's a URL; Android can only tell us there's text, so the
 * chip copy is kept generic and we validate on tap.
 */
export const useClipboardUrlHint = (enabled: boolean) => {
  const [mayHaveUrl, setMayHaveUrl] = useState(false);

  const check = useCallback(async () => {
    if (!enabled) {
      setMayHaveUrl(false);
      return;
    }
    try {
      const result =
        Platform.OS === 'ios'
          ? await Clipboard.hasUrlAsync()
          : await Clipboard.hasStringAsync();
      setMayHaveUrl(result);
    } catch {
      setMayHaveUrl(false);
    }
  }, [enabled]);

  useFocusEffect(
    useCallback(() => {
      void check();
    }, [check])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') void check();
    });
    return () => subscription.remove();
  }, [check]);

  /**
   * Reads the clipboard and returns a validated http(s) URL, or null.
   * Hides the hint afterwards either way so a bad paste doesn't linger.
   */
  const readUrl = useCallback(async (): Promise<string | null> => {
    setMayHaveUrl(false);
    try {
      const text = await Clipboard.getStringAsync();
      const validation = validateRecipeUrl(text);
      return validation.valid ? validation.url : null;
    } catch {
      return null;
    }
  }, []);

  return { mayHaveUrl, readUrl };
};
