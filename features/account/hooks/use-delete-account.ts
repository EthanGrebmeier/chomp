import { useAuth } from '@clerk/expo';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { markManualSignOutIntent } from '../../../lib/clerk/signout-intent';
import { db } from '../../../lib/instant';
import { AccountDeleteError, deleteAccount } from '../api';

export const useDeleteAccount = () => {
  const { getToken, signOut } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, AccountDeleteError, void>({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new AccountDeleteError('unauthorized', 'Not authenticated');
      }

      await deleteAccount(token);

      // The backend has deleted both the Instant user (cascading all data) and
      // the Clerk user. Tear down local sessions and close the settings/account
      // modal stack; InstantAuthHandler routes back to the welcome screen once
      // the session is gone. Suppress the "session expired" toast since this is
      // intentional.
      markManualSignOutIntent();
      queryClient.clear();
      await Promise.allSettled([signOut(), db.auth.signOut()]);
      router.dismissAll();
    },
  });
};
