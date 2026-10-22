import { rewriteIncomingPath } from '@/lib/deep-links';

export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  try {
    return rewriteIncomingPath(path);
  } catch {
    // Throwing here crashes the app; fall back to the original link.
    return path;
  }
}
