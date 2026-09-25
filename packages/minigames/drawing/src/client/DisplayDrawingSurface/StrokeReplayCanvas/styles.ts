export const fitArea = "flex h-full min-h-0 w-full items-center justify-center";

// Easel frame with splayed legs, hugging the letterboxed chalkboard
// (DESIGN.md §2.5). The silhouette carries the easel; the surface tokens keep
// it in the same material family as every other panel on the TV.
export const easelFrame =
  "relative h-fit w-fit rounded-2xl border-2 border-gold/30 bg-surfaceAlt p-3 shadow-[0_16px_36px_theme(colors.shade/60%)] before:absolute before:left-[17%] before:top-full before:h-12 before:w-4 before:rotate-[8deg] before:rounded-b before:bg-surfaceAlt before:content-[''] after:absolute after:right-[17%] after:top-full after:h-12 after:w-4 after:-rotate-[8deg] after:rounded-b after:bg-surfaceAlt after:content-['']";

// The chalkboard texture lives on the wrapper so dimming the canvas fades
// only the strokes, never the board.
// Scene art, licensed by DESIGN.md §2.5: the easel's chalkboard green and its faint grid, the
// ground the ink palette was chosen against.
const sceneBoard =
  "bg-[#0e2624] [background-image:linear-gradient(0deg,theme(colors.text/3%)_1px,transparent_1px),linear-gradient(90deg,theme(colors.text/3%)_1px,transparent_1px),radial-gradient(ellipse_at_50%_30%,#14302d_0%,#0e2624_70%,#06181a_100%)] [background-size:30px_30px,30px_30px,100%_100%]";

export const board = `h-fit w-fit rounded-md shadow-[inset_0_0_30px_theme(colors.shade/50%)] ${sceneBoard}`;

export const canvas = "block transition-opacity duration-300";

export const canvasDimmed = "opacity-30";
