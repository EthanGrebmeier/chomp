/** Schedule a single hide, allowing an effect cleanup to cancel and retry it. */
export function scheduleSplashHide(
  hasHidden: { current: boolean },
  hide: () => void
) {
  if (hasHidden.current) return;

  const timeout = setTimeout(() => {
    // Scheduling is not hiding: cleanup may cancel this attempt before it runs.
    hasHidden.current = true;
    hide();
  }, 300);

  return () => clearTimeout(timeout);
}
