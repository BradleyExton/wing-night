// One automatic reload after the app crashes, and never two.
//
// The crash this exists for is a route chunk that did not arrive: the TV boots
// from a cached index.html naming the previous build's hashed chunk, the import
// rejects, and React unmounts. A single reload re-fetches index.html and fixes
// it — and nobody has to walk to the TV, which is the whole point on a screen
// with no keyboard in front of it.
//
// The guard is the other half. A crash that reproduces on every render would
// otherwise reload forever, and a 55" screen stuck in a boot loop is worse than
// one showing a message. sessionStorage is the right place for the mark: it
// survives exactly the reload it is guarding and nothing else — a fresh tab, or
// the next party, starts clean.

export const CRASH_RECOVERY_STORAGE_KEY = "wingnight:crashRecoveryReload";

// Long enough that the notice is read as an explanation rather than a flicker,
// short enough that the room is not staring at it.
export const CRASH_RECOVERY_DELAY_MS = 4_000;

type CrashRecoveryStorage = Pick<Storage, "getItem" | "setItem">;

type ScheduleCrashRecoveryReloadOptions = {
  crashRecoveryStorage: CrashRecoveryStorage | null;
  reload: () => void;
  schedule: (run: () => void, delayMs: number) => void;
  delayMs: number;
};

const resolveCrashRecoveryStorage = (): CrashRecoveryStorage | null => {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    // Private browsing and blocked site data both throw on the property access.
    return null;
  }
};

// Returns whether a reload was actually scheduled, so the crash notice can
// promise a reload only when one is coming and otherwise ask for a manual
// refresh. A notice that says "bringing it back" and then does not is worse
// than one that asks for help.
export const scheduleCrashRecoveryReload = ({
  crashRecoveryStorage = resolveCrashRecoveryStorage(),
  reload = (): void => {
    window.location.reload();
  },
  schedule = (run, delayMs): void => {
    setTimeout(run, delayMs);
  },
  delayMs = CRASH_RECOVERY_DELAY_MS
}: Partial<ScheduleCrashRecoveryReloadOptions> = {}): boolean => {
  // No storage means no guard, and an unguarded auto-reload can loop. The
  // notice asks for a manual refresh instead.
  if (crashRecoveryStorage === null) {
    return false;
  }

  try {
    if (crashRecoveryStorage.getItem(CRASH_RECOVERY_STORAGE_KEY) !== null) {
      return false;
    }

    crashRecoveryStorage.setItem(CRASH_RECOVERY_STORAGE_KEY, String(Date.now()));
  } catch {
    return false;
  }

  schedule(reload, delayMs);

  return true;
};
