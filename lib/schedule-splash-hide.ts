/** Schedule a single hide, allowing an effect cleanup to cancel and retry it. */
export function scheduleSplashHide(
  hasHidden: { current: boolean },
  hide: () => void,
  delayMs = 0
) {
  if (hasHidden.current) return;

  const timeout = setTimeout(() => {
    // Scheduling is not hiding: cleanup may cancel this attempt before it runs.
    hasHidden.current = true;
    hide();
  }, delayMs);

  return () => clearTimeout(timeout);
}
