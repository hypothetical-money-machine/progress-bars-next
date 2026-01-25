import { useEffect, useRef } from "react";

/**
 * Declarative setInterval hook that avoids stale closure issues.
 * Pass null for delay to pause the interval.
 *
 * This implementation follows Dan Abramov's pattern from:
 * https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 *
 * @param callback - Function to call at each interval
 * @param delay - Delay in milliseconds, or null to pause
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Remember the latest callback (avoids stale closures)
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) return; // Paused

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
