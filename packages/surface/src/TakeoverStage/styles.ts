// The panel-shaped takeover (docs/takeover-layout-api.md §4). Rows: a rail row
// on top, a main row of body plus an optional deck column, an optional actions
// row at the foot. `<TakeoverCanvas>` is the other half of the pair; a game
// changes layout by changing which component it renders, which shows up in a
// diff as a structural change because it is one (ADR-0002 guardrail 2).
//
// `isolate` on the root keeps the two small bands below — z-10 for the game's
// floating chrome, z-20 for the shell's — local to this subtree, so they can
// never collide with anything else the app stacks.
export const container = "relative isolate flex h-full min-h-0 flex-col gap-3";

// Band 2 (§7) — the shell's chrome, above anything a game floats, so a game
// with a lot to say can never bury the round number or the clock.
//
// This row is how the top-right reserve is abolished (§6). The clock stops
// being an overlay and becomes the last item in a flex row: an empty clock
// takes no width, a filled one pushes the counter left, and no game ever hand-
// types `pr-[clamp(9rem,15vw,12rem)]` again. Nothing in this row is wrapped in
// a box of its own for exactly that reason — an empty wrapper would still cost
// a gap, which is the bug the row exists to remove.
export const railRow = "z-20 flex shrink-0 items-center gap-3";

// `mr-auto` rather than `flex-1`: the rail hugs its own content and the free
// space lands in the margin, so the counter and the clock sit hard right
// without the rail wrapping early to make room for them.
export const rail = "mr-auto min-w-0";

// `gap-3` is the 12px the §12 arithmetic counts: 1228.8 − 330 − 12 = 886.8, the
// body width the audit measured for the four arcade games.
export const mainRow = "flex min-h-0 min-w-0 flex-1 gap-3";

// Band 0 (§7) — the game's interior. `isolate` makes this a stacking context,
// so a game may use any z-index it likes inside it, including the z-400/z-1000
// Leaflet assigns itself, and none of it can escape onto the shell's chrome or
// the corner dock. The game is sandboxed by geometry, not by an agreement
// about numbers. No `overflow` here: under P4 a body taller than the tablet
// must break visibly rather than scroll quietly.
export const body = "relative isolate min-h-0 min-w-0 flex-1";

// The width the four arcade games converged on by hand. It is a scrolling
// column, so the dock gutter costs it nothing: short content never notices the
// padding and long content scrolls past it.
export const deck =
  "flex min-h-0 w-[clamp(230px,28vw,330px)] shrink-0 flex-col gap-3 overflow-y-auto pb-[4.5rem]";

// The dock gutter as right padding, not a full-width bottom band (§6, the T1.8
// precedent): an inline reserve costs width in one row and nothing anywhere
// else, while a band would push up every child of the column and cost vertical
// space on games that have none to spare.
export const actions = "shrink-0 pr-[4.5rem]";
