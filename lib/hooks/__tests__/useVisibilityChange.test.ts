import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useVisibilityChange } from "../useVisibilityChange";

describe("useVisibilityChange", () => {
  let mockHidden: boolean;
  let visibilityChangeListeners: ((event: Event) => void)[] = [];

  beforeEach(() => {
    mockHidden = false;
    visibilityChangeListeners = [];

    // Mock document.hidden
    Object.defineProperty(document, "hidden", {
      get: () => mockHidden,
      configurable: true,
    });

    // Mock addEventListener/removeEventListener
    const originalAddEventListener = document.addEventListener;
    const originalRemoveEventListener = document.removeEventListener;

    vi.spyOn(document, "addEventListener").mockImplementation(
      (event, listener) => {
        if (event === "visibilitychange") {
          visibilityChangeListeners.push(listener as (event: Event) => void);
        } else {
          originalAddEventListener.call(document, event, listener);
        }
      },
    );

    vi.spyOn(document, "removeEventListener").mockImplementation(
      (event, listener) => {
        if (event === "visibilitychange") {
          const index = visibilityChangeListeners.indexOf(
            listener as (event: Event) => void,
          );
          if (index > -1) {
            visibilityChangeListeners.splice(index, 1);
          }
        } else {
          originalRemoveEventListener.call(document, event, listener);
        }
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const triggerVisibilityChange = () => {
    act(() => {
      visibilityChangeListeners.forEach((listener) => {
        listener(new Event("visibilitychange"));
      });
    });
  };

  it("returns initial visibility state", () => {
    mockHidden = false;
    const { result } = renderHook(() => useVisibilityChange());

    expect(result.current.isVisible).toBe(true);
  });

  it("returns false when document is initially hidden", () => {
    mockHidden = true;
    const { result } = renderHook(() => useVisibilityChange());

    expect(result.current.isVisible).toBe(false);
  });

  it("updates visibility state when document visibility changes", () => {
    mockHidden = false;
    const { result } = renderHook(() => useVisibilityChange());

    expect(result.current.isVisible).toBe(true);

    // Hide the document
    mockHidden = true;
    triggerVisibilityChange();

    expect(result.current.isVisible).toBe(false);

    // Show the document
    mockHidden = false;
    triggerVisibilityChange();

    expect(result.current.isVisible).toBe(true);
  });

  it("calls callback when visibility changes", () => {
    const callback = vi.fn();
    mockHidden = false;

    renderHook(() => useVisibilityChange(callback));

    // Hide the document
    mockHidden = true;
    triggerVisibilityChange();

    expect(callback).toHaveBeenCalledWith(false);

    // Show the document
    mockHidden = false;
    triggerVisibilityChange();

    expect(callback).toHaveBeenCalledWith(true);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("cleans up event listener on unmount", () => {
    const { unmount } = renderHook(() => useVisibilityChange());

    expect(visibilityChangeListeners).toHaveLength(1);

    unmount();

    expect(visibilityChangeListeners).toHaveLength(0);
  });

  it("works without callback", () => {
    mockHidden = false;
    const { result } = renderHook(() => useVisibilityChange());

    expect(result.current.isVisible).toBe(true);

    mockHidden = true;
    triggerVisibilityChange();

    expect(result.current.isVisible).toBe(false);
  });
});
