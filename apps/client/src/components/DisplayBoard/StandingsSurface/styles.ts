export const footer =
  "relative z-10 isolate shrink-0 border-t border-primary/20 bg-gradient-to-b from-surfaceAlt/85 to-surface px-[clamp(1rem,2.2vw,3rem)] py-[clamp(0.8rem,1.2vh,1.5rem)]";

export const headingRow = "relative z-10 flex items-center gap-[clamp(0.5rem,0.9vw,1rem)]";

export const headingAccentLine =
  "h-px flex-1 bg-gradient-to-r from-transparent via-primary/35 to-transparent [animation:pulse_8s_ease-in-out_infinite] motion-reduce:[animation:none]";

export const heading =
  "m-0 whitespace-nowrap text-[clamp(0.85rem,0.9vw,1.45rem)] font-black uppercase tracking-[0.18em] text-primary/90";

export const emptyLabel = "mt-3 text-[clamp(0.95rem,1vw,1.55rem)] text-muted";

export const standingsList = "mt-3 grid gap-[clamp(0.5rem,0.8vw,1rem)] md:grid-cols-3";

export const standingCardBase =
  "relative overflow-hidden rounded-[clamp(0.4rem,0.8vw,0.85rem)] border bg-surfaceAlt/95 px-[clamp(0.6rem,1vw,1.15rem)] py-[clamp(0.5rem,0.9vh,1rem)] shadow-[0_10px_30px_rgba(0,0,0,0.2)]";

export const standingCard = `${standingCardBase} border-text/10`;

export const leadingStandingCard = `${standingCardBase} border-primary/60 bg-primary/10`;

export const winnerStandingCard = `${standingCardBase} border-gold/70 bg-gold/10`;

export const teamColorEdge = "border-l-[0.35rem]";
export const winnerTeamAccentBorder = "border-l-gold/85";
export const winnerTeamAccentDot = "bg-gold/90";

export const teamRow = "flex items-start justify-between gap-3";

export const cardGlow =
  "pointer-events-none absolute -top-8 -right-10 h-16 w-28 rounded-full bg-primary/15 blur-xl [animation:pulse_9s_ease-in-out_infinite] motion-reduce:[animation:none]";

export const teamIdentity = "flex min-w-0 items-start gap-2.5";

export const teamIdentityBody = "min-w-0";

export const teamNameRow = "flex min-w-0 items-center gap-2.5";

export const rankBadge =
  "m-0 grid h-[clamp(1.5rem,1.9vw,2.2rem)] w-[clamp(1.5rem,1.9vw,2.2rem)] shrink-0 place-items-center rounded-full border border-text/20 bg-bg/40 text-[clamp(0.62rem,0.68vw,1rem)] font-black tracking-[0.1em] text-muted";

export const teamAccentDot = "mt-1 h-2.5 w-2.5 shrink-0 rounded-full";

export const teamName =
  "m-0 min-w-0 truncate text-[clamp(1rem,1.05vw,1.7rem)] font-black text-text";

export const leadingStatusLabel =
  "rounded-md border border-primary/35 bg-primary/12 px-2 py-0.5 text-[clamp(0.58rem,0.62vw,0.85rem)] font-bold uppercase tracking-[0.1em] text-primary";

export const winnerStatusLabel =
  "rounded-md border border-gold/45 bg-gold/12 px-2 py-0.5 text-[clamp(0.58rem,0.62vw,0.85rem)] font-bold uppercase tracking-[0.1em] text-gold";

export const score =
  "m-0 whitespace-nowrap rounded-[clamp(0.35rem,0.55vw,0.6rem)] border border-text/15 bg-bg/40 px-[clamp(0.45rem,0.65vw,0.9rem)] py-[clamp(0.2rem,0.35vw,0.45rem)] text-[clamp(0.82rem,0.85vw,1.3rem)] font-black tabular-nums text-text/88";

export const teamRoster =
  "mt-1 text-[clamp(0.8rem,0.8vw,1.22rem)] leading-tight text-text/78";
