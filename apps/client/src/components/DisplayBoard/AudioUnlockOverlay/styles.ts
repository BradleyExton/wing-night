// Mirrors the GameLockedOverlay sibling, with one deliberate difference: this
// overlay is `pointer-events-auto` because receiving the tap is its whole job.
export const overlay =
  "pointer-events-auto fixed inset-0 z-30 flex cursor-pointer flex-col items-center justify-center gap-[clamp(1.5rem,3vw,2.5rem)] bg-[theme(colors.shade/78%)] px-[clamp(1.5rem,3vw,3rem)] py-[clamp(1.5rem,3vw,3rem)] backdrop-blur-md";

export const speakerFrame =
  "heat-locked-lock-halo flex h-[clamp(140px,18vw,230px)] w-[clamp(140px,18vw,230px)] items-center justify-center";

export const speakerIcon =
  "relative z-[1] h-[60%] w-[60%] text-primary [filter:drop-shadow(0_0_16px_theme(colors.primary/70%))]";

// The lucide SVG defaults to 24px; stretch it to fill the clamp-sized halo so
// it reads at TV distance.
export const speakerIconSvg = "h-full w-full";

export const heading =
  "m-0 text-[clamp(3rem,8vw,10rem)] font-black uppercase leading-[0.85] tracking-[-0.01em] text-text [text-shadow:0_0_40px_theme(colors.primary/45%),0_0_100px_theme(colors.heat/20%)]";

// `primary`, not `gold`: nobody has won anything yet (DESIGN.md §0.1).
export const headingAccent = "text-primary";

export const instructionLabel =
  "m-0 text-[clamp(0.95rem,1.3vw,1.5rem)] font-bold uppercase tracking-[0.32em] text-mutedWarm";
