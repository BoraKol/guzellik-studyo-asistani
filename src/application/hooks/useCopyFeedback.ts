import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Reusable clipboard copy hook with automatic timer cleanup on unmount.
 * Prevents setState-after-unmount warnings and eliminates duplicated timer boilerplate.
 */
export function useCopyFeedback(durationMs = 2000) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copyText = useCallback(
    async (key: string, text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
        }
        timerRef.current = window.setTimeout(() => {
          setCopiedKey((prev) => (prev === key ? null : prev));
          timerRef.current = null;
        }, durationMs);
        return true;
      } catch {
        return false;
      }
    },
    [durationMs]
  );

  return { copiedKey, copyText };
}
