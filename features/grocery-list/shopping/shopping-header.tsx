import { Check, ChevronDown } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemTitle,
} from '@/components/native-dropdown';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';

import type { ShoppingDestination } from './destinations';

type Props = {
  listName?: string;
  selected?: ShoppingDestination;
  destinations: ShoppingDestination[];
  total: number;
  isLoading: boolean;
  onExit: () => void;
  onSelect: (destination: ShoppingDestination) => void;
};

const RADIUS = 9;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ShoppingProgress({
  checked,
  total,
}: {
  checked: number;
  total: number;
}) {
  const theme = useTheme();
  const progress = total > 0 ? checked / total : 0;
  const complete = total > 0 && checked === total;
  const animatedProgress = useSharedValue(progress);

  useEffect(() => {
    animatedProgress.set(
      withTiming(progress, {
        duration: 200,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.System,
      })
    );
  }, [animatedProgress, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - animatedProgress.get()),
    // Keep the arc mounted while reversing to zero, without leaving a cap dot.
    opacity: animatedProgress.get() > 0 ? 1 : 0,
  }));
  // Native SVG expects comma-separated HSL, unlike the CSS theme tokens.
  const color = (complete ? theme.chart2 : theme.primary).replace(/ /g, ',');
  const trackColor = theme.ring.replace(/ /g, ',');

  return (
    <View
      className="size-11 items-center justify-center"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Shopping progress"
      accessibilityValue={{
        min: 0,
        max: total || 1,
        now: checked,
        text: `${checked} of ${total} items checked`,
      }}
    >
      <Svg width={24} height={24} viewBox="0 0 24 24" accessible={false}>
        <Circle
          cx={12}
          cy={12}
          r={RADIUS}
          fill="none"
          stroke={trackColor}
          strokeWidth={3.5}
        />
        <AnimatedCircle
          cx={12}
          cy={12}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          animatedProps={animatedProps}
          rotation={-90}
          origin="12, 12"
        />
      </Svg>
      <View
        className="absolute inset-0 items-center justify-center"
        pointerEvents="none"
      >
        {complete ? <Icon as={Check} size={10} color={color} /> : null}
      </View>
    </View>
  );
}

export function ShoppingHeader({
  listName,
  selected,
  destinations,
  total,
  isLoading,
  onExit,
  onSelect,
}: Props) {
  return (
    <View className="flex-row items-start px-3 pb-3 pt-1">
      <View className="w-16 items-start">
        <Button
          variant="ghost"
          className="min-h-11 min-w-11 px-2"
          accessibilityLabel="Exit shopping"
          onPress={onExit}
        >
          <Text>Exit</Text>
        </Button>
      </View>
      <View className="min-w-0 flex-1 items-center">
        {selected ? (
          <DropdownMenuRoot>
            <DropdownMenuTrigger>
              <View
                className="min-h-11 max-w-full flex-row items-center justify-center gap-1.5"
                accessible
                accessibilityRole="button"
                accessibilityLabel={`${selected.name}. Change store`}
              >
                <Text
                  className="shrink text-center text-lg font-semibold"
                  numberOfLines={1}
                >
                  {selected.name}
                </Text>
                <Icon as={ChevronDown} size={16} />
              </View>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {destinations.map(destination => (
                <DropdownMenuItem
                  key={destination.storeId ?? 'no-store'}
                  onSelect={() => onSelect(destination)}
                >
                  <DropdownMenuItemTitle>{`${destination.name} · ${destination.remaining === 0 ? 'Complete' : `${destination.remaining} remaining`}`}</DropdownMenuItemTitle>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenuRoot>
        ) : (
          <View className="min-h-11 max-w-full justify-center">
            <Text className="text-center font-semibold" numberOfLines={1}>
              {listName ?? 'Grocery list'}
            </Text>
          </View>
        )}
      </View>
      <View className="w-16 items-end">
        {selected && !isLoading ? (
          <ShoppingProgress
            key={selected.storeId ?? 'no-store'}
            checked={total - selected.remaining}
            total={total}
          />
        ) : null}
      </View>
    </View>
  );
}
