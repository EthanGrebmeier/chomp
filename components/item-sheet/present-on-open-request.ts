import { useEffect, useRef } from 'react';

export const shouldPresentOnOpenRequest = (
  openRequestId: number | undefined,
  lastPresentedOpenRequestId: number | undefined
) =>
  openRequestId !== undefined &&
  openRequestId !== lastPresentedOpenRequestId;

export const usePresentOnOpenRequest = (
  openRequestId: number | undefined,
  present: () => void
) => {
  const lastPresentedOpenRequestIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (
      !shouldPresentOnOpenRequest(
        openRequestId,
        lastPresentedOpenRequestIdRef.current
      )
    ) {
      return;
    }

    lastPresentedOpenRequestIdRef.current = openRequestId;
    const frame = requestAnimationFrame(present);
    return () => cancelAnimationFrame(frame);
  }, [openRequestId, present]);
};
