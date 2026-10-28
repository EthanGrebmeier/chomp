/** Allow native UI changes and a visible frame before starting background work. */
export function scheduleAfterPaint(callback: () => void) {
  let frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(callback);
  });
  return () => cancelAnimationFrame(frame);
}
