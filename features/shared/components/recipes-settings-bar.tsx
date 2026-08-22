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

const NAVIGATION_LOCK_DURATION_MS = 1500;

type RecipesSettingsBarState = {
  listId?: string;
  visible: boolean;
};

type RecipesSettingsBarController = {
  setBar: (state: RecipesSettingsBarState) => void;
};

const RecipesSettingsBarContext =
  createContext<RecipesSettingsBarController | null>(null);

export function RecipesSettingsBarHost({ children }: { children: ReactNode }) {
  const segments = useSegments();
  const isOnTabs = segments[0] === '(tabs)';
  const [state, setState] = useState<RecipesSettingsBarState>({
    visible: true,
  });

  const setBar = useCallback((next: RecipesSettingsBarState) => {
    setState(current => {
      if (current.visible === next.visible && current.listId === next.listId) {
        return current;
      }

      return next;
    });
  }, []);

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

  useFocusEffect(
    useCallback(() => {
      controller?.setBar({ listId, visible });
    }, [controller, listId, visible])
  );
}

function RecipesSettingsBar({
  listId,
  visible,
}: {
  listId?: string;
  visible: boolean;
}) {
  const [isRoutePushPending, setIsRoutePushPending] = useState(false);
  const routePushLockRef = useRef(false);
  const routePushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const reduceMotion = useReducedMotion();
  const visibleProgress = useSharedValue(visible ? 1 : 0);

  const releaseRoutePushLock = () => {
    routePushLockRef.current = false;
    setIsRoutePushPending(false);
    if (routePushTimeoutRef.current) {
      clearTimeout(routePushTimeoutRef.current);
      routePushTimeoutRef.current = null;
    }
  };

  const pushWithRouteLock = (href: Href) => {
    if (routePushLockRef.current) return;

    routePushLockRef.current = true;
    setIsRoutePushPending(true);

    if (routePushTimeoutRef.current) {
      clearTimeout(routePushTimeoutRef.current);
    }

    routePushTimeoutRef.current = setTimeout(() => {
      releaseRoutePushLock();
    }, NAVIGATION_LOCK_DURATION_MS);

    router.push(href);
  };

  useEffect(
    () => () => {
      if (routePushTimeoutRef.current) {
        clearTimeout(routePushTimeoutRef.current);
      }
    },
    []
  );

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
          disabled={isRoutePushPending}
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
          disabled={isRoutePushPending}
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
