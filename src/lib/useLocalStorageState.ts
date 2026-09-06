import { useCallback, useState } from "react";

export function useLocalStorageState(key: string, initial = "") {
  const [value, setValue] = useState<string>(() => {
    try {
      return localStorage.getItem(key) ?? initial;
    } catch {
      return initial;
    }
  });

  const update = useCallback(
    (next: string) => {
      setValue(next);
      try {
        if (next) {
          localStorage.setItem(key, next);
        } else {
          localStorage.removeItem(key);
        }
      } catch {
        // storage unavailable (private mode / quota) — value still held in state
      }
    },
    [key],
  );

  return [value, update] as const;
}
