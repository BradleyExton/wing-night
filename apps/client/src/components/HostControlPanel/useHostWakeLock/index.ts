import { useEffect } from "react";

// Keeps the host tablet screen awake for the whole party; without this the
// default auto-lock lands inside the eating timer while the host is idle.
export const useHostWakeLock = (): void => {
  useEffect(() => {
    if (!("wakeLock" in navigator)) {
      return;
    }

    let wakeLockSentinel: WakeLockSentinel | null = null;
    let isDisposed = false;

    const requestWakeLock = async (): Promise<void> => {
      try {
        const sentinel = await navigator.wakeLock.request("screen");

        if (isDisposed) {
          void sentinel.release();
          return;
        }

        wakeLockSentinel = sentinel;
      } catch {
        // Wake lock is best-effort; denial must never break host controls.
      }
    };

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        void requestWakeLock();
      }
    };

    void requestWakeLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return (): void => {
      isDisposed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void wakeLockSentinel?.release();
    };
  }, []);
};
