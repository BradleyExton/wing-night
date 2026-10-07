import { stageStatusLine } from "@wingnight/surface";

export const container = "flex h-full w-full flex-col items-center justify-center gap-4 bg-bg p-10 text-center";

export const introTitle = "m-0 font-voice text-[clamp(2.4rem,6vw,5rem)] font-bold italic leading-none text-text";

export const introDescription = "m-0 max-w-[46ch] text-[clamp(1rem,1.6vw,1.6rem)] leading-relaxed text-text/90";

export const hint = "m-0 text-[clamp(1rem,1.6vw,1.6rem)] italic text-muted";

export const stage = "relative flex h-full w-full flex-col gap-[clamp(0.6rem,1.1vh,1.1rem)]";

// The marquee is `<NeonMarquee>` from @wingnight/surface (DESIGN.md §2.2D).

// No frame and no bars: the room's camera fills the arena edge to edge (§2.11), and the only edge
// is the arena's own rounded corner.
export const arenaArea = "relative flex min-h-0 flex-1 overflow-hidden rounded-2xl bg-bg";

// The turn's result, centred over the pile once the team is through.
export const resultOverlay =
  "pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,theme(colors.bg/70%)_0%,transparent_72%)]";

export const statusLine = stageStatusLine;
