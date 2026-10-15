import assert from "node:assert/strict";
import test from "node:test";
import type { MinigameRendererBundle } from "@wingnight/minigames-core";
import type { MinigameType } from "@wingnight/shared";

import {
  createMinigameRendererBundleStore,
  MINIGAME_RENDERER_FAILURES_BEFORE_UNAVAILABLE,
  MINIGAME_RENDERER_RETRY_DELAYS_MS,
  resolveRendererRetryDelayMs
} from "./index";

const STUB_RENDERER_BUNDLE = {
  HostSurface: (): null => null,
  DisplaySurface: (): null => null
} as unknown as MinigameRendererBundle;

// A hand-cranked scheduler: the store hands it the retry and a delay, and the
// test decides when time passes. Nothing here waits on a real timer.
const createManualRetryScheduler = (): {
  scheduleRetry: (retry: () => void, delayMs: number) => void;
  pendingDelaysMs: number[];
  runPendingRetry: () => Promise<void>;
} => {
  const pendingRetries: (() => void)[] = [];
  const pendingDelaysMs: number[] = [];

  return {
    scheduleRetry: (retry, delayMs): void => {
      pendingRetries.push(retry);
      pendingDelaysMs.push(delayMs);
    },
    pendingDelaysMs,
    runPendingRetry: async (): Promise<void> => {
      const retry = pendingRetries.shift();

      pendingDelaysMs.shift();
      assert.ok(retry, "no retry was scheduled");
      retry();
      // Let the attempt's promise chain settle.
      await Promise.resolve();
      await Promise.resolve();
    }
  };
};

// The failure this whole module exists for: the chunk request rejects (a
// dropped LAN, or a cached index.html naming a hashed chunk that now 404s).
// Before the retry, one rejection latched forever and the stage stayed blank
// for the rest of the turn.
test("does retry the chunk when the first request rejects", async () => {
  const scheduler = createManualRetryScheduler();
  const requestedTypes: MinigameType[] = [];
  let shouldFail = true;

  const store = createMinigameRendererBundleStore({
    loadRendererBundle: async (minigameType) => {
      requestedTypes.push(minigameType);

      if (shouldFail) {
        throw new Error("chunk 404");
      }

      return STUB_RENDERER_BUNDLE;
    },
    scheduleRetry: scheduler.scheduleRetry
  });

  assert.equal(await store.requestBundle("TRIVIA"), null);
  assert.equal(requestedTypes.length, 1);
  assert.equal(store.peekBundle("TRIVIA"), null);
  assert.equal(store.peekLoad("TRIVIA").status, "loading");

  // A retry is armed rather than left to some later render that never comes.
  assert.deepEqual(scheduler.pendingDelaysMs, [MINIGAME_RENDERER_RETRY_DELAYS_MS[0]]);

  shouldFail = false;
  await scheduler.runPendingRetry();

  assert.equal(requestedTypes.length, 2);
  assert.equal(store.peekBundle("TRIVIA"), STUB_RENDERER_BUNDLE);
  assert.equal(store.peekLoad("TRIVIA").status, "ready");
});

test("does tell subscribers when a retried chunk finally lands", async () => {
  const scheduler = createManualRetryScheduler();
  let shouldFail = true;

  const store = createMinigameRendererBundleStore({
    loadRendererBundle: async () => {
      if (shouldFail) {
        throw new Error("chunk 404");
      }

      return STUB_RENDERER_BUNDLE;
    },
    scheduleRetry: scheduler.scheduleRetry
  });

  let notificationCount = 0;
  const unsubscribe = store.subscribe(() => {
    notificationCount += 1;
  });

  await store.requestBundle("GEO");
  const notificationsBeforeRecovery = notificationCount;

  shouldFail = false;
  await scheduler.runPendingRetry();

  // The re-render that publishes the recovered surface — without it the hook
  // holds the stale null no matter how many snapshots arrive.
  assert.ok(notificationCount > notificationsBeforeRecovery);

  unsubscribe();
  await store.requestBundle("JOUST");
  assert.equal(notificationCount, notificationsBeforeRecovery + 1);
});

// A stage that stays blank forever is the defect. After enough failures the
// surface is given something to say — while the retries keep running.
test("does surface an unavailable state when the chunk keeps failing", async () => {
  const scheduler = createManualRetryScheduler();
  let attemptCount = 0;

  const store = createMinigameRendererBundleStore({
    loadRendererBundle: async () => {
      attemptCount += 1;

      throw new Error("chunk 404");
    },
    scheduleRetry: scheduler.scheduleRetry
  });

  await store.requestBundle("FAPPY");

  while (attemptCount < MINIGAME_RENDERER_FAILURES_BEFORE_UNAVAILABLE) {
    assert.equal(store.peekLoad("FAPPY").status, "loading");
    await scheduler.runPendingRetry();
  }

  assert.equal(store.peekLoad("FAPPY").status, "unavailable");
  assert.equal(store.peekBundle("FAPPY"), null);

  // Still trying, and still saying so: a recovered network must heal the stage
  // on its own, and the message must not flicker back to a blank stage between
  // attempts.
  await scheduler.runPendingRetry();
  assert.equal(attemptCount, MINIGAME_RENDERER_FAILURES_BEFORE_UNAVAILABLE + 1);
  assert.equal(store.peekLoad("FAPPY").status, "unavailable");
  assert.equal(scheduler.pendingDelaysMs.length, 1);
});

test("does recover from the unavailable state when the network comes back", async () => {
  const scheduler = createManualRetryScheduler();
  let shouldFail = true;

  const store = createMinigameRendererBundleStore({
    loadRendererBundle: async () => {
      if (shouldFail) {
        throw new Error("chunk 404");
      }

      return STUB_RENDERER_BUNDLE;
    },
    scheduleRetry: scheduler.scheduleRetry
  });

  await store.requestBundle("DRAWING");

  for (let failure = 1; failure < MINIGAME_RENDERER_FAILURES_BEFORE_UNAVAILABLE; failure += 1) {
    await scheduler.runPendingRetry();
  }

  assert.equal(store.peekLoad("DRAWING").status, "unavailable");

  shouldFail = false;
  await scheduler.runPendingRetry();

  assert.equal(store.peekLoad("DRAWING").status, "ready");
  assert.equal(store.peekBundle("DRAWING"), STUB_RENDERER_BUNDLE);
});

// The prefetch and the surface share one request. Before, a rejection satisfied
// both and neither re-armed; now they must not race into two competing fetches
// either.
test("does not start a second request when a retry is already armed", async () => {
  const scheduler = createManualRetryScheduler();
  let attemptCount = 0;

  const store = createMinigameRendererBundleStore({
    loadRendererBundle: async () => {
      attemptCount += 1;

      throw new Error("chunk 404");
    },
    scheduleRetry: scheduler.scheduleRetry
  });

  await store.requestBundle("RECREATE");
  assert.equal(attemptCount, 1);

  // Every room-state snapshot re-runs the surface's effect. None of them may
  // open a parallel fetch while the armed retry is waiting.
  assert.equal(await store.requestBundle("RECREATE"), null);
  assert.equal(await store.requestBundle("RECREATE"), null);
  assert.equal(attemptCount, 1);
  assert.equal(scheduler.pendingDelaysMs.length, 1);
});

test("does join the request in flight when two callers ask at once", async () => {
  let attemptCount = 0;

  const store = createMinigameRendererBundleStore({
    loadRendererBundle: async () => {
      attemptCount += 1;

      return STUB_RENDERER_BUNDLE;
    },
    scheduleRetry: () => {}
  });

  const [first, second] = await Promise.all([
    store.requestBundle("SONG_GUESS"),
    store.requestBundle("SONG_GUESS")
  ]);

  assert.equal(attemptCount, 1);
  assert.equal(first, STUB_RENDERER_BUNDLE);
  assert.equal(second, STUB_RENDERER_BUNDLE);
});

test("does back off between retries and settle on the longest delay", () => {
  assert.deepEqual(
    MINIGAME_RENDERER_RETRY_DELAYS_MS.map((_delayMs, index) =>
      resolveRendererRetryDelayMs(index + 1)
    ),
    [...MINIGAME_RENDERER_RETRY_DELAYS_MS]
  );

  const longestDelayMs =
    MINIGAME_RENDERER_RETRY_DELAYS_MS[MINIGAME_RENDERER_RETRY_DELAYS_MS.length - 1];

  assert.equal(resolveRendererRetryDelayMs(40), longestDelayMs);
  assert.ok(
    MINIGAME_RENDERER_RETRY_DELAYS_MS.every(
      (delayMs, index) => index === 0 || delayMs > (MINIGAME_RENDERER_RETRY_DELAYS_MS[index - 1] ?? 0)
    ),
    "retry delays must grow so a dead server is not hammered"
  );
});

test("does report an idle load for a minigame nobody has asked for", () => {
  const store = createMinigameRendererBundleStore({
    loadRendererBundle: async () => STUB_RENDERER_BUNDLE,
    scheduleRetry: () => {}
  });

  assert.equal(store.peekLoad("EMOJI_CHARADES").status, "idle");
  assert.equal(store.peekBundle("EMOJI_CHARADES"), null);
  // Identity is stable so a subscriber can compare snapshots by reference.
  assert.equal(store.peekLoad("EMOJI_CHARADES"), store.peekLoad("TRIVIA"));
});
