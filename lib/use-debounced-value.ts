// lib/use-debounced-value.ts
'use client';

import { useEffect, useState } from 'react';

/**
 * The value, but only after it stopped changing for `delay` ms.
 * Used for search boxes: the request goes out when the user pauses typing,
 * not on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
