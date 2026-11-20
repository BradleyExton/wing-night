import { useEffect, useState } from "react";

/**
 * Whether `ms` has passed on this screen since `key` last changed to something. Null is "not
 * yet": nothing is waited for and the answer is false. A surface holds a card back with it until
 * the beat it follows has played — the turn's results wait for the last block's ending.
 */
export const useAfter = (key: string | null, ms: number): boolean => {
  const [passed, setPassed] = useState<string | null>(null);

  useEffect(() => {
    if (key === null) {
      return undefined;
    }

    const handle = window.setTimeout(() => {
      setPassed(key);
    }, ms);

    return (): void => {
      window.clearTimeout(handle);
    };
  }, [key, ms]);

  return key !== null && passed === key;
};
