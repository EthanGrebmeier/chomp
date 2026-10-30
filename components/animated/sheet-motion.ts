import {
  Easing,
  FadeIn,
  FadeInRight,
  FadeOut,
  FadeOutRight,
  LinearTransition,
  ReduceMotion,
} from 'react-native-reanimated';

/** Shared motion for steps within a sheet. Native sheet presentation stays native. */
export const SHEET_SCREEN_MOTION = {
  enterDuration: 280,
  exitDuration: 220,
  distance: 24,
  easing: Easing.bezier(0.23, 1, 0.32, 1),
};

export const sheetScreenEnter = FadeInRight.withInitialValues({
  opacity: 0,
  transform: [{ translateX: SHEET_SCREEN_MOTION.distance }],
})
  .duration(SHEET_SCREEN_MOTION.enterDuration)
  .easing(SHEET_SCREEN_MOTION.easing)
  .reduceMotion(ReduceMotion.System);

export const sheetScreenExit = FadeOutRight.withTargetValues({
  opacity: 0,
  transform: [{ translateX: SHEET_SCREEN_MOTION.distance }],
})
  .duration(SHEET_SCREEN_MOTION.exitDuration)
  .easing(SHEET_SCREEN_MOTION.easing)
  .reduceMotion(ReduceMotion.System);

export const sheetScreenFadeIn = FadeIn.duration(
  SHEET_SCREEN_MOTION.enterDuration
)
  .easing(SHEET_SCREEN_MOTION.easing)
  .reduceMotion(ReduceMotion.Never);

export const sheetScreenFadeOut = FadeOut.duration(
  SHEET_SCREEN_MOTION.exitDuration
)
  .easing(SHEET_SCREEN_MOTION.easing)
  .reduceMotion(ReduceMotion.Never);

/** Match the native detent curve when a compact composer expands. */
export const sheetCardResize = LinearTransition.duration(300)
  .easing(Easing.bezier(0.32, 0.72, 0, 1))
  .reduceMotion(ReduceMotion.System);
