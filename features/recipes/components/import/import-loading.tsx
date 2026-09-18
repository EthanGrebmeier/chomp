import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  EASE_OUT,
  ENTER_MS,
  EXIT_MS,
  fadeIn,
  fadeInUp,
  layoutTransition,
  STAGGER_MS,
} from '@/components/animated/transitions';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

type ImportLoadingProps = {
  url: string;
  onCancel: () => void;
};

type Stage = { afterMs: number; title: string; hint?: string };

/**
 * Elapsed-time thresholds (ms) at which the status copy advances. Roughly
 * mirrors the server pipeline: fetch page → AI extraction → still waiting.
 */
const STAGES: Stage[] = [
  { afterMs: 0, title: 'Fetching the page…' },
  { afterMs: 4_000, title: 'Reading the ingredients…' },
  {
    afterMs: 12_000,
    title: 'Still working…',
    hint: 'Some recipe sites are slow to respond. This can take up to a minute.',
  },
];

const getHostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const useElapsedStage = () => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timers = STAGES.slice(1).map((stage, i) =>
      setTimeout(() => setStageIndex(i + 1), stage.afterMs)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return STAGES[stageIndex];
};

/**
 * Lags behind `stage` so the old copy can fade out before the new copy is
 * swapped in and faded back up. Returns the stage to render plus the
 * animated opacity to apply to it.
 */
const useCrossFadedStage = (stage: Stage) => {
  const [displayed, setDisplayed] = useState(stage);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (stage === displayed) return;

    opacity.value = withSequence(
      withTiming(0, { duration: EXIT_MS }),
      withTiming(1, { duration: ENTER_MS, easing: EASE_OUT })
    );
    const swap = setTimeout(() => setDisplayed(stage), EXIT_MS);
    return () => clearTimeout(swap);
  }, [stage, displayed, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return { stage: displayed, style };
};

const DOT_COUNT = 3;
const DOT_PULSE_MS = 600;
const DOT_STAGGER_MS = 150;

const PulsingDot = ({ index }: { index: number }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * DOT_STAGGER_MS,
      withRepeat(withTiming(1, { duration: DOT_PULSE_MS }), -1, true)
    );
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.3 + progress.value * 0.7,
    transform: [{ scale: 0.8 + progress.value * 0.2 }],
  }));

  return (
    <Animated.View
      style={style}
      className="h-2 w-2 rounded-full bg-primary"
    />
  );
};

/** Gentle three-dot pulse: quieter than a spinner for a multi-second wait. */
const PulsingDots = () => (
  <View className="h-2 flex-row gap-2" accessibilityElementsHidden>
    {Array.from({ length: DOT_COUNT }, (_, i) => (
      <PulsingDot key={i} index={i} />
    ))}
  </View>
);

export const ImportLoading = ({ url, onCancel }: ImportLoadingProps) => {
  const { stage, style: stageStyle } = useCrossFadedStage(useElapsedStage());

  return (
    <View className="flex-1 items-center justify-center gap-8 pb-12">
      <Animated.View entering={fadeIn()}>
        <PulsingDots />
      </Animated.View>

      {/* Enter and cross-fade both drive opacity; keep them on separate nodes. */}
      <Animated.View entering={fadeInUp(STAGGER_MS)}>
        <Animated.View
          style={stageStyle}
          className="items-center gap-1 px-4"
          accessibilityLiveRegion="polite"
        >
          <Text className="text-center text-3xl font-medium text-foreground">
            {stage.title}
          </Text>
          <Text
            className="text-center text-sm text-muted-foreground"
            numberOfLines={1}
          >
            {getHostname(url)}
          </Text>
          {stage.hint ? (
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              {stage.hint}
            </Text>
          ) : null}
        </Animated.View>
      </Animated.View>

      <Animated.View
        entering={fadeInUp(STAGGER_MS * 2)}
        layout={layoutTransition}
      >
        <Button variant="outline" onPress={onCancel}>
          <Text>Cancel</Text>
        </Button>
      </Animated.View>
    </View>
  );
};
