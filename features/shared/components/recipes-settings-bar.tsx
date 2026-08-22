import { Href, router, useFocusEffect, useSegments } from 'expo-router';
import { BookOpenIcon, SettingsIcon } from 'lucide-react-native';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { navigation } from '@/lib/navigation';

const NAVIGATION_LOCK_DURATION_MS = 500;

type RecipesSettingsBarState = {
  listId?: string;
  visible: boolean;
};

type RecipesSettingsBarController = {
  setBar: (owner: symbol, state: RecipesSettingsBarState | null) => void;
};

const RecipesSettingsBarContext =
  createContext<RecipesSettingsBarController | null>(null);

type MutableValue<T> = {
  current: T;
};

function releaseRoutePushLock(
  lock: MutableValue<boolean>,
  timeout: MutableValue<ReturnType<typeof setTimeout> | null>
) {
  lock.current = false;
  if (timeout.current) {
    clearTimeout(timeout.current);
    timeout.current = null;
  }
}

export function RecipesSettingsBarHost({ children }: { children: ReactNode }) {
  const segments = useSegments();
  const isOnTabs = segments[0] === '(tabs)';
  const [state, setState] = useState<
    RecipesSettingsBarState & { owner: symbol | null }
  >({
    owner: null,
    visible: false,
  });

  const setBar = useCallback(
    (owner: symbol, next: RecipesSettingsBarState | null) => {
      setState(current => {
        if (next === null) {
          return current.owner === owner
            ? { owner: null, visible: false }
            : current;
        }

        if (
          current.owner === owner &&
          current.visible === next.visible &&
          current.listId === next.listId
        ) {
          return current;
        }

        return { ...next, owner };
      });
    },
    []
  );

  const controller = useMemo(() => ({ setBar }), [setBar]);

  return (
    <RecipesSettingsBarContext.Provider value={controller}>
      {children}
      <RecipesSettingsBar
        listId={state.listId}
        visible={state.visible && isOnTabs}
      />
    </RecipesSettingsBarContext.Provider>
  );
}

export function useRecipesSettingsBar({
  listId,
  visible = true,
}: {
  listId?: string;
  visible?: boolean;
}) {
  const controller = useContext(RecipesSettingsBarContext);
  const [owner] = useState(() => Symbol('recipes-settings-bar-owner'));

  useFocusEffect(
    useCallback(() => {
      controller?.setBar(owner, { listId, visible });

      return () => {
        controller?.setBar(owner, null);
      };
    }, [controller, listId, owner, visible])
  );
}

function RecipesSettingsBar({
  listId,
  visible,
}: {
  listId?: string;
  visible: boolean;
}) {
  const routePushLockRef = useRef(false);
  const routePushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const reduceMotion = useReducedMotion();
  const visibleProgress = useSharedValue(visible ? 1 : 0);

  const pushWithRouteLock = (href: Href) => {
    if (routePushLockRef.current) return;

    routePushLockRef.current = true;

    if (routePushTimeoutRef.current) {
      clearTimeout(routePushTimeoutRef.current);
    }

    routePushTimeoutRef.current = setTimeout(() => {
      releaseRoutePushLock(routePushLockRef, routePushTimeoutRef);
    }, NAVIGATION_LOCK_DURATION_MS);

    router.push(href);
  };

  useEffect(() => {
    if (!visible) {
      releaseRoutePushLock(routePushLockRef, routePushTimeoutRef);
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      releaseRoutePushLock(routePushLockRef, routePushTimeoutRef);
    };
  }, []);

  useEffect(() => {
    const target = visible ? 1 : 0;
    visibleProgress.set(
      reduceMotion ? target : withTiming(target, { duration: 200 })
    );
  }, [reduceMotion, visible, visibleProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: visibleProgress.get(),
  }));

  return (
    <Animated.View
      className="bottom-safe absolute left-6 z-20"
      style={animatedStyle}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View className="h-10 flex-row items-center gap-6 overflow-hidden rounded-full border border-border bg-accent/90 px-4 shadow-sm">
        <HapticPressable
          onPress={() => pushWithRouteLock(navigation.goToRecipes(listId))}
          accessibilityRole="button"
          accessibilityLabel="Open recipes"
          className="gap-2 active:opacity-80"
          hapticType="selection"
          hitSlop={10}
        >
          <Icon
            as={BookOpenIcon}
            size={24}
            strokeWidth={2}
            className="mt-0.5 text-accent-foreground"
          />
        </HapticPressable>
        <HapticPressable
          onPress={() => pushWithRouteLock('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          className="gap-2 active:opacity-80"
          hapticType="selection"
          hitSlop={10}
        >
          <Icon
            as={SettingsIcon}
            size={24}
            strokeWidth={2}
            className="mt-0.5 text-accent-foreground"
          />
        </HapticPressable>
      </View>
    </Animated.View>
  );
}
