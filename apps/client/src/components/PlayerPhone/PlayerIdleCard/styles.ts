// Who this phone is, outside a turn (mockups/player-phone, frame 2): the
// guest's bird standing in the hearth's heat, their name loud, their team
// under it — then the one instruction, which is to look up. On its side the
// phone puts the bird beside the name, so the card stays one glance tall.
export const hero = "flex flex-col gap-3 landscape:flex-row landscape:items-center landscape:gap-5";

// The heat pools under the bird and fades out before the stage's edge, so the
// glow has no hard floor line where the card's glass begins.
export const stage =
  "flex h-[min(12rem,34svh)] items-end justify-center rounded-xl bg-[radial-gradient(ellipse_46%_40%_at_50%_62%,theme(colors.primary/26%)_0%,transparent_100%)] pb-2 landscape:w-[min(13rem,38vw)] landscape:flex-none";

export const identity = "flex min-w-0 flex-col gap-3";

export const name =
  "m-0 break-words text-[clamp(2rem,10vw,2.6rem)] font-black uppercase leading-[0.95] tracking-[-0.01em] [text-shadow:0_0_18px_theme(colors.primary/45%),0_2px_0_theme(colors.shade/40%)]";

export const team =
  "inline-flex items-center gap-2 text-[0.9rem] font-extrabold uppercase tracking-[0.12em] text-text";

export const teamDot = "h-2.5 w-2.5 flex-none rounded-full";

export const noTeam = "text-[0.9rem] font-bold uppercase tracking-[0.12em] text-mutedWarmDim";

export const actions = "mt-auto flex flex-col gap-2";

export const confirmQuestion = "m-0 text-center text-[0.9rem] font-bold text-text";
