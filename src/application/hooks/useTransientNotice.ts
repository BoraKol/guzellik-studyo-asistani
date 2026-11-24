import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Reusable auto-dismissing status notice hook with guaranteed cleanup on unmount.
 */
export function useTransientNotice(defaultDurationMs = 3000) {
  const [notice, setNotice] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearNotice = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setNotice(null);
  }, []);

  const showNotice = useCallback(
    (message: string, durationMs = defaultDurationMs) => {
      setNotice(message);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setNotice(null);
        timerRef.current = null;
      }, durationMs);
    },
    [defaultDurationMs]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { notice, showNotice, clearNotice };
}
