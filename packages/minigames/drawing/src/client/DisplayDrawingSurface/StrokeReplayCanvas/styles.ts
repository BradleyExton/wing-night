export const fitArea = "flex h-full min-h-0 w-full items-center justify-center";

// Easel frame with splayed legs, hugging the letterboxed chalkboard
// (DESIGN.md §2.5). The silhouette carries the easel; the surface tokens keep
// it in the same material family as every other panel on the TV.
export const easelFrame =
  "relative h-fit w-fit rounded-2xl border-2 border-gold/30 bg-surfaceAlt p-3 shadow-[0_16px_36px_rgba(0,0,0,0.6)] before:absolute before:left-[17%] before:top-full before:h-12 before:w-4 before:rotate-[8deg] before:rounded-b before:bg-surfaceAlt before:content-[''] after:absolute after:right-[17%] after:top-full after:h-12 after:w-4 after:-rotate-[8deg] after:rounded-b after:bg-surfaceAlt after:content-['']";

// The chalkboard texture lives on the wrapper so dimming the canvas fades
// only the strokes, never the board.
export const board =
  "h-fit w-fit rounded-md bg-[#0e2624] shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] [background-image:linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),radial-gradient(ellipse_at_50%_30%,#14302d_0%,#0e2624_70%,#06181a_100%)] [background-size:30px_30px,30px_30px,100%_100%]";

export const canvas = "block transition-opacity duration-300";

export const canvasDimmed = "opacity-30";
