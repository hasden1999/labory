'use client';

import { useEffect, useRef } from 'react';

/**
 * Pure Single-Shift Key Navigation Detector
 * Strict single-Shift press detection:
 * - Standalone single Shift press: keydown to keyup within < 400ms.
 * - Zero intermediate key presses or mouse clicks between keydown and keyup.
 * - Ignores:
 *     1. event.repeat (held keys)
 *     2. Alt, Ctrl, Meta modifiers (protects Windows language switching: Alt+Shift, Ctrl+Shift)
 *     3. isComposing (IME composition / Arabic typing)
 *     4. Open autocomplete dropdowns or select popovers
 */
export function isStandaloneShift(
  downEvent: { key: string; altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; repeat?: boolean; isComposing?: boolean },
  upEvent: { key: string; altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; isComposing?: boolean },
  durationMs: number,
  interruptedByOtherKeyOrClick: boolean = false
): boolean {
  if (downEvent.key !== 'Shift' || upEvent.key !== 'Shift') return false;
  if (downEvent.repeat) return false;
  if (downEvent.isComposing || upEvent.isComposing) return false;
  if (downEvent.altKey || downEvent.ctrlKey || downEvent.metaKey) return false;
  if (upEvent.altKey || upEvent.ctrlKey || upEvent.metaKey) return false;
  if (interruptedByOtherKeyOrClick) return false;
  if (durationMs <= 0 || durationMs >= 400) return false;
  return true;
}

export interface UseShiftNavigationProps {
  containerRef?: React.RefObject<HTMLElement>;
  enabled?: boolean;
  isDropdownOpen?: () => boolean;
}

/**
 * useShiftNavigation Hook
 * Listens for single standalone <400ms Shift key taps to advance focus sequentially:
 * Patient Card Inputs -> Results Grid Inputs -> Save Button (Focus only, no submit).
 */
export function useShiftNavigation({
  containerRef,
  enabled = true,
  isDropdownOpen,
}: UseShiftNavigationProps = {}) {
  const shiftDownTimeRef = useRef<number | null>(null);
  const shiftDownEventRef = useRef<KeyboardEvent | null>(null);
  const interruptedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        if (!e.repeat) {
          shiftDownTimeRef.current = performance.now();
          shiftDownEventRef.current = e;
          interruptedRef.current = false;
        }
      } else {
        // Any other key press invalidates the standalone Shift sequence
        interruptedRef.current = true;
      }
    };

    const handleMouseDown = () => {
      // Any mouse click invalidates the standalone Shift sequence
      interruptedRef.current = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && shiftDownTimeRef.current !== null && shiftDownEventRef.current !== null) {
        const duration = performance.now() - shiftDownTimeRef.current;
        const downEvt = shiftDownEventRef.current;

        const isStandalone = isStandaloneShift(
          downEvt,
          e,
          duration,
          interruptedRef.current
        );

        // Reset tracking state
        shiftDownTimeRef.current = null;
        shiftDownEventRef.current = null;
        interruptedRef.current = false;

        if (isStandalone) {
          // If a dropdown or autocomplete is open, skip navigation
          if (isDropdownOpen && isDropdownOpen()) {
            return;
          }

          // Advance focus along the interactive navigable sequence
          advanceFocusToNextField(containerRef?.current || document.body);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('mousedown', handleMouseDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, [enabled, containerRef, isDropdownOpen]);
}

/**
 * Traverses DOM tree to find next focusable element marked for Shift navigation
 * Target order:
 * 1. [data-shift-nav="patient"] inputs
 * 2. [data-shift-nav="result"] inputs
 * 3. [data-shift-nav="save-btn"] button (focus only!)
 */
export function advanceFocusToNextField(root: HTMLElement) {
  const elements = Array.from(
    root.querySelectorAll<HTMLElement>(
      'input[data-shift-nav], textarea[data-shift-nav], button[data-shift-nav]'
    )
  ).filter((el) => {
    // Only focus visible, non-disabled, non-readonly inputs
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if ((el as HTMLInputElement).disabled) return false;
    if ((el as HTMLInputElement).readOnly) return false;
    return true;
  });

  if (elements.length === 0) return;

  const activeEl = document.activeElement as HTMLElement | null;
  const currentIndex = activeEl ? elements.indexOf(activeEl) : -1;

  let nextIndex = 0;
  if (currentIndex >= 0 && currentIndex < elements.length - 1) {
    nextIndex = currentIndex + 1;
  } else if (currentIndex === elements.length - 1) {
    // If at the last element (save button), loop back to first input or stay
    nextIndex = 0;
  }

  const target = elements[nextIndex];
  if (target) {
    target.focus();
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      target.select();
    }
    target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}
