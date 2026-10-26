/** Signed-in startup can restore Shopping or open another root-level app route. */
export function hasReachedStartupRoute(
  topLevelSegment: string | undefined,
  shouldUseAppRoutes: boolean
) {
  if (!topLevelSegment) return false;
  return shouldUseAppRoutes
    ? topLevelSegment !== '(auth)'
    : topLevelSegment === '(auth)';
}
