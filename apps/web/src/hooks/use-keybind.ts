import { useEffect, useCallback, useRef } from "react";

interface UseKeybindCallback {
  (event: KeyboardEvent): void;
}

interface UseKeybindOptions {
  preventDefault?: boolean;
  enabled?: boolean;
  target?: Element | null;
  debounceMs?: number;
}

/**
 * Custom hook for handling keyboard shortcuts
 * @param {string|string[]} keys - Key combination (e.g., "ctrl+shift+k" or ["ctrl", "shift", "k"])
 * @param {Function} callback - Function to execute when keybind is pressed
 * @param {Object} options - Additional options
 * @param {boolean} options.preventDefault - Whether to prevent default behavior (default: true)
 * @param {boolean} options.enabled - Whether the keybind is active (default: true)
 * @param {Element} options.target - Target element to attach listener (default: document)
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default: 300)
 */
const useKeybind = (
  keys: string | string[],
  callback: UseKeybindCallback,
  options: UseKeybindOptions = {},
) => {
  const {
    preventDefault = true,
    enabled = true,
    target = typeof document !== "undefined" ? document : null,
    debounceMs = 300,
  } = options;

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallRef = useRef<number>(0);

  // Normalize keys to array format
  const normalizeKeys = useCallback((keyInput: string | string[]) => {
    if (typeof keyInput === "string") {
      return keyInput
        .toLowerCase()
        .split("+")
        .map((key) => key.trim());
    }
    return keyInput.map((key) => key.toLowerCase());
  }, []);

  const keyArray = normalizeKeys(keys);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !callback) return;

      const pressedKeys: string[] = [];

      // Check modifier keys
      if (event.ctrlKey || event.metaKey) pressedKeys.push("ctrl");
      if (event.shiftKey) pressedKeys.push("shift");
      if (event.altKey) pressedKeys.push("alt");

      // Add the main key (convert to lowercase for consistency)
      const mainKey = event.key.toLowerCase();
      if (!["control", "shift", "alt", "meta"].includes(mainKey)) {
        pressedKeys.push(mainKey);
      }

      // Check if pressed keys match the target combination
      const keysMatch =
        keyArray.length === pressedKeys.length &&
        keyArray.every((key) => pressedKeys.includes(key));

      if (keysMatch) {
        if (preventDefault) {
          event.preventDefault();
          event.stopPropagation();
        }

        // Clear existing debounce timer
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }

        // Check if enough time has passed since last call
        const now = Date.now();
        const timeSinceLastCall = now - lastCallRef.current;

        if (timeSinceLastCall >= debounceMs) {
          // Execute immediately if enough time has passed
          lastCallRef.current = now;
          callback(event);
        } else {
          // Set up debounced call
          debounceRef.current = setTimeout(() => {
            lastCallRef.current = Date.now();
            callback(event);
          }, debounceMs - timeSinceLastCall);
        }
      }
    },
    [keyArray, callback, enabled, preventDefault, debounceMs],
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!target || !enabled) return;

    const eventListener = (e: Event) => handleKeyDown(e as KeyboardEvent);

    target.addEventListener("keydown", eventListener);

    return () => {
      target.removeEventListener("keydown", eventListener);
      // Clear debounce timer when effect cleans up
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [target, handleKeyDown, enabled]);
};

export default useKeybind;
