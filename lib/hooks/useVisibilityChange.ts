import { useEffect, useState } from "react";

/**
 * Hook that tracks document visibility state and triggers callback on changes.
 * Useful for pausing/resuming operations when tab becomes hidden/visible.
 *
 * @param onVisibilityChange - Optional callback triggered when visibility changes
 * @returns Object with current visibility state
 */
export function useVisibilityChange(
  onVisibilityChange?: (isVisible: boolean) => void,
) {
  const [isVisible, setIsVisible] = useState(() => {
    // Initialize with current visibility state, defaulting to true for SSR
    if (typeof document !== "undefined") {
      return !document.hidden;
    }
    return true;
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);
      onVisibilityChange?.(visible);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onVisibilityChange]);

  return { isVisible };
}
