import {
  Easing,
  EntryAnimationsValues,
  EntryExitAnimationFunction,
  ExitAnimationsValues,
  FadeIn,
  FadeOut,
  LinearTransition,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

/** Standard ease-out curve for enter animations. */
export const EASE_OUT = Easing.bezier(0.2, 0, 0, 1);

/** Enter duration. Exits should be shorter than enters. */
export const ENTER_MS = 300;
/** Exit duration. */
export const EXIT_MS = 150;
/** Gap between staggered siblings. */
export const STAGGER_MS = 80;

/** Plain opacity enter, used for cross-fading whole screens/states. */
export const fadeIn = (delay = 0) =>
  FadeIn.duration(ENTER_MS).delay(delay).easing(EASE_OUT);

/** Plain opacity exit, used for cross-fading whole screens/states. */
export const fadeOut = FadeOut.duration(EXIT_MS);

/** Layout transition for siblings that shift when content appears. */
export const layoutTransition = LinearTransition.duration(ENTER_MS).easing(
  EASE_OUT
);

/**
 * Fade in while rising 12px. Subtler than reanimated's built-in `FadeInUp`
 * (25px). Pass a `delay` to stagger sibling chunks.
 */
export const fadeInUp =
  (delay = 0): EntryExitAnimationFunction =>
  (_values: EntryAnimationsValues) => {
    'worklet';
    const timing = { duration: ENTER_MS, easing: EASE_OUT };
    return {
      initialValues: { opacity: 0, transform: [{ translateY: 12 }] },
      animations: {
        opacity: withDelay(delay, withTiming(1, timing)),
        transform: [{ translateY: withDelay(delay, withTiming(0, timing)) }],
      },
    };
  };

/**
 * Slides a panel in from the right edge, covering whatever is beneath it.
 * Use for push-style navigation where the incoming content should stay opaque
 * (no cross-fade overlap). Distance is the panel's own width.
 */
export const slideInRight =
  (): EntryExitAnimationFunction =>
  (values: EntryAnimationsValues) => {
    'worklet';
    return {
      initialValues: { transform: [{ translateX: values.targetWidth }] },
      animations: {
        transform: [
          {
            translateX: withTiming(0, {
              duration: ENTER_MS,
              easing: EASE_OUT,
            }),
          },
        ],
      },
    };
  };

/**
 * Slides a panel back out to the right edge, revealing whatever is beneath it.
 * Pairs with `slideInRight` for the reverse (back) direction.
 */
export const slideOutRight =
  (): EntryExitAnimationFunction =>
  (values: ExitAnimationsValues) => {
    'worklet';
    return {
      initialValues: { transform: [{ translateX: 0 }] },
      animations: {
        transform: [
          {
            translateX: withTiming(values.currentWidth, {
              duration: EXIT_MS,
              easing: EASE_OUT,
            }),
          },
        ],
      },
    };
  };

/**
 * Contextual icon enter: scale 0.25 → 1 with opacity. Use for status icons
 * (success check, error badge) that appear on a state change.
 */
export const scaleIn =
  (delay = 0): EntryExitAnimationFunction =>
  (_values: EntryAnimationsValues) => {
    'worklet';
    const timing = { duration: ENTER_MS, easing: EASE_OUT };
    return {
      initialValues: { opacity: 0, transform: [{ scale: 0.25 }] },
      animations: {
        opacity: withDelay(delay, withTiming(1, timing)),
        transform: [{ scale: withDelay(delay, withTiming(1, timing)) }],
      },
    };
  };
