import { useEffect, useRef, useState } from 'react';

interface Draft<T> {
  value: T | null;
  update: (next: T) => void;
  clear: () => void;
}

const TTL_MS = 30 * 60 * 1000;

export function useDraft<T>(key: string, initialValue: T): Draft<T> {
  const storageKey = `l4p-draft-${key}`;
  const [value, setValue] = useState<T | null>(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as { expires: number; value: T };
      if (Date.now() > parsed.expires) {
        window.localStorage.removeItem(storageKey);
        return null;
      }
      return parsed.value;
    } catch (error) {
      return null;
    }
  });

  const latest = useRef(value || initialValue);

  useEffect(() => {
    latest.current = value || initialValue;
  }, [value, initialValue]);

  const update = (next: T) => {
    setValue(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ value: next, expires: Date.now() + TTL_MS }));
    } catch (error) {
      // Ignore storage errors.
    }
  };

  const clear = () => {
    setValue(null);
    window.localStorage.removeItem(storageKey);
  };

  return { value, update, clear };
}
