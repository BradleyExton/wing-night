export const fitArea = "flex h-full min-h-0 w-full items-center justify-center";

// Thin gold-edged frame hugging the letterboxed chalkboard (DESIGN.md §2.5).
// The tablet frame is chrome, not theatre — every pixel it does not take is
// board the artist draws on.
export const easelFrame =
  "h-fit w-fit rounded-2xl border border-text/10 bg-surfaceAlt p-2";

// Scene art, licensed by DESIGN.md §2.5: the easel's chalkboard green and its faint grid, the
// ground the ink palette was chosen against.
const sceneBoard =
  "bg-[#0e2624] [background-image:linear-gradient(0deg,theme(colors.text/3%)_1px,transparent_1px),linear-gradient(90deg,theme(colors.text/3%)_1px,transparent_1px),radial-gradient(ellipse_at_50%_30%,#14302d_0%,#0e2624_70%,#06181a_100%)] [background-size:30px_30px,30px_30px,100%_100%]";

export const canvas = `block cursor-crosshair touch-none rounded-xl shadow-[inset_0_0_30px_theme(colors.shade/50%)] ${sceneBoard}`;
