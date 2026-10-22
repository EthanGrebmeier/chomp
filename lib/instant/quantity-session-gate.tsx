import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Button, Text, View } from 'react-native';

import { restoreLegacySession } from './restore-legacy-session';

import { db } from './index';

export function QuantitySessionGate({ children }: { children: ReactNode }) {
  // Restore old production sessions only into the promoted production app.
  const enabled =
    process.env.EXPO_PUBLIC_INSTANT_APP_ID ===
    '5df33e29-252b-4e1c-a111-53787beccba3';
  const [state, setState] = useState<'loading' | 'ready' | 'error'>(
    enabled ? 'loading' : 'ready'
  );
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let timeout: ReturnType<typeof setTimeout>;
    void Promise.race([
      restoreLegacySession({
        getItem: key => AsyncStorage.getItem(key),
        setItem: (key, value) => AsyncStorage.setItem(key, value),
        getAuth: () => db.getAuth(),
        signInWithToken: token => db.auth.signInWithToken(token),
        signOut: () => db.auth.signOut(),
      }),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error('Session restore timed out')),
          15000
        );
      }),
    ])
      .then(() => {
        if (active) setState('ready');
      })
      .catch(() => {
        if (active) {
          setState('error');
          void SplashScreen.hideAsync();
        }
      });
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [enabled, attempt]);
  if (state === 'ready') return children;
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        padding: 24,
        backgroundColor: '#ECEDDB',
      }}
    >
      {state === 'error' ? (
        <>
          <Text
            accessibilityRole="header"
            style={{ fontSize: 20, textAlign: 'center', color: '#1c241d' }}
          >
            Couldn’t restore your lists
          </Text>
          <Button
            title="Try again"
            onPress={() => {
              setState('loading');
              setAttempt(value => value + 1);
            }}
          />
        </>
      ) : (
        <ActivityIndicator />
      )}
    </View>
  );
}
