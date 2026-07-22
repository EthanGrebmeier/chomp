import type { Href } from 'expo-router';

type SignedOutAuthRedirectRouter = {
  canDismiss: () => boolean;
  dismissTo: (href: Href) => void;
  replace: (href: Href) => void;
};

type RedirectSignedOutAuthArgs = {
  isOnAuthRoute: boolean;
  router: SignedOutAuthRedirectRouter;
  target: Href;
};

export type SignedOutAuthRedirectResult = 'dismissed' | 'replaced' | 'skipped';

export const redirectSignedOutAuth = ({
  isOnAuthRoute,
  router,
  target,
}: RedirectSignedOutAuthArgs): SignedOutAuthRedirectResult => {
  if (isOnAuthRoute) {
    return 'skipped';
  }

  if (router.canDismiss()) {
    router.dismissTo(target);
    return 'dismissed';
  }

  router.replace(target);
  return 'replaced';
};
