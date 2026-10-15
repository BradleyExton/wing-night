import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { MinigameType } from "@wingnight/shared";

import {
  loadMinigameRendererBundle,
  peekMinigameRendererLoad,
  subscribeToMinigameRendererLoads
} from "../registry";
import {
  IDLE_MINIGAME_RENDERER_LOAD,
  type MinigameRendererLoad
} from "../rendererBundleStore";

// The lazy boundary for a minigame's renderer, and deliberately NOT React.lazy.
//
// React.lazy suspends on the first render of its component even when the module
// is already in the import cache: the payload only leaves Pending after the
// initializer's thenable settles, a microtask later. On the TV that first render
// is MINIGAME_PLAY — StageSurface mounts the display surface in the play stage
// mode and nowhere else — and it is driven by a socket snapshot, a default-lane
// update, where React commits the Suspense fallback rather than retrying. That
// is a blank stage in front of the room at the exact moment the game starts.
//
// Reading a warm module synchronously removes the possibility instead of making
// it unlikely: if the chunk landed during ROUND_INTRO/EATING, the surface's
// first render already has the real component, so there is no suspend, no
// boundary, and no fallback to flash.
//
// React.lazy is also unusable for the OTHER reason this hook exists: it caches
// its rejection, so a chunk that failed once can never load again on that page.
// The registry's store retries instead, and this hook subscribes so a retry that
// lands re-renders the surface that was waiting on it.
//
// Calling this hook is also how a surface's chunk is PREFETCHED: the shells call
// it with the round's minigame as soon as room state names one, phases before
// anything renders the surface.
export const useMinigameRendererBundle = (
  minigameType: MinigameType | null
): MinigameRendererLoad => {
  // Read during render, not in a useState initializer: a mounted surface whose
  // minigameType changes must not answer with the previous game's bundle for a
  // frame. useSyncExternalStore is what makes that safe — it reads the store on
  // every render and subscribes for the re-render that publishes a change,
  // without the missed-update window a plain effect would leave open.
  const subscribe = useCallback(
    (onStoreChange: () => void): (() => void) => {
      if (minigameType === null) {
        return () => {};
      }

      return subscribeToMinigameRendererLoads(onStoreChange);
    },
    [minigameType]
  );

  const readLoad = useCallback((): MinigameRendererLoad => {
    return minigameType === null
      ? IDLE_MINIGAME_RENDERER_LOAD
      : peekMinigameRendererLoad(minigameType);
  }, [minigameType]);

  // The same reader serves the server pass: a markup render has no effects, so
  // whatever the store already holds is what it must draw.
  const rendererLoad = useSyncExternalStore(subscribe, readLoad, readLoad);

  useEffect(() => {
    if (minigameType === null) {
      return;
    }

    // Idempotent, and safe to call on every mount and every minigame change:
    // a warm bundle resolves immediately, a request in flight is joined, and a
    // failed one is either already retrying or starts again here.
    void loadMinigameRendererBundle(minigameType);
  }, [minigameType]);

  return rendererLoad;
};
