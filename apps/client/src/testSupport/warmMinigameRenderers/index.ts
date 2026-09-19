import { MINIGAME_TYPES } from "@wingnight/shared";

import { loadMinigameRendererBundle } from "../../minigames/registry";

// Renderer bundles arrive over a dynamic import, so a surface only draws once
// its chunk has landed. A markup test renders in one synchronous pass and has
// no effects to wait on, so it stands in for the state a real party is always
// in by the time a surface mounts: the shells prefetch the round's renderer
// when the room names the game, phases before MINIGAME_PLAY.
//
// Call it from a `before` hook in any suite that asserts on a minigame's own
// markup. Without it the suite is asserting on the pre-chunk placeholder.
export const warmMinigameRenderers = async (): Promise<void> => {
  await Promise.all(
    MINIGAME_TYPES.map((minigameType) => loadMinigameRendererBundle(minigameType))
  );
};
