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
//
// A walking bird's stride is phased by `--cast-step-phase` (the cast's
// `resolveCharacterGroove`, inherited from whatever a surface wraps the bird in),
// so a group walking on together does not drum its feet in unison. Nothing
// sets it and the phases fall back to the plain stride.
// Tailwind only ever sees class names it can read WHOLE in the source, so
// every one of these is written out: a built string would never be generated.
const strideLegNear =
  "motion-safe:[animation:cast-step_0.5s_ease-in-out_var(--cast-step-phase,0ms)_infinite]";

const strideLegFar =
  "motion-safe:[animation:cast-step_0.5s_ease-in-out_var(--cast-step-phase-far,-0.25s)_infinite]";

const tuckedLeg = "[transform:rotate(55deg)]";

export const poses: Record<Exclude<CharacterPose, "dance">, Partial<Record<CharacterPart, string>>> = {
  still: {},
  idle: {
    body: "motion-safe:[animation:cast-breathe_2.4s_ease-in-out_infinite]",
    head: "motion-safe:[animation:cast-peck_4s_ease-in-out_infinite]",
    tail: "motion-safe:[animation:cast-sway_2.4s_ease-in-out_infinite]"
  },
  walk: {
    legNear: strideLegNear,
    // The far leg is the near one half a stride behind — at this bird's own
    // phase, which is what `--cast-step-phase-far` carries.
    legFar: strideLegFar,
    // Two bobs a stride: the body lifts on every footfall.
    body: "motion-safe:[animation:cast-bob_0.25s_ease-in-out_var(--cast-step-phase,0ms)_infinite]",
    head: "motion-safe:[animation:cast-nod_0.5s_ease-in-out_var(--cast-step-phase,0ms)_infinite]",
    tail: "motion-safe:[animation:cast-sway_0.5s_ease-in-out_var(--cast-step-phase,0ms)_infinite]",
    wing: "motion-safe:[animation:cast-tuck_0.5s_ease-in-out_var(--cast-step-phase,0ms)_infinite]"
  },
  fly: {
    legNear: tuckedLeg,
    legFar: tuckedLeg
  }
};

// How hard a bird lands the beat, and how late. Both are the bird's own
// (`resolveCharacterGroove`), written as ONE shorthand so a utility's own
// duration can never win against the variable; a surface that sets neither
// gets the house 150ms on the beat.
const groove =
  "[transition:transform_var(--cast-groove-ms,150ms)_ease-out_var(--cast-groove-delay,0ms)]";

// The dances. Each is two states of the same parts: at rest, and on the beat.
// A `group/beat` ancestor (the display root) flips `data-beat` on every kick,
// and the part transitions between the two — so the music's own beat, not a
// keyframe clock, is what moves a dancing bird, and the whole floor is dancing
// to the song the room is hearing. The step is BIG — a bird at 12vh on a TV
// across a room has a few degrees of a wing to say anything with, so the beat
// throws its whole head and wing, not a nudge. WHEN it lands that beat is its
// own (`--cast-groove-delay`), and what it does between beats is the jig below.
export const dances: Record<CharacterDance, Partial<Record<CharacterPart, string>>> = {
  bounce: {
    body: `${groove} group-data-[beat=1]/beat:[transform:translateY(-4.5px)]`,
    head: `${groove} group-data-[beat=1]/beat:[transform:rotate(-13deg)]`,
    wing: `${groove} group-data-[beat=1]/beat:[transform:rotate(-26deg)]`,
    legNear: `${groove} group-data-[beat=1]/beat:[transform:rotate(-16deg)]`
  },
  headbang: {
    body: `${groove} group-data-[beat=1]/beat:[transform:translateY(-2.5px)]`,
    head: `${groove} group-data-[beat=1]/beat:[transform:rotate(38deg)]`,
    tail: `${groove} group-data-[beat=1]/beat:[transform:rotate(12deg)]`
  },
  flap: {
    body: `${groove} group-data-[beat=1]/beat:[transform:translateY(-5px)]`,
    head: `${groove} group-data-[beat=1]/beat:[transform:rotate(-8deg)]`,
    wing: `${groove} group-data-[beat=1]/beat:[transform:rotate(-62deg)]`,
    legNear: `${groove} group-data-[beat=1]/beat:[transform:rotate(26deg)]`,
    legFar: `${groove} group-data-[beat=1]/beat:[transform:rotate(26deg)]`
  },
  shuffle: {
    body: `${groove} group-data-[beat=1]/beat:[transform:translateX(4px)_rotate(-8deg)]`,
    head: `${groove} group-data-[beat=1]/beat:[transform:rotate(10deg)]`,
    tail: `${groove} group-data-[beat=1]/beat:[transform:rotate(-14deg)]`,
    legNear: `${groove} group-data-[beat=1]/beat:[transform:rotate(-30deg)]`,
    legFar: `${groove} group-data-[beat=1]/beat:[transform:rotate(30deg)]`
  }
};

// The jig: a loop that runs UNDER the beat pose, on nobody's clock but the
// bird's own (`--cast-jig-*` / `--cast-jive-*`, from `resolveCharacterGroove`).
// The beat is what the room hears and every bird still answers it; the jig is
// what stops a floor of them from reading as a chorus line — quick feet that
// never quite agree, a tail or a wing going at its own tempo. The figure hangs
// these on a layer of their own around each part, because a part can carry one
// transform at a time and its beat pose is already using it.
const jigFeet =
  "motion-safe:[animation:cast-jig-feet_var(--cast-jig-ms,280ms)_ease-in-out_var(--cast-jig-delay,0ms)_infinite]";

// The other foot: a shape of its own rather than the same one delayed, so the
// two feet cross and scuff instead of marching.
const jigFeetOff =
  "motion-safe:[animation:cast-jig-feet-off_var(--cast-jig-ms,280ms)_ease-in-out_var(--cast-jig-delay,0ms)_infinite]";

const jigHop =
  "motion-safe:[animation:cast-jig-hop_var(--cast-jive-ms,820ms)_ease-in-out_var(--cast-jive-delay,0ms)_infinite]";

const jigTail =
  "motion-safe:[animation:cast-jig-tail_var(--cast-jive-ms,820ms)_ease-in-out_var(--cast-jive-delay,0ms)_infinite]";

const jigWing =
  "motion-safe:[animation:cast-jig-wing_var(--cast-jig-ms,280ms)_ease-in-out_var(--cast-jig-delay,0ms)_infinite]";

// Every dance has quick feet — that is what dancing looks like from the couch
// at 3% of a TV's height — and one flourish of its own on top.
export const danceJigs: Record<CharacterDance, Partial<Record<CharacterPart, string>>> = {
  bounce: { legNear: jigFeet, legFar: jigFeetOff, tail: jigTail },
  headbang: { legNear: jigFeet, legFar: jigFeetOff, wing: jigWing },
  flap: { legNear: jigFeetOff, legFar: jigFeet, body: jigHop },
  shuffle: { legNear: jigFeetOff, legFar: jigFeet, tail: jigTail, body: jigHop }
};
