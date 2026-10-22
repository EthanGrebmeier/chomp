import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { db } from '@/lib/instant';

const DEFAULT_SAVE_ITEM = false;
const STORAGE_KEY_PREFIX = 'add-item:save-item';

const parseSaveItem = (value: string | null): boolean | null => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
};

/**
 * Persists the "Save item" toggle used by the add item sheet so its value is
 * remembered between opens (and app restarts). The preference is scoped per
 * user so switching accounts does not leak the previous selection.
 */
export const useSaveItemPreference = () => {
  const { user } = db.useAuth();
  const userId = user?.id;
  const [saveItem, setSaveItem] = useState(DEFAULT_SAVE_ITEM);
  const hydrationVersionRef = useRef(0);

  useEffect(() => {
    let isCurrent = true;
    const hydrationVersion = ++hydrationVersionRef.current;
    setSaveItem(DEFAULT_SAVE_ITEM);

    if (!userId) {
      return () => {
        isCurrent = false;
      };
    }

    void AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}:${userId}`)
      .then(value => {
        const parsed = parseSaveItem(value);
        if (
          isCurrent &&
          hydrationVersionRef.current === hydrationVersion &&
          parsed !== null
        ) {
          setSaveItem(parsed);
        }
      })
      .catch(() => undefined);

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  const updateSaveItem = useCallback(
    (next: boolean) => {
      hydrationVersionRef.current += 1;
      setSaveItem(next);
      if (userId) {
        void AsyncStorage.setItem(
          `${STORAGE_KEY_PREFIX}:${userId}`,
          String(next)
        ).catch(() => undefined);
      }
    },
    [userId]
  );

  return { saveItem, setSaveItem: updateSaveItem };
};
