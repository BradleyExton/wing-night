// The shared host/display design system: the style tokens and the layout
// surfaces (`<TakeoverStage>`, `<TakeoverCanvas>`) that the host tablet and
// the TV both draw from. It is a package rather than a client component so a
// minigame package can draw from the same design language — the minigame
// packages cannot import from apps/client, and a second copy of the host
// design system would drift from the first, the same reason `packages/cast`
// exists for the bird.
//
// `<TakeoverStage>`/`<TakeoverCanvas>` land here in later tasks.
export * from "./styleTokens/index.js";
