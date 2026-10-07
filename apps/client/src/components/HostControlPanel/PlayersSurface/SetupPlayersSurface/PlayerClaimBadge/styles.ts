// A guest's phone holds this player's face. The badge says whether that phone
// is awake (a live socket) or asleep (its screen went off — the face stays
// theirs), and the button beside it frees the face for another phone. Status
// colour is functional: `success` for a phone that is there, nothing for one
// that is not.
export const root = "inline-flex items-center gap-1.5";

const pillBase =
  "inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-[clamp(0.6rem,0.72vw,0.72rem)] font-extrabold uppercase leading-none tracking-[0.1em]";

export const pillConnected = `${pillBase} border border-success/45 bg-success/10 text-text`;

export const pillAsleep = `${pillBase} border border-text/10 bg-text/[0.04] text-muted`;

export const dotConnected = "h-1.5 w-1.5 rounded-full bg-success [box-shadow:0_0_6px_theme(colors.success/70%)]";

export const dotAsleep = "h-1.5 w-1.5 rounded-full bg-muted/60";

// The host's touch target: 44px tall like every deck control, worded rather
// than an icon so it cannot be mistaken for removing the player.
export const release =
  "inline-flex h-11 min-w-11 items-center justify-center rounded-md border border-text/10 bg-text/[0.03] px-2 font-score text-[clamp(0.66rem,0.8vw,0.8rem)] font-extrabold uppercase tracking-[0.14em] text-muted transition hover:border-text/25 disabled:cursor-not-allowed disabled:opacity-50";
