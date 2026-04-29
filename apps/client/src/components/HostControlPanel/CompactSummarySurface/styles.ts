export {
  deckGroupRoot as group,
  deckGroupHead as groupHead,
  deckRow as row,
  deckRowName as rowName,
  deckRowMeta as rowMeta,
  teamDot
} from "../styleTokens";

export const leaderRow =
  "border-l-[3px] border-l-primary/70 bg-gradient-to-r from-primary/10 to-transparent";

export const leaderLabel =
  "text-[0.65rem] font-extrabold uppercase tracking-[0.32em] text-gold";

export const score =
  "font-mono text-[clamp(1.05rem,1.4vw,1.4rem)] font-black tabular-nums tracking-[-0.03em] text-text";

export const scoreLeader = "text-gold";

export const rosterMeta =
  "mt-0.5 block text-[clamp(0.7rem,0.85vw,0.82rem)] font-medium text-muted/85 normal-case tracking-normal";

export const metaCluster = "flex items-center gap-2";
