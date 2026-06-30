type EmailAuthCompletionListener = () => void;

const emailAuthCompletionListeners = new Set<EmailAuthCompletionListener>();

let emailAuthCompletionCount = 0;

const publishEmailAuthCompletionState = () => {
  emailAuthCompletionListeners.forEach(listener => listener());
};

export const subscribeToEmailAuthCompletionState = (
  listener: EmailAuthCompletionListener
) => {
  emailAuthCompletionListeners.add(listener);

  return () => {
    emailAuthCompletionListeners.delete(listener);
  };
};

export const getIsEmailAuthCompletionActive = () =>
  emailAuthCompletionCount > 0;

export const runWithEmailAuthCompletion = async <T,>(
  task: () => Promise<T>
) => {
  emailAuthCompletionCount += 1;
  publishEmailAuthCompletionState();

  try {
    return await task();
  } finally {
    emailAuthCompletionCount = Math.max(0, emailAuthCompletionCount - 1);
    publishEmailAuthCompletionState();
  }
};

export const resetEmailAuthCompletionForTests = () => {
  emailAuthCompletionCount = 0;
  publishEmailAuthCompletionState();
};
