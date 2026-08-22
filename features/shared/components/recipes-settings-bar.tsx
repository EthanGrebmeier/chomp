import { Href, router } from 'expo-router';
import { BookOpenIcon, SettingsIcon } from 'lucide-react-native';
import { type ComponentProps, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { navigation } from '@/lib/navigation';

const NAVIGATION_LOCK_DURATION_MS = 1500;

type RecipesSettingsBarProps = {
  listId?: string;
} & Pick<ComponentProps<typeof Animated.View>, 'style' | 'pointerEvents'>;

export function RecipesSettingsBar({
  listId,
  style,
  pointerEvents = 'auto',
}: RecipesSettingsBarProps) {
  const [isRoutePushPending, setIsRoutePushPending] = useState(false);
  const routePushLockRef = useRef(false);
  const routePushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

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

  return (
    <Animated.View
      className="bottom-safe absolute left-6 z-10"
      style={style}
      pointerEvents={pointerEvents}
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
