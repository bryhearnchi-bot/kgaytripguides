/**
 * Haptic Feedback Utilities for Mobile Interactions
 * Provides cross-platform vibration feedback for enhanced mobile UX
 */

import * as React from 'react';

interface HapticPattern {
  duration?: number;
  pattern?: number[];
}

// Standard haptic patterns
export const HapticPatterns = {
  // Light tap (like button press)
  LIGHT: { duration: 50 },

  // Medium feedback (like selection)
  MEDIUM: { duration: 100 },

  // Heavy feedback (like error or important action)
  HEAVY: { duration: 200 },

  // Success pattern (double tap)
  SUCCESS: { pattern: [50, 50, 50] },

  // Error pattern (triple tap)
  ERROR: { pattern: [100, 50, 100, 50, 100] },

  // Warning pattern (long-short)
  WARNING: { pattern: [150, 100, 50] },

  // Notification pattern
  NOTIFICATION: { pattern: [50, 100, 50, 100, 50] }
} as const;

class HapticManager {
  private isSupported: boolean;
  private isEnabled: boolean;

  constructor() {
    this.isSupported = this.checkSupport();
    this.isEnabled = this.getEnabledState();
  }

  private checkSupport(): boolean {
    return (
      'vibrate' in navigator ||
      'webkitVibrate' in navigator ||
      // @ts-ignore - Check for iOS specific haptic support
      'hapticFeedback' in window ||
      // @ts-ignore - Check for device motion access
      'DeviceMotionEvent' in window
    );
  }

  private getEnabledState(): boolean {
    const stored = localStorage.getItem('haptic-enabled');
    return stored !== null ? JSON.parse(stored) : true;
  }

  /**
   * Enable or disable haptic feedback
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('haptic-enabled', JSON.stringify(enabled));
  }

  /**
   * Check if haptic feedback is enabled
   */
  getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Check if haptic feedback is supported
   */
  getSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Trigger haptic feedback with a pattern
   */
  vibrate(pattern: HapticPattern): void {
    if (!this.isSupported || !this.isEnabled) return;

    try {
      if (pattern.pattern) {
        // Use pattern for complex vibrations
        navigator.vibrate(pattern.pattern);
      } else if (pattern.duration) {
        // Use simple duration
        navigator.vibrate(pattern.duration);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Light haptic feedback for subtle interactions
   */
  light(): void {
    this.vibrate(HapticPatterns.LIGHT);
  }

  /**
   * Medium haptic feedback for standard interactions
   */
  medium(): void {
    this.vibrate(HapticPatterns.MEDIUM);
  }

  /**
   * Heavy haptic feedback for important interactions
   */
  heavy(): void {
    this.vibrate(HapticPatterns.HEAVY);
  }

  /**
   * Success haptic feedback
   */
  success(): void {
    this.vibrate(HapticPatterns.SUCCESS);
  }

  /**
   * Error haptic feedback
   */
  error(): void {
    this.vibrate(HapticPatterns.ERROR);
  }

  /**
   * Warning haptic feedback
   */
  warning(): void {
    this.vibrate(HapticPatterns.WARNING);
  }

  /**
   * Notification haptic feedback
   */
  notification(): void {
    this.vibrate(HapticPatterns.NOTIFICATION);
  }

  /**
   * Button press haptic feedback
   */
  buttonPress(): void {
    this.light();
  }

  /**
   * Selection change haptic feedback
   */
  selectionChange(): void {
    this.medium();
  }

  /**
   * Form submission haptic feedback
   */
  formSubmit(): void {
    this.medium();
  }

  /**
   * Navigation haptic feedback
   */
  navigate(): void {
    this.light();
  }

  /**
   * Swipe gesture haptic feedback
   */
  swipe(): void {
    this.light();
  }

  /**
   * Pull to refresh haptic feedback
   */
  pullToRefresh(): void {
    this.medium();
  }
}

// Create singleton instance
export const haptics = new HapticManager();

/**
 * React hook for haptic feedback
 */
export function useHaptics() {
  return {
    vibrate: (pattern: HapticPattern) => haptics.vibrate(pattern),
    light: () => haptics.light(),
    medium: () => haptics.medium(),
    heavy: () => haptics.heavy(),
    success: () => haptics.success(),
    error: () => haptics.error(),
    warning: () => haptics.warning(),
    notification: () => haptics.notification(),
    buttonPress: () => haptics.buttonPress(),
    selectionChange: () => haptics.selectionChange(),
    formSubmit: () => haptics.formSubmit(),
    navigate: () => haptics.navigate(),
    swipe: () => haptics.swipe(),
    pullToRefresh: () => haptics.pullToRefresh(),
    setEnabled: (enabled: boolean) => haptics.setEnabled(enabled),
    isEnabled: () => haptics.getEnabled(),
    isSupported: () => haptics.getSupported()
  };
}

/**
 * HOC to add haptic feedback to components
 */
export function withHaptics<P extends object>(
  Component: React.ComponentType<P>,
  feedbackType: keyof typeof HapticPatterns = 'LIGHT'
) {
  return function HapticComponent(props: P) {
    const handleInteraction = () => {
      haptics.vibrate(HapticPatterns[feedbackType]);
    };

    return React.createElement(
      'div',
      { onClick: handleInteraction, onTouchStart: handleInteraction },
      React.createElement(Component, props)
    );
  };
}