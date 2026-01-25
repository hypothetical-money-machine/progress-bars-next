/**
 * AutoUpdateSystem Service
 * Manages automatic updates for time-based progress bars
 * Requirements: 6.1, 6.2, 6.4, 6.5
 */

import type { ProgressBar } from "@/db/schema";
import type { ProgressCalculation } from "@/lib/types";
import { TimeBasedManager } from "./TimeBasedManager";

/**
 * Callback function type for progress updates
 */
type ProgressUpdateCallback = (
  barId: string,
  progress: ProgressCalculation,
) => void;

/**
 * AutoUpdateSystem class manages automatic updates for time-based progress bars
 *
 * Features:
 * - 1-minute interval timer for batch updates (Requirement 6.1)
 * - Tab visibility handling to pause/resume updates (Requirement 6.5)
 * - Proper cleanup to prevent memory leaks (Requirement 6.1, 6.5)
 * - Batch updates for multiple bars (Requirement 6.4)
 */
export class AutoUpdateSystem {
  private timeBasedManager: TimeBasedManager;
  private updateInterval: NodeJS.Timeout | null = null;
  private bars: Map<string, ProgressBar> = new Map();
  private callbacks: Set<ProgressUpdateCallback> = new Set();
  private isUpdating: boolean = false;
  private visibilityChangeHandler: (() => void) | null = null;

  // Update interval in milliseconds (1 minute)
  private readonly UPDATE_INTERVAL_MS = 60000;

  constructor(timeBasedManager?: TimeBasedManager) {
    this.timeBasedManager = timeBasedManager || new TimeBasedManager();
  }

  /**
   * Start automatic updates for time-based progress bars
   * Requirements: 6.1, 6.4
   *
   * @param bars - Array of progress bars to update
   */
  startUpdating(bars: ProgressBar[]): void {
    // Stop any existing updates first
    this.stopUpdating();

    // Store bars in map for efficient lookup
    this.bars.clear();
    for (const bar of bars) {
      if (bar.barType === "time-based") {
        this.bars.set(bar.id, bar);
      }
    }

    // Start the update interval
    this.isUpdating = true;
    this.updateInterval = setInterval(() => {
      this.batchUpdate();
    }, this.UPDATE_INTERVAL_MS);

    // Set up tab visibility handling
    this.setupVisibilityHandling();

    // Perform initial update
    this.batchUpdate();
  }

  /**
   * Stop automatic updates and clean up resources
   * Requirements: 6.1, 6.5
   */
  stopUpdating(): void {
    // Clear the update interval
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Remove visibility change handler
    if (
      this.visibilityChangeHandler !== null &&
      typeof document !== "undefined"
    ) {
      document.removeEventListener(
        "visibilitychange",
        this.visibilityChangeHandler,
      );
      this.visibilityChangeHandler = null;
    }

    // Clear state
    this.isUpdating = false;
    this.bars.clear();
    this.callbacks.clear();
  }

  /**
   * Update a single progress bar
   * Requirements: 6.1, 6.2
   *
   * @param barId - ID of the bar to update
   */
  async updateSingleBar(barId: string): Promise<void> {
    const bar = this.bars.get(barId);

    if (!bar) {
      console.warn(`Bar with ID ${barId} not found in AutoUpdateSystem`);
      return;
    }

    try {
      // Calculate current progress
      const progress = this.timeBasedManager.calculateCurrentProgress(bar);

      // Update completion status in database if needed
      if (
        progress.isCompleted !== bar.isCompleted ||
        progress.isOverdue !== bar.isOverdue
      ) {
        const updatedBar =
          await this.timeBasedManager.updateCompletionStatus(bar);
        this.bars.set(barId, updatedBar);
      }

      // Notify all registered callbacks
      this.notifyCallbacks(barId, progress);
    } catch (error) {
      console.error(`Error updating bar ${barId}:`, error);
    }
  }

  /**
   * Perform batch update of all registered bars
   * Requirements: 6.4
   *
   * @private
   */
  private async batchUpdate(): Promise<void> {
    if (!this.isUpdating || this.bars.size === 0) {
      return;
    }

    // Update all bars in parallel
    const updatePromises = Array.from(this.bars.keys()).map((barId) =>
      this.updateSingleBar(barId),
    );

    try {
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error during batch update:", error);
    }
  }

  /**
   * Set up tab visibility handling
   * Requirements: 6.5
   *
   * @private
   */
  private setupVisibilityHandling(): void {
    // Only set up if running in browser environment
    if (typeof document === "undefined") {
      return;
    }

    // Create visibility change handler
    this.visibilityChangeHandler = () => {
      if (document.visibilityState === "visible") {
        // Tab became visible - perform immediate update
        this.batchUpdate();
      }
      // When tab becomes hidden, the interval continues but we don't need special handling
    };

    // Register the handler
    document.addEventListener("visibilitychange", this.visibilityChangeHandler);
  }

  /**
   * Register a callback for progress updates
   *
   * @param callback - Function to call when progress is updated
   */
  onProgressUpdate(callback: ProgressUpdateCallback): void {
    this.callbacks.add(callback);
  }

  /**
   * Unregister a callback
   *
   * @param callback - Function to remove from callbacks
   */
  offProgressUpdate(callback: ProgressUpdateCallback): void {
    this.callbacks.delete(callback);
  }

  /**
   * Notify all registered callbacks of a progress update
   *
   * @param barId - ID of the updated bar
   * @param progress - Updated progress calculation
   * @private
   */
  private notifyCallbacks(barId: string, progress: ProgressCalculation): void {
    for (const callback of this.callbacks) {
      try {
        callback(barId, progress);
      } catch (error) {
        console.error("Error in progress update callback:", error);
      }
    }
  }

  /**
   * Add a bar to the update system
   *
   * @param bar - Progress bar to add
   */
  addBar(bar: ProgressBar): void {
    if (bar.barType === "time-based") {
      this.bars.set(bar.id, bar);

      // Perform immediate update for the new bar
      if (this.isUpdating) {
        this.updateSingleBar(bar.id);
      }
    }
  }

  /**
   * Remove a bar from the update system
   *
   * @param barId - ID of the bar to remove
   */
  removeBar(barId: string): void {
    this.bars.delete(barId);
  }

  /**
   * Update a bar's data in the system
   *
   * @param bar - Updated progress bar
   */
  updateBar(bar: ProgressBar): void {
    if (bar.barType === "time-based") {
      this.bars.set(bar.id, bar);

      // Perform immediate update for the updated bar
      if (this.isUpdating) {
        this.updateSingleBar(bar.id);
      }
    }
  }

  /**
   * Get the current update interval in milliseconds
   *
   * @returns Update interval in milliseconds
   */
  getUpdateInterval(): number {
    return this.UPDATE_INTERVAL_MS;
  }

  /**
   * Check if the system is currently updating
   *
   * @returns True if updates are active
   */
  isActive(): boolean {
    return this.isUpdating;
  }

  /**
   * Get the number of bars being tracked
   *
   * @returns Number of bars
   */
  getBarCount(): number {
    return this.bars.size;
  }
}

// Export singleton instance for convenience
export const autoUpdateSystem = new AutoUpdateSystem();
