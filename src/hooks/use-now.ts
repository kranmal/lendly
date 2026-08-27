import { useEffect, useState } from 'react';

/** Re-renders the calling component every `intervalMs` so time-derived values (e.g. due-date labels) stay fresh. */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
