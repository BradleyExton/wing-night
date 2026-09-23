// The full-bleed takeover (docs/takeover-layout-api.md §5). One body filling
// the takeover's padding box, with the chrome floating over it. Use it when a
// chip in a corner costs a corner of scenery rather than a word the host must
// read — a map, an arena, a corridor, a zone. `<TakeoverStage>` is the other
// half of the pair; there is no flag between them (ADR-0002 guardrail 2).
//
// `isolate` on the root keeps the two bands below — z-10 for the game's
// floating chrome, z-20 for the shell's — local to this subtree.
export const container = "relative isolate h-full min-h-0 w-full";

// Band 0 (§7) — the game's interior. A second `isolate`, and the load-bearing
// one: without it Leaflet's own z-1000 controls would paint straight over the
// chrome row below, and only a word in a different file would be keeping the
// corner dock on top. Inside this box a game may use any z-index it likes and
// none of it can escape.
export const body = "relative isolate h-full w-full";

// What a floating row hands a pointer back to: a CONTROL, and nothing else.
//
// The three rows below float over the body, so each is `pointer-events-none`
// and each has to give the pointer back to the things a host presses. That
// used to be `[&>*]:pointer-events-auto` — every direct child — which is the
// rule the corner dock uses and which was right for the map this layout was
// drawn around, where every child of `actions` was a button. It is wrong for a
// game whose body IS the button: FAPPY's hint sentence is a `<span>`, and as a
// child of the row it took a pointer it has no use for and killed 764x48px of
// a corridor where a tap means flap — 4.0% of it, live before the migration.
// SCHLONIC's jump legend is the same shape and would be the same loss.
//
// A passive child cannot opt out of that: a plain `pointer-events-none` on the
// hint is inert, because `.pointer-events-none` and the generated
// `.\[\&\>\*\]\:pointer-events-auto > *` have equal specificity and the
// layout's rule is ordered later (verified in the browser: `getComputedStyle`
// on FAPPY's hint read "auto" with both classes on it). So the fix had to be
// here rather than in a game.
//
// It is a narrower selector, not a flag: no `interactive` prop, no
// per-slot configuration object (ADR-0002 guardrail 2), and nothing for a game
// to type. The row stops assuming every child is a control and asks instead —
// a control claims the pointer by *being* one. That fails safe in the
// direction that matters: forgetting a class on a hint costs a dead tap
// target, while a button is live by virtue of being a button. Matched as a
// descendant rather than a direct child, so a game may group its controls in a
// wrapper without them going dead.
//
// §5 forbids a control in `counter`/`clock` and forbids one in `readout`
// outright, so on those two rows this grants nothing today — which is the
// point: they become fully transparent, and the chrome row stops holding a
// full-width strip of the body's top edge against a thumb.
const liveControls = "[&_:is(button,a,input,select,textarea)]:pointer-events-auto";

// Band 2 (§7) — the shell's chrome, floating over the body rather than sitting
// above it. `pointer-events-none` on the row, so it never eats a thumb aimed
// at the map underneath, and nothing in it takes the pointer back: §4 makes
// this row read-only — no button, no link, no input — so a chip here has
// nothing to do with a tap.
//
// This row is also how the top-right reserve is abolished (§6): the clock is
// the last item in it, so an empty clock takes no width and a filled one
// pushes the counter left. Neither is wrapped in a box of its own, because an
// empty wrapper would still cost a gap.
export const chromeRow = `pointer-events-none absolute left-[clamp(0.6rem,1.2vw,1rem)] right-[clamp(0.6rem,1.2vw,1rem)] top-[clamp(0.6rem,1.2vw,1rem)] z-20 flex items-center gap-3 ${liveControls}`;

export const rail = "mr-auto min-w-0";

// Band 1 (§7) — the game's floating chrome. Bottom-left is the one corner
// where a control is neither under the dock nor over the pin the team just
// placed. The hint that explains the controls lands here too, where it costs
// the arena no height at all.
//
// The max-width is the dock gutter (§6): the row cannot run under the corner
// even when its content would. Measured against the root, so the left inset
// eats ~16px of the gutter's 30px of slack over the dock circle's real 42.4px
// intrusion — still clear, and one number instead of GEO's hand-rolled 6rem.
export const actions = `pointer-events-none absolute bottom-[clamp(0.6rem,1.2vw,1rem)] left-[clamp(0.6rem,1.2vw,1rem)] z-10 flex max-w-[calc(100%-4.5rem)] items-center gap-3 ${liveControls}`;

// Band 1 again — the turn's numbers, where the host's eye already is after a
// result. Bottom-right, but ABOVE the dock: 4.5rem clears the circle's 42.4px
// intrusion by about 30px, which is right for a thumb. There is deliberately
// no bottom-right slot for a control; that corner belongs to the dock, and the
// only two things it does are end the turn and open overrides.
//
// The max-width is the same 4.5rem, and it is here because JOUST found the
// asymmetry the first two Canvas games could not: `actions` was bounded in the
// axis it grows and this row was not. Anchored right with no bound, a readout
// whose content is variable — JOUST's result plaque names everyone a shot
// felled, and a cleared rack is nine names on one line — grows leftward until
// it spans the canvas and stops being a readout. Each floating slot is now
// bounded in the axis it grows, by the same one number (§6). Its children are
// ordinary flex items, so content past the bound wraps inside them rather than
// being clipped: too much to say reads as cramped, which is feedback, not as
// missing.
export const readout = `pointer-events-none absolute bottom-[4.5rem] right-[clamp(0.6rem,1.2vw,1rem)] z-10 flex max-w-[calc(100%-4.5rem)] items-center gap-3 ${liveControls}`;
