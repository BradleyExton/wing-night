import { useEffect, useState } from "react";
import type { MinigameRendererBundle } from "@wingnight/minigames-core";
import type { MinigameType } from "@wingnight/shared";

import { loadMinigameRendererBundle, peekMinigameRendererBundle } from "../registry";

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
// Calling this hook is also how a surface's chunk is PREFETCHED: the shells call
// it with the round's minigame as soon as room state names one, phases before
// anything renders the surface.
export const useMinigameRendererBundle = (
  minigameType: MinigameType | null
): MinigameRendererBundle | null => {
  // Read during render, not in a useState initializer: a mounted surface whose
  // minigameType changes must not answer with the previous game's bundle for a
  // frame. The cache is monotonic (null, then a bundle, forever), and the effect
  // below is only there to ask for the re-render that publishes the change.
  const rendererBundle =
    minigameType === null ? null : peekMinigameRendererBundle(minigameType);
  const [, setLoadedRevision] = useState(0);

  useEffect(() => {
    if (minigameType === null || rendererBundle !== null) {
      return;
    }

    let isCancelled = false;

    void loadMinigameRendererBundle(minigameType).then(() => {
      if (!isCancelled) {
        setLoadedRevision((loadedRevision) => loadedRevision + 1);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [minigameType, rendererBundle]);

  return rendererBundle;
};
