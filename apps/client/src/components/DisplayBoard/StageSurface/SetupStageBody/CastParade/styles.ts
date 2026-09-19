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
  "absolute bottom-[5%] flex h-[clamp(5rem,12vh,15rem)] items-end -space-x-[2.5vw] will-change-transform transition-transform duration-[3200ms] ease-linear motion-reduce:transition-none";

export const groupLeft = `${groupBase} left-0`;

export const groupRight = `${groupBase} right-0`;

// Off the edge is a whole group-width past it, whatever the group's width.
export const groupLeftOffstage = "-translate-x-full";

export const groupLeftOnstage = "translate-x-[6vw]";

export const groupRightOffstage = "translate-x-full";

export const groupRightOnstage = "-translate-x-[6vw]";

export const member = "block h-full";

// The drawing faces right; a bird walking left, or dancing on the right
// side facing its opposite number, is the same bird mirrored.
export const memberFacingLeft = "-scale-x-100";
