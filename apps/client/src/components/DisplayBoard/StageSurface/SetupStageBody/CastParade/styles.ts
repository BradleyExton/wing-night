// The strip matches the floor the stage body reserves for it
// (SetupStageBody/styles `container` padding-bottom), so the birds never walk
// behind the round cards however tall the lineup gets.
export const container =
  "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[clamp(6rem,14vh,17rem)] overflow-visible";

export const unassignedFill = "text-mutedWarm";

// A group is a row of birds pinned to one edge of the floor and slid on and
// off it with a transform: the walk is the transition (linear, the length of
// the `enter`/`exit` beats in resolveParadeFrame — change them together) and
// the birds walk in place inside it (the cast's `walk` pose). Character
// height, not width, is the legibility knob: 12vh is ~130px at 1080p and
// ~240px (the cap) on a 4K TV; the bird is a bobblehead, so this puts a
// costume head at roughly 80px at 1080p, which is what it takes to tell whose
// face it is from the couch. Birds in a row overlap by a little, as a huddle
// does, so a team of six still fits its half of the floor.
const groupBase =
  "absolute bottom-0 flex h-[clamp(5rem,12vh,15rem)] items-end -space-x-[2.5vw] will-change-transform transition-transform duration-[3200ms] ease-linear motion-reduce:transition-none";

export const groupLeft = `${groupBase} left-0`;

export const groupRight = `${groupBase} right-0`;

// Off the edge is a whole group-width past it, whatever the group's width.
export const groupLeftOffstage = "-translate-x-full";

export const groupLeftOnstage = "translate-x-[6vw]";

export const groupRightOffstage = "translate-x-full";

export const groupRightOnstage = "-translate-x-[6vw]";

export const member = "relative block h-full";

// The drawing faces right; a bird walking left, or dancing on the right
// side facing its opposite number, is the same bird mirrored.
export const memberFacingLeft = "-scale-x-100";

// Inside the member, so the bounce composes with that mirror rather than
// overwriting it — an animation's transform beats a utility's, and a bird
// that lost its flip would dance with its back to the room.
export const jive = "block h-full";

// Off its feet: a hop, a lean and a little wander, at this bird's own tempo
// and phase (`--cast-jive-*` from the cast's `resolveCharacterGroove`, set on the
// member). `origin-bottom` puts the pivot on the floor, so a lean is a lean
// and not the whole bird swinging. Only while the pair is DANCING — the walk
// on and off is the group's own transform and wants no wobble under it.
export const jiveDancing =
  "block h-full origin-bottom will-change-transform motion-safe:[animation:cast-jive_var(--cast-jive-ms,820ms)_ease-in-out_var(--cast-jive-delay,0ms)_infinite]";

// The pool of shade under a bird, the same depth cue JOUST draws on the sand
// (DESIGN.md §2.7): without it the floor is a strip of stickers pasted on the
// flame, and with it the row is standing on the deck. It hangs on the MEMBER,
// outside the jive layer, so a hop lifts the bird off a shadow that stays put.
//
// The bird is drawn facing right in an 80x72 box with its feet at x=38, so the
// pool is centred a touch left of the box's middle; the mirror on a left-facing
// bird carries it over with the feet. It is placed with insets rather than a
// centring translate because the dancing variant owns `transform` outright —
// an animation replaces a utility's transform, and a pool that lost its
// centring would slide out from under the bird on every hop. `bg` is the
// cast's own outline ink, the same dark JOUST pools on the sand. Blurred
// rather than soft-edged: a gradient this small bands on a large panel.
const shadowBase =
  "pointer-events-none absolute bottom-0 left-[25%] right-[30%] h-[clamp(0.35rem,0.8vh,0.85rem)] rounded-[50%] bg-bg opacity-[0.6] blur-[4px]";

export const shadow = shadowBase;

// Dancing, it answers the bird's own bounce on the bird's own clock
// (`--cast-jive-*` from the cast's groove, set on the member) — the same
// variables `cast-jive` itself reads, so the two can never fall out of step.
export const shadowDancing = `${shadowBase} will-change-transform motion-safe:[animation:cast-jive-shadow_var(--cast-jive-ms,820ms)_ease-in-out_var(--cast-jive-delay,0ms)_infinite]`;
