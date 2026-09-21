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

// Band 2 (§7) — the shell's chrome, floating over the body rather than sitting
// above it. `pointer-events-none` on the row with `pointer-events-auto` on
// whatever it holds, exactly as the corner dock does it, so the row never eats
// a thumb aimed at the map underneath.
//
// This row is also how the top-right reserve is abolished (§6): the clock is
// the last item in it, so an empty clock takes no width and a filled one
// pushes the counter left. Neither is wrapped in a box of its own, because an
// empty wrapper would still cost a gap.
export const chromeRow =
  "pointer-events-none absolute left-[clamp(0.6rem,1.2vw,1rem)] right-[clamp(0.6rem,1.2vw,1rem)] top-[clamp(0.6rem,1.2vw,1rem)] z-20 flex items-center gap-3 [&>*]:pointer-events-auto";

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
export const actions =
  "pointer-events-none absolute bottom-[clamp(0.6rem,1.2vw,1rem)] left-[clamp(0.6rem,1.2vw,1rem)] z-10 flex max-w-[calc(100%-4.5rem)] items-center gap-3 [&>*]:pointer-events-auto";

// Band 1 again — the turn's numbers, where the host's eye already is after a
// result. Bottom-right, but ABOVE the dock: 4.5rem clears the circle's 42.4px
// intrusion by about 30px, which is right for a thumb. There is deliberately
// no bottom-right slot for a control; that corner belongs to the dock, and the
// only two things it does are end the turn and open overrides.
export const readout =
  "pointer-events-none absolute bottom-[4.5rem] right-[clamp(0.6rem,1.2vw,1rem)] z-10 flex items-center gap-3 [&>*]:pointer-events-auto";
