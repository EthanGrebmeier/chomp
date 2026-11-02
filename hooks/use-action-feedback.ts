import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner-native';

/** Locks immediately, including two presses before React's next render. */
export function useActionFeedback() {
  const busy = useRef(false);
  const [isPending, setIsPending] = useState(false);
  const run = useCallback(
    async (
      action: () => Promise<void>,
      messages: { success: string; error: string }
    ) => {
      if (busy.current) return;
      busy.current = true;
      setIsPending(true);
      try {
        await action();
        toast.success(messages.success);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : messages.error);
      } finally {
        busy.current = false;
        setIsPending(false);
      }
    },
    []
  );
  return { run, isPending };
}
