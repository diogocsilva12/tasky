import { useEffect, useRef } from 'react';

/** Initialize a draft on opening or changing records, never on a background refresh. */
export function useFormSession(open: boolean, recordKey: string, initialize: () => void) {
  const session = useRef<string | null>(null);
  useEffect(() => {
    if (!open) {
      session.current = null;
      return;
    }
    if (session.current === recordKey) return;
    session.current = recordKey;
    initialize();
  }, [open, recordKey, initialize]);
}
