import assert from "node:assert/strict";
import test from "node:test";

import {
  CRASH_RECOVERY_DELAY_MS,
  CRASH_RECOVERY_STORAGE_KEY,
  scheduleCrashRecoveryReload
} from "./index";

const createMemoryStorage = (
  seed: Record<string, string> = {}
): Pick<Storage, "getItem" | "setItem"> => {
  const entries = new Map(Object.entries(seed));

  return {
    getItem: (key): string | null => entries.get(key) ?? null,
    setItem: (key, value): void => {
      entries.set(key, value);
    }
  };
};

const createRecorder = (): {
  reload: () => void;
  schedule: (run: () => void, delayMs: number) => void;
  scheduledDelaysMs: number[];
  reloadCount: () => number;
  runScheduled: () => void;
} => {
  const scheduledRuns: (() => void)[] = [];
  const scheduledDelaysMs: number[] = [];
  let reloadCount = 0;

  return {
    reload: (): void => {
      reloadCount += 1;
    },
    schedule: (run, delayMs): void => {
      scheduledRuns.push(run);
      scheduledDelaysMs.push(delayMs);
    },
    scheduledDelaysMs,
    reloadCount: (): number => reloadCount,
    runScheduled: (): void => {
      for (const run of scheduledRuns.splice(0)) {
        run();
      }
    }
  };
};

// The TV boots from a cached index.html naming a hashed chunk that now 404s:
// one reload re-fetches index.html and the night carries on, without anyone
// walking over to a screen that has no keyboard.
test("does schedule one reload when the app crashes for the first time", () => {
  const crashRecoveryStorage = createMemoryStorage();
  const recorder = createRecorder();

  const isScheduled = scheduleCrashRecoveryReload({
    crashRecoveryStorage,
    reload: recorder.reload,
    schedule: recorder.schedule
  });

  assert.equal(isScheduled, true);
  assert.deepEqual(recorder.scheduledDelaysMs, [CRASH_RECOVERY_DELAY_MS]);
  assert.equal(recorder.reloadCount(), 0);

  recorder.runScheduled();

  assert.equal(recorder.reloadCount(), 1);
  assert.equal(
    crashRecoveryStorage.getItem(CRASH_RECOVERY_STORAGE_KEY) !== null,
    true
  );
});

// The guard that keeps a deterministic crash from turning a 55" screen into a
// boot loop: the mark survives exactly the reload it authorised.
test("does not schedule a second reload when the page has already recovered once", () => {
  const crashRecoveryStorage = createMemoryStorage();
  const firstRecorder = createRecorder();

  scheduleCrashRecoveryReload({
    crashRecoveryStorage,
    reload: firstRecorder.reload,
    schedule: firstRecorder.schedule
  });

  const secondRecorder = createRecorder();
  const isScheduled = scheduleCrashRecoveryReload({
    crashRecoveryStorage,
    reload: secondRecorder.reload,
    schedule: secondRecorder.schedule
  });

  assert.equal(isScheduled, false);
  assert.deepEqual(secondRecorder.scheduledDelaysMs, []);
});

test("does not schedule a reload when there is no storage to guard it with", () => {
  const recorder = createRecorder();

  const isScheduled = scheduleCrashRecoveryReload({
    crashRecoveryStorage: null,
    reload: recorder.reload,
    schedule: recorder.schedule
  });

  assert.equal(isScheduled, false);
  assert.deepEqual(recorder.scheduledDelaysMs, []);
});

// Private browsing and blocked site data throw on write, not on access. An
// unguarded reload is the loop this refuses to start.
test("does not schedule a reload when writing the guard throws", () => {
  const recorder = createRecorder();

  const isScheduled = scheduleCrashRecoveryReload({
    crashRecoveryStorage: {
      getItem: (): string | null => null,
      setItem: (): void => {
        throw new Error("storage is blocked");
      }
    },
    reload: recorder.reload,
    schedule: recorder.schedule
  });

  assert.equal(isScheduled, false);
  assert.deepEqual(recorder.scheduledDelaysMs, []);
});
