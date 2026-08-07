export const footer =
  "relative z-10 isolate shrink-0 grid gap-px border-t border-text/[0.06] bg-text/[0.04]";

// One equal column per team, and the team count is only known at runtime, so the track
// listing can't be a static utility class. It is applied through a ref so the declaration
// stays here with the rest of the styling rather than becoming an inline style prop.
//
// Both render branches carry this ref and a zero count clears the listing, because React
// reuses the same <footer> node across the empty/populated swap and does not diff a style
// written imperatively — leaving it set would strand the empty state in a stale track.
export const applyFooterColumns =
  (columnCount: number) =>
  (element: HTMLElement | null): void => {
    if (element === null) {
      return;
    }

    element.style.gridTemplateColumns =
      columnCount > 0 ? `repeat(${columnCount}, minmax(0, 1fr))` : "";
  };

export const emptyLabel =
  "px-[clamp(1rem,2.2vw,3rem)] py-[clamp(0.85rem,1.4vh,1.5rem)] text-center text-[clamp(0.95rem,1vw,1.55rem)] text-muted";

export const column =
  "relative flex items-center justify-between gap-[clamp(0.85rem,1.4vw,2rem)] overflow-hidden bg-bg px-[clamp(1rem,1.6vw,2.25rem)] py-[clamp(0.85rem,1.3vh,1.5rem)]";

export const columnEdge =
  "pointer-events-none absolute inset-y-0 left-0 w-[3px]";

export const columnInfo = "flex min-w-0 flex-col gap-[0.2rem]";

export const columnMeta =
  "inline-flex items-center gap-[0.4em] text-[clamp(0.7rem,0.85vw,0.95rem)] font-semibold uppercase tracking-[0.18em] text-muted";

export const columnMetaLead = "text-gold";

export const columnMetaIcon =
  "h-[1.1em] w-[1.1em] [filter:drop-shadow(0_0_6px_rgba(251,191,36,0.5))]";

export const columnName =
  "m-0 min-w-0 truncate text-[clamp(0.95rem,1.15vw,1.4rem)] font-extrabold uppercase tracking-[0.06em] text-text";

export const columnScore =
  "m-0 whitespace-nowrap font-mono text-[clamp(1.8rem,2.6vw,3.2rem)] font-black tabular-nums leading-none tracking-[-0.04em] text-text";

export const columnScoreLead = "text-gold";
