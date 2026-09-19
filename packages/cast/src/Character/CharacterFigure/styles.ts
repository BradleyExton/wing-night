import type { CharacterDance } from "../../resolvePlayerAppearance/index.js";
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

export const poses: Record<Exclude<CharacterPose, "dance">, Partial<Record<CharacterPart, string>>> = {
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

// The dances. Each is two states of the same parts: at rest, and on the beat.
// A `group/beat` ancestor (the display root) flips `data-beat` on every kick,
// and the part transitions between the two — so the music's own beat, not a
// keyframe clock, is what moves a dancing bird, and every bird on the floor
// lands the step together.
const groove = "transition-transform duration-150 ease-out";

export const dances: Record<CharacterDance, Partial<Record<CharacterPart, string>>> = {
  bounce: {
    body: `${groove} group-data-[beat=1]/beat:[transform:translateY(-2.5px)]`,
    head: `${groove} group-data-[beat=1]/beat:[transform:rotate(-7deg)]`,
    wing: `${groove} group-data-[beat=1]/beat:[transform:rotate(-14deg)]`,
    legNear: `${groove} group-data-[beat=1]/beat:[transform:rotate(-8deg)]`
  },
  headbang: {
    body: `${groove} group-data-[beat=1]/beat:[transform:translateY(-1px)]`,
    head: `${groove} group-data-[beat=1]/beat:[transform:rotate(28deg)]`,
    tail: `${groove} group-data-[beat=1]/beat:[transform:rotate(6deg)]`
  },
  flap: {
    body: `${groove} group-data-[beat=1]/beat:[transform:translateY(-3px)]`,
    head: `${groove} group-data-[beat=1]/beat:[transform:rotate(-4deg)]`,
    wing: `${groove} group-data-[beat=1]/beat:[transform:rotate(-45deg)]`,
    legNear: `${groove} group-data-[beat=1]/beat:[transform:rotate(20deg)]`,
    legFar: `${groove} group-data-[beat=1]/beat:[transform:rotate(20deg)]`
  },
  shuffle: {
    body: `${groove} group-data-[beat=1]/beat:[transform:translateX(2px)_rotate(-4deg)]`,
    head: `${groove} group-data-[beat=1]/beat:[transform:rotate(6deg)]`,
    tail: `${groove} group-data-[beat=1]/beat:[transform:rotate(-8deg)]`,
    legNear: `${groove} group-data-[beat=1]/beat:[transform:rotate(-22deg)]`,
    legFar: `${groove} group-data-[beat=1]/beat:[transform:rotate(22deg)]`
  }
};
