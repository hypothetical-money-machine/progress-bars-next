/**
 * PerformanceController Service
 * Provides performance optimizations for time-based progress bars
 * Requirements: 10.2, 10.3, 10.5
 */

import type { ProgressCalculation } from "@/lib/types";

/**
 * Cache interface for storing calculation results
 * Requirement: 10.2 - Calculation caching to minimize computational overhead
 */
export interface CalculationCache {
  get(barId: string, currentMinute: number): ProgressCalculation | null;
  set(
    barId: string,
    currentMinute: number,
    calculation: ProgressCalculation,
  ): void;
  invalidate(barId: string): void;
  clear(): void;
}

/**
 * Visibility tracker interface for monitoring visible progress bars
 * Requirement: 10.3 - Only update visible time-based bars
 */
export interface VisibilityTracker {
  observe(barId: string, element: HTMLElement): void;
  unobserve(barId: string): void;
  getVisibleBars(): Set<string>;
  isVisible(barId: string): boolean;
  onVisibilityChange(
    callback: (barId: string, isVisible: boolean) => void,
  ): void;
}

/**
 * Performance controller interface for coordinating optimizations
 * Requirement: 10.5 - Clean up unused timers and event listeners
 */
export interface PerformanceController {
  batchUpdate(updates: Map<string, ProgressCalculation>): void;
  scheduleUpdate(barId: string, progress: ProgressCalculation): void;
  flushUpdates(): void;
  cleanup(): void;
}

/**
 * Implementation of calculation cache with minute-level cache keys
 * Caches calculations for the current minute to avoid redundant computation
 */
export class CalculationCacheImpl implements CalculationCache {
  private cache = new Map<
    string,
    { minute: number; calculation: ProgressCalculation }
  >();
  private readonly maxCacheSize = 1000; // Prevent memory leaks

  /**
   * Get cached calculation for a bar within the current minute
   *
   * @param barId - The progress bar ID
   * @param currentMinute - Current minute timestamp (Date.getTime() / 60000)
   * @returns Cached calculation or null if not found/expired
   */
  get(barId: string, currentMinute: number): ProgressCalculation | null {
    const cached = this.cache.get(barId);

    if (cached && cached.minute === currentMinute) {
      // Return a deep copy to prevent mutations
      return {
        ...cached.calculation,
        elapsedTime: { ...cached.calculation.elapsedTime },
        remainingTime: { ...cached.calculation.remainingTime },
      };
    }

    // Remove expired cache entry
    if (cached) {
      this.cache.delete(barId);
    }

    return null;
  }

  /**
   * Store calculation result with minute-level cache key
   *
   * @param barId - The progress bar ID
   * @param currentMinute - Current minute timestamp
   * @param calculation - The calculation result to cache
   */
  set(
    barId: string,
    currentMinute: number,
    calculation: ProgressCalculation,
  ): void {
    // Prevent cache from growing too large
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entries (simple LRU-like behavior)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    // Deep copy to prevent mutations
    const cachedCalculation: ProgressCalculation = {
      ...calculation,
      elapsedTime: { ...calculation.elapsedTime },
      remainingTime: { ...calculation.remainingTime },
    };

    this.cache.set(barId, {
      minute: currentMinute,
      calculation: cachedCalculation,
    });
  }

  /**
   * Invalidate cache for a specific bar
   *
   * @param barId - The progress bar ID to invalidate
   */
  invalidate(barId: string): void {
    this.cache.delete(barId);
  }

  /**
   * Clear all cached calculations
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size (for debugging/monitoring)
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Implementation of visibility tracker using Intersection Observer API
 * Tracks which progress bars are currently visible in the viewport
 */
export class VisibilityTrackerImpl implements VisibilityTracker {
  private observer: IntersectionObserver | null = null;
  private visibleBars = new Set<string>();
  private elementMap = new Map<string, HTMLElement>();
  private callbacks: Array<(barId: string, isVisible: boolean) => void> = [];

  constructor() {
    // Initialize Intersection Observer if available
    if (typeof window !== "undefined" && "IntersectionObserver" in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const barId = entry.target.getAttribute("data-bar-id");
            if (barId) {
              const isVisible = entry.isIntersecting;

              if (isVisible) {
                this.visibleBars.add(barId);
              } else {
                this.visibleBars.delete(barId);
              }

              // Notify callbacks
              this.callbacks.forEach((callback) => {
                callback(barId, isVisible);
              });
            }
          });
        },
        {
          // Consider element visible when at least 10% is in viewport
          threshold: 0.1,
          // Add some margin to start loading before element is fully visible
          rootMargin: "50px",
        },
      );
    }
  }

  /**
   * Start observing an element for visibility changes
   *
   * @param barId - The progress bar ID
   * @param element - The DOM element to observe
   */
  observe(barId: string, element: HTMLElement): void {
    if (!this.observer) {
      // Fallback: assume all bars are visible if Intersection Observer not available
      this.visibleBars.add(barId);
      return;
    }

    // Set data attribute for identification
    element.setAttribute("data-bar-id", barId);

    // Store element reference
    this.elementMap.set(barId, element);

    // Start observing
    this.observer.observe(element);
  }

  /**
   * Stop observing an element
   *
   * @param barId - The progress bar ID to stop observing
   */
  unobserve(barId: string): void {
    const element = this.elementMap.get(barId);

    if (element && this.observer) {
      this.observer.unobserve(element);
    }

    // Clean up references
    this.elementMap.delete(barId);
    this.visibleBars.delete(barId);
  }

  /**
   * Get set of currently visible bar IDs
   *
   * @returns Set of visible progress bar IDs
   */
  getVisibleBars(): Set<string> {
    return new Set(this.visibleBars);
  }

  /**
   * Check if a specific bar is currently visible
   *
   * @param barId - The progress bar ID to check
   * @returns True if the bar is visible
   */
  isVisible(barId: string): boolean {
    return this.visibleBars.has(barId);
  }

  /**
   * Register callback for visibility change events
   *
   * @param callback - Function to call when visibility changes
   */
  onVisibilityChange(
    callback: (barId: string, isVisible: boolean) => void,
  ): void {
    this.callbacks.push(callback);
  }

  /**
   * Clean up observer and references
   */
  cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.visibleBars.clear();
    this.elementMap.clear();
    this.callbacks = [];
  }
}

/**
 * Implementation of performance controller for coordinating optimizations
 * Manages batched updates and cleanup to prevent performance issues
 */
export class PerformanceControllerImpl implements PerformanceController {
  private pendingUpdates = new Map<string, ProgressCalculation>();
  private rafId: number | null = null;
  private updateCallbacks: Array<
    (updates: Map<string, ProgressCalculation>) => void
  > = [];

  /**
   * Batch multiple progress updates into a single render cycle
   *
   * @param updates - Map of bar IDs to their progress calculations
   */
  batchUpdate(updates: Map<string, ProgressCalculation>): void {
    // Merge with pending updates
    updates.forEach((progress, barId) => {
      this.pendingUpdates.set(barId, progress);
    });

    // Schedule flush if not already scheduled
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => this.flushUpdates());
    }
  }

  /**
   * Schedule a single progress bar update
   *
   * @param barId - The progress bar ID
   * @param progress - The progress calculation
   */
  scheduleUpdate(barId: string, progress: ProgressCalculation): void {
    this.pendingUpdates.set(barId, progress);

    // Schedule flush if not already scheduled
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => this.flushUpdates());
    }
  }

  /**
   * Flush all pending updates in a single render cycle
   * Uses requestAnimationFrame to align with browser repaint
   */
  flushUpdates(): void {
    if (this.pendingUpdates.size === 0) {
      this.rafId = null;
      return;
    }

    // Create a copy of pending updates
    const updates = new Map(this.pendingUpdates);

    // Clear pending updates
    this.pendingUpdates.clear();
    this.rafId = null;

    // Notify all registered callbacks
    this.updateCallbacks.forEach((callback) => {
      try {
        callback(updates);
      } catch (error) {
        console.error("Error in update callback:", error);
      }
    });
  }

  /**
   * Register callback for batched updates
   *
   * @param callback - Function to call with batched updates
   */
  onBatchUpdate(
    callback: (updates: Map<string, ProgressCalculation>) => void,
  ): void {
    this.updateCallbacks.push(callback);
  }

  /**
   * Clean up pending updates and cancel scheduled flushes
   * Requirement: 10.5 - Clean up unused timers and event listeners
   */
  cleanup(): void {
    // Cancel pending animation frame
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Clear pending updates
    this.pendingUpdates.clear();

    // Clear callbacks
    this.updateCallbacks = [];
  }

  /**
   * Get number of pending updates (for debugging/monitoring)
   */
  getPendingCount(): number {
    return this.pendingUpdates.size;
  }
}

/**
 * Singleton instances for global use
 */
export const calculationCache = new CalculationCacheImpl();
export const visibilityTracker = new VisibilityTrackerImpl();
export const performanceController = new PerformanceControllerImpl();

/**
 * Utility function to get current minute timestamp for cache keys
 *
 * @param date - Optional date (defaults to current time)
 * @returns Minute-level timestamp
 */
export function getCurrentMinute(date: Date = new Date()): number {
  return Math.floor(date.getTime() / 60000);
}

/**
 * Cleanup function to be called when the application shuts down
 * Ensures all performance-related resources are properly cleaned up
 */
export function cleanupPerformanceOptimizations(): void {
  visibilityTracker.cleanup();
  performanceController.cleanup();
  calculationCache.clear();
}
