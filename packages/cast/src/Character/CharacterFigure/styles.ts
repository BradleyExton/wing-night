import type { CharacterPart, CharacterPose } from "../geometry/index.js";

// The figure is the bird itself, so it draws with the bird's own classes;
// this sibling exists because a component entry imports its styles from
// next door, and there is exactly one style table for the hen.
export * from "../styles.js";

// One class per moving part per pose. Every beat is a `cast-*` keyframe in
// the client's index.css turning a part about the pivot the figure wrapped
// it on; the delay rides inside the shorthand because a separate
// `animation-delay` utility loses to the shorthand's reset. `motion-safe`
// because the cast is ambient motion (DESIGN.md §8): a room that asked for
// less of it gets the bird standing still.
const step = "motion-safe:[animation:cast-step_0.5s_ease-in-out_infinite]";

const tuckedLeg = "[transform:rotate(55deg)]";

export const poses: Record<CharacterPose, Partial<Record<CharacterPart, string>>> = {
  still: {},
  idle: {
    body: "motion-safe:[animation:cast-breathe_2.4s_ease-in-out_infinite]",
    head: "motion-safe:[animation:cast-peck_4s_ease-in-out_infinite]",
    tail: "motion-safe:[animation:cast-sway_2.4s_ease-in-out_infinite]"
  },
  walk: {
    legNear: step,
    // The far leg is the near one half a stride behind.
    legFar: "motion-safe:[animation:cast-step_0.5s_ease-in-out_-0.25s_infinite]",
    // Two bobs a stride: the body lifts on every footfall.
    body: "motion-safe:[animation:cast-bob_0.25s_ease-in-out_infinite]",
    head: "motion-safe:[animation:cast-nod_0.5s_ease-in-out_infinite]",
    tail: "motion-safe:[animation:cast-sway_0.5s_ease-in-out_infinite]",
    wing: "motion-safe:[animation:cast-tuck_0.5s_ease-in-out_infinite]"
  },
  fly: {
    legNear: tuckedLeg,
    legFar: tuckedLeg
  }
};
