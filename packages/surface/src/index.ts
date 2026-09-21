// The shared host/display design system: the style tokens and the layout
// surfaces (`<TakeoverStage>`, `<TakeoverCanvas>`) that the host tablet and
// the TV both draw from. It is a package rather than a client component so a
// minigame package can draw from the same design language — the minigame
// packages cannot import from apps/client, and a second copy of the host
// design system would drift from the first, the same reason `packages/cast`
// exists for the bird.
export * from "./styleTokens/index.js";
// The two takeover layouts (docs/takeover-layout-api.md). Two names, never one
// component with a `fullBleed` flag: a game changes layout by changing which
// one it renders, and that shows up in a diff as the structural change it is.
//
// Deliberately NOT exported: a dock-gutter token. The 4.5rem bottom-right
// reserve is applied by the layouts and only by the layouts — exporting the
// number would be an invitation to hand-type a tenth reserve, which is the
// nine-reserve mess these layouts exist to end (§6).
export { TakeoverStage, type TakeoverStageProps } from "./TakeoverStage/index.js";
export { TakeoverCanvas, type TakeoverCanvasProps } from "./TakeoverCanvas/index.js";
