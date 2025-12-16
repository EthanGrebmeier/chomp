import { useEffect, useRef } from 'react';

import { seedLocalSavedItems } from './seed-local-items';

type UseSeedLocalItemsOptions = {
  /** Whether seeding is enabled. Set to true after migrations complete. */
  enabled?: boolean;
};

/**
 * Hook that seeds local saved items in the background.
 * Safe to call multiple times - seeding only happens once (tracked via app_settings flag).
 * Does not block rendering.
 */
export const useSeedLocalItems = ({
  enabled = true,
}: UseSeedLocalItemsOptions = {}) => {
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (!enabled || hasAttemptedRef.current) {
      return;
    }

    hasAttemptedRef.current = true;

    seedLocalSavedItems().catch(err => {
      console.error('Failed to seed local saved items:', err);
    });
  }, [enabled]);
};

