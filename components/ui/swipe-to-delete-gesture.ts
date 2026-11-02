export function getDeleteThreshold(width: number) {
  'worklet';
  return Math.min(width * 0.35, 180);
}

export function shouldDeleteOnRelease(
  position: number,
  velocityX: number,
  threshold: number
) {
  'worklet';
  // A deliberate reversal always lets the user back out.
  if (velocityX > 600) return false;
  if (position >= threshold) return true;
  // Require the action to be fully revealed before momentum can commit it.
  // Tiny, fast swipes should only reveal the button.
  return (
    position >= 88 &&
    velocityX < -600 &&
    position - velocityX * 0.12 >= threshold
  );
}
