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
// face it is from the couch.
//
// The row stands a little off the strip's floor: a worn Stage is drawn in
// perspective round the feet and reaches about ten bird units below them (a
// Prop dips as far at the bottom of a dance), and the stage body clips at its
// own bottom edge, where the standings deck paints over anything that
// crosses it. Ten of the box's 72 units, on the same clamp as the height.
const groupBase =
  "absolute flex items-end will-change-transform transition-transform duration-[3200ms] ease-linear motion-reduce:transition-none";

const groupPaired = `${groupBase} bottom-[clamp(0.7rem,1.67vh,2.1rem)] h-[clamp(5rem,12vh,15rem)]`;

export const groupLeft = `${groupPaired} left-0`;

export const groupRight = `${groupPaired} right-0`;

// Off the edge is a whole group-width past it, whatever the group's width.
export const groupLeftOffstage = "-translate-x-full";

export const groupLeftOnstage = "translate-x-[6vw]";

export const groupRightOffstage = "translate-x-full";

export const groupRightOnstage = "-translate-x-[6vw]";

// A solo group has the whole floor: it walks in from one edge, dances in the
// middle, and walks back out the way it came. Its birds huddle close — the
// floor that takes teams one at a time is a phone's, where six birds at the
// paired spacing are wider than the screen — and stand a touch shorter, so a
// full team fits between the edges with its faces still readable.
export const groupSolo = `${groupBase} bottom-[clamp(0.63rem,1.53vh,2.1rem)] left-1/2 h-[clamp(4.5rem,11vh,15rem)]`;

// Pinned at the centre line, so "off the left edge" is half the screen plus
// the group's own width back, and "off the right edge" is half the screen on.
export const groupSoloLeftOffstage = "translate-x-[calc(-50vw_-_100%)]";

export const groupSoloRightOffstage = "translate-x-[50vw]";

export const groupSoloOnstage = "-translate-x-1/2";

// A member is one bird's slot in the row. It carries no transform and no
// stacking of its own, so every bird's ground (its pool or Stage) and every
// bird sit on the GROUP's stacking context: all the grounds under all the
// birds, so a Stage never paints over a neighbour's feet.
export const member = "relative block h-full";

// Birds in a row overlap by a little, as a huddle does, so a team of six still
// fits its half of the floor (the first bird takes no overlap). A bird on show
// with a Prop or a Stage takes room either side of it: a Prop is held at the
// wing tip, out at the bird's back, and in the huddle it lay across the face
// of the bird behind; two Stages a huddle apart were one smear. Six showpieces
// at the loose spacing still fit their half of a 16:9 floor.
export const memberOverlapTight = "-ml-[2.5vw]";

export const memberOverlapShowpiece = "-ml-[0.5vw]";

export const memberOverlapSolo = "-ml-[11vw]";

// The bird's pool or Stage, laid exactly over the bird's own box, under every
// bird in the group.
export const ground = "pointer-events-none absolute inset-0 z-0 block h-full";

// The bird itself, over every ground. Which bird of a huddle paints over which
// follows the way the row faces: each bird's face over the back of the bird in
// front of it, so a tail or a Prop never covers a face (`birdDepths`, picked
// by the bird's place in the row).
export const bird = "relative block h-full";

// One literal per place, as Tailwind needs; a row longer than this shares the
// top one, which only matters where two of those overlap.
export const birdDepths = [
  "z-[1]",
  "z-[2]",
  "z-[3]",
  "z-[4]",
  "z-[5]",
  "z-[6]",
  "z-[7]",
  "z-[8]",
  "z-[9]",
  "z-[10]",
  "z-[11]",
  "z-[12]"
] as const;

// The drawing faces right; a bird walking left, or dancing on the right
// side facing its opposite number, is the same bird mirrored. The ground and
// the bird each carry it, since the member they share must stay untransformed.
export const facingLeft = "-scale-x-100";

// Inside the bird's layer, so the bounce composes with that mirror rather than
// overwriting it — an animation's transform beats a utility's, and a bird
// that lost its flip would dance with its back to the room.
export const jive = "relative block h-full";

// Off its feet: a hop, a lean and a little wander, at this bird's own tempo
// and phase (`--cast-jive-*` from the cast's `resolveCharacterGroove`, set on the
// member). `origin-bottom` puts the pivot on the floor, so a lean is a lean
// and not the whole bird swinging. Only while the pair is DANCING — the walk
// on and off is the group's own transform and wants no wobble under it — and
// not while the bird plays a Move, which is a whole flourish of its own.
export const jiveDancing =
  "relative block h-full origin-bottom will-change-transform motion-safe:[animation:cast-jive_var(--cast-jive-ms,820ms)_ease-in-out_var(--cast-jive-delay,0ms)_infinite]";

// The pool of shade under a bird, the same depth cue JOUST draws on the sand
// (DESIGN.md §2.7): without it the floor is a strip of stickers pasted on the
// flame, and with it the row is standing on the deck. It hangs in the bird's
// ground, outside the jive layer, so a hop lifts the bird off a shadow that
// stays put.
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
