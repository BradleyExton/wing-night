// The roster as a wall of birds, three to a row on a phone held upright
// (mockups/player-phone, frame 1). A tile is the portal's glass in miniature;
// a taken face is the same tile dimmed and drained, so the free ones read first.
export const grid = "m-0 grid list-none grid-cols-3 gap-2.5 p-0";

const faceBase =
  "flex min-h-[7.4rem] w-full flex-col items-center gap-1.5 rounded-[0.9rem] border px-1.5 pb-2 pt-2.5 text-center text-text transition-transform active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow";

export const face = `${faceBase} border-ember/20 bg-bg/70`;

// The face a claim is in flight for.
export const facePressed = `${faceBase} border-primary bg-bg/70 [box-shadow:0_0_18px_theme(colors.primary/35%)]`;

export const faceTaken = `${faceBase} cursor-not-allowed border-ember/10 bg-bg/50 opacity-40 grayscale-[0.7]`;

export const name =
  "w-full truncate text-[0.8rem] font-extrabold uppercase leading-tight tracking-[0.04em]";

export const tag = "text-[0.56rem] font-bold uppercase tracking-[0.18em] text-mutedWarmDim";
