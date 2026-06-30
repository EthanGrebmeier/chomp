import type { Href } from 'expo-router';

type SignedOutAuthRedirectRouter = {
  canDismiss: () => boolean;
  dismissAll: () => void;
  replace: (href: Href) => void;
};

type PendingAuthRedirectRef = {
  current: Href | null;
};

type RedirectSignedOutAuthArgs = {
  isOnAuthRoute: boolean;
  pendingTargetRef: PendingAuthRedirectRef;
  router: SignedOutAuthRedirectRouter;
  target: Href;
};

export type SignedOutAuthRedirectResult = 'dismissed' | 'replaced' | 'skipped';

export const redirectSignedOutAuth = ({
  isOnAuthRoute,
  pendingTargetRef,
  router,
  target,
}: RedirectSignedOutAuthArgs): SignedOutAuthRedirectResult => {
  if (isOnAuthRoute) {
    pendingTargetRef.current = null;
    return 'skipped';
  }

  const resolvedTarget = pendingTargetRef.current ?? target;

  if (router.canDismiss()) {
    pendingTargetRef.current = resolvedTarget;
    router.dismissAll();
    return 'dismissed';
  }

  pendingTargetRef.current = null;
  router.replace(resolvedTarget);
  return 'replaced';
};
