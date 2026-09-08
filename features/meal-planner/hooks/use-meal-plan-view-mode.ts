import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { MealPlanViewMode } from '../types';

const DEFAULT_VIEW_MODE: MealPlanViewMode = 'calendar';
const STORAGE_KEY_PREFIX = 'meal-plan:view-mode';

const isMealPlanViewMode = (value: string | null): value is MealPlanViewMode =>
  value === 'calendar' || value === 'day-list';

export const useMealPlanViewMode = (userId?: string) => {
  const [viewMode, setViewMode] = useState<MealPlanViewMode>(DEFAULT_VIEW_MODE);
  const selectionVersionRef = useRef(0);

  useEffect(() => {
    let isCurrent = true;
    const hydrationVersion = ++selectionVersionRef.current;
    setViewMode(DEFAULT_VIEW_MODE);

    if (!userId) {
      return () => {
        isCurrent = false;
      };
    }

    void AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}:${userId}`)
      .then(value => {
        if (
          isCurrent &&
          selectionVersionRef.current === hydrationVersion &&
          isMealPlanViewMode(value)
        ) {
          setViewMode(value);
        }
      })
      .catch(() => undefined);

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  const updateViewMode = useCallback(
    (nextViewMode: MealPlanViewMode) => {
      selectionVersionRef.current += 1;
      setViewMode(nextViewMode);
      if (userId) {
        void AsyncStorage.setItem(
          `${STORAGE_KEY_PREFIX}:${userId}`,
          nextViewMode
        ).catch(() => undefined);
      }
    },
    [userId]
  );

  return { viewMode, setViewMode: updateViewMode };
};
