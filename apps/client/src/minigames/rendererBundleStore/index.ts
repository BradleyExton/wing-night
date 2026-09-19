import type { MinigameRendererBundle } from "@wingnight/minigames-core";
import type { MinigameType } from "@wingnight/shared";

// The load state of one minigame's renderer chunk, and the retry policy around
// it.
//
// A chunk can simply fail: the house Wi-Fi drops for a second, or the TV was
// refreshed against a cached index.html that names the previous build's hashed
// chunk, which now 404s. Before this store, one rejection latched forever — the
// surface re-rendered on every room-state snapshot and none of those renders
// asked again, so the stage stayed blank for the whole turn.
//
// So: every failure schedules another attempt, and the attempts never stop.
//
// A caveat worth writing down, because it was measured rather than assumed: the
// browser's module map caches a FAILED import for the life of the page, in both
// a Vite dev server and a production build (verified by aborting a renderer
// chunk request in Chromium — the retry issues no second request). So a retry
// heals only the failures that never reached the module fetch, and a chunk that
// truly 404'd is dead until the page reloads. The retries stay because they are
// free and they do win the cases they can; the `unavailable` status is what
// covers the rest, and the copy behind it names the refresh.

export type MinigameRendererLoadStatus =
  // Nothing has asked for this renderer yet.
  | "idle"
  // On the wire, or waiting out a retry delay. The surface draws nothing: the
  // chunk is a LAN fetch away and a spinner would be gone before the room read it.
  | "loading"
  | "ready"
  // Still retrying, but it has failed enough times that silence is a worse
  // answer than a message. The surface says so instead of staying blank.
  | "unavailable";

export type MinigameRendererLoad = {
  status: MinigameRendererLoadStatus;
  rendererBundle: MinigameRendererBundle | null;
};

// Snapshot identities are stable per state so a subscriber can compare by
// reference (`useSyncExternalStore` requires it).
export const IDLE_MINIGAME_RENDERER_LOAD: MinigameRendererLoad = {
  status: "idle",
  rendererBundle: null
};

const LOADING_MINIGAME_RENDERER_LOAD: MinigameRendererLoad = {
  status: "loading",
  rendererBundle: null
};

const UNAVAILABLE_MINIGAME_RENDERER_LOAD: MinigameRendererLoad = {
  status: "unavailable",
  rendererBundle: null
};

// Delay before attempt N+1, by failure count; the last entry repeats forever.
// The front of the schedule is quick because the usual cause is a blip and the
// room is watching a stage that has not filled in yet; the tail settles at ten
// seconds so a server that is genuinely down is not hammered for the rest of
// the night.
export const MINIGAME_RENDERER_RETRY_DELAYS_MS: readonly number[] = [
  400, 1_200, 3_500, 10_000
];

// Two failures still look like a slow network. By the third the room deserves
// to be told — a stage that stays blank and silent for a whole turn is the
// defect this exists to end.
export const MINIGAME_RENDERER_FAILURES_BEFORE_UNAVAILABLE = 3;

type ScheduleRendererRetry = (retry: () => void, delayMs: number) => void;

type CreateMinigameRendererBundleStoreOptions = {
  loadRendererBundle: (minigameType: MinigameType) => Promise<MinigameRendererBundle>;
  // Injectable so the failure path is testable without real time passing; the
  // registry leaves it alone and gets `setTimeout`.
  scheduleRetry?: ScheduleRendererRetry;
};

export type MinigameRendererBundleStore = {
  peekLoad: (minigameType: MinigameType) => MinigameRendererLoad;
  peekBundle: (minigameType: MinigameType) => MinigameRendererBundle | null;
  requestBundle: (
    minigameType: MinigameType
  ) => Promise<MinigameRendererBundle | null>;
  subscribe: (listener: () => void) => () => void;
};

type RendererLoadEntry = {
  load: MinigameRendererLoad;
  failureCount: number;
  inFlightLoad: Promise<MinigameRendererBundle | null> | null;
  isRetryScheduled: boolean;
};

const defaultScheduleRetry: ScheduleRendererRetry = (retry, delayMs) => {
  setTimeout(retry, delayMs);
};

export const resolveRendererRetryDelayMs = (failureCount: number): number => {
  const lastDelayMs =
    MINIGAME_RENDERER_RETRY_DELAYS_MS[MINIGAME_RENDERER_RETRY_DELAYS_MS.length - 1] ?? 0;

  return MINIGAME_RENDERER_RETRY_DELAYS_MS[failureCount - 1] ?? lastDelayMs;
};

export const createMinigameRendererBundleStore = ({
  loadRendererBundle,
  scheduleRetry = defaultScheduleRetry
}: CreateMinigameRendererBundleStoreOptions): MinigameRendererBundleStore => {
  const entryByMinigameType = new Map<MinigameType, RendererLoadEntry>();
  const listeners = new Set<() => void>();

  const readEntry = (minigameType: MinigameType): RendererLoadEntry => {
    const existingEntry = entryByMinigameType.get(minigameType);

    if (existingEntry !== undefined) {
      return existingEntry;
    }

    const createdEntry: RendererLoadEntry = {
      load: IDLE_MINIGAME_RENDERER_LOAD,
      failureCount: 0,
      inFlightLoad: null,
      isRetryScheduled: false
    };

    entryByMinigameType.set(minigameType, createdEntry);

    return createdEntry;
  };

  const publish = (entry: RendererLoadEntry, load: MinigameRendererLoad): void => {
    if (
      entry.load.status === load.status &&
      entry.load.rendererBundle === load.rendererBundle
    ) {
      return;
    }

    entry.load = load;

    for (const listener of listeners) {
      listener();
    }
  };

  // Once a renderer has failed enough times the surface says so, and it keeps
  // saying so while the retries run. Flipping back to `loading` for every
  // attempt would blank the stage again on a three-second cycle.
  const resolvePendingLoad = (entry: RendererLoadEntry): MinigameRendererLoad => {
    return entry.failureCount >= MINIGAME_RENDERER_FAILURES_BEFORE_UNAVAILABLE
      ? UNAVAILABLE_MINIGAME_RENDERER_LOAD
      : LOADING_MINIGAME_RENDERER_LOAD;
  };

  const attemptLoad = (
    minigameType: MinigameType
  ): Promise<MinigameRendererBundle | null> => {
    const entry = readEntry(minigameType);

    entry.isRetryScheduled = false;
    publish(entry, resolvePendingLoad(entry));

    const attempt = loadRendererBundle(minigameType)
      .then((rendererBundle) => {
        entry.inFlightLoad = null;
        entry.failureCount = 0;
        publish(entry, { status: "ready", rendererBundle });

        return rendererBundle;
      })
      .catch(() => {
        entry.inFlightLoad = null;
        entry.failureCount += 1;
        publish(entry, resolvePendingLoad(entry));

        if (!entry.isRetryScheduled) {
          entry.isRetryScheduled = true;
          scheduleRetry(() => {
            void attemptLoad(minigameType);
          }, resolveRendererRetryDelayMs(entry.failureCount));
        }

        return null;
      });

    entry.inFlightLoad = attempt;

    return attempt;
  };

  return {
    // Deliberately non-creating: it is read during render, so it must not
    // mutate the store.
    peekLoad: (minigameType) =>
      entryByMinigameType.get(minigameType)?.load ?? IDLE_MINIGAME_RENDERER_LOAD,
    peekBundle: (minigameType) =>
      entryByMinigameType.get(minigameType)?.load.rendererBundle ?? null,
    requestBundle: (minigameType) => {
      const entry = readEntry(minigameType);

      if (entry.load.rendererBundle !== null) {
        return Promise.resolve(entry.load.rendererBundle);
      }

      // Idempotent in both directions: a second caller joins the request in
      // flight, and a caller arriving between a failure and its retry waits for
      // that retry rather than starting a competing one.
      if (entry.inFlightLoad !== null) {
        return entry.inFlightLoad;
      }

      if (entry.isRetryScheduled) {
        return Promise.resolve(null);
      }

      return attemptLoad(minigameType);
    },
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    }
  };
};
