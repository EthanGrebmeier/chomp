import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

type NetworkStatus = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  isOffline: boolean;
};

/**
 * Hook to monitor network connectivity status.
 * Returns whether the device is connected and if the internet is reachable.
 */
export const useNetworkStatus = (): NetworkStatus => {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: null,
    isInternetReachable: null,
    isOffline: false,
  });

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isInternetReachable can be null during initial check
      // Consider offline if either we're not connected or internet is explicitly not reachable
      const isOffline =
        state.isConnected === false ||
        (state.isConnected === true && state.isInternetReachable === false);

      setStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        isOffline,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return status;
};

/**
 * Utility function to check network status once (non-reactive).
 * Useful for checking before making API calls.
 */
export const checkNetworkStatus = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
};
