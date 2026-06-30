type ClerkErrorDetail = {
  code?: string;
  longMessage?: string;
  message?: string;
  meta?: unknown;
};

type ClerkError = {
  code?: string;
  errors?: ClerkErrorDetail[];
  longMessage?: string;
  message?: string;
  status?: number;
};

export const getClerkError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const clerkError = error as ClerkError;
  if (clerkError.errors?.[0]) {
    return clerkError.errors[0];
  }

  if (clerkError.code || clerkError.message || clerkError.longMessage) {
    return {
      code: clerkError.code,
      longMessage: clerkError.longMessage,
      message: clerkError.message,
    };
  }

  return null;
};

export const getClerkErrorMessage = (error: unknown) => {
  const clerkError = getClerkError(error);
  if (clerkError?.longMessage) {
    return clerkError.longMessage;
  }

  if (clerkError?.message) {
    return clerkError.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return null;
};

export const isClerkMissingSessionError = (error: unknown) => {
  const clerkError = getClerkError(error);
  const details = [
    clerkError?.code,
    clerkError?.message,
    clerkError?.longMessage,
    error instanceof Error ? error.message : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return /\bsession(?:\s+\S+)?\s+does not exist\b/.test(details);
};

export const getSafeClerkErrorMessage = (error: unknown) => {
  if (isClerkMissingSessionError(error)) {
    return null;
  }

  return getClerkErrorMessage(error);
};

export const getClerkErrorPayload = (error: unknown) => {
  const clerkError = getClerkError(error);

  return {
    message: getClerkErrorMessage(error),
    code: clerkError?.code,
    longMessage: clerkError?.longMessage,
    meta: clerkError?.meta,
    status:
      error && typeof error === 'object' && 'status' in error
        ? (error as ClerkError).status
        : undefined,
  };
};
