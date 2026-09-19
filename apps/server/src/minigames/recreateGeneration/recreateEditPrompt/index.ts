// Leaf on purpose: no imports, so `pnpm import:recreate` (plain Node, no
// loader) can pull it in beside the party-time forger and both send the same
// words. Targets and attempts are then edits from one pipeline, which is what
// makes them comparable on the TV.

// Where the night's forgeries land, pack-relative: under `local/assets/` so the
// existing CONTENT_ASSET_ROUTE_PATH mount serves them with no new route, and
// so they outlive the process — the funniest ones are the keepsake.
export const RECREATE_ATTEMPTS_PACK_PATH = "recreate/attempts";

// Where the authored targets land, same reasoning.
export const RECREATE_TARGETS_PACK_PATH = "recreate/targets";

// Wraps the prompt so the model edits the photo rather than describing it
// back, and keeps the people in it recognisable — the joke only lands if it is
// still obviously them.
export const composeRecreateEditPrompt = (prompt: string): string => {
  return [
    "Edit the attached photo so that it matches this description, keeping the same people, their faces and the framing recognisable:",
    prompt,
    "Photorealistic. No text, captions or watermarks."
  ].join("\n\n");
};
