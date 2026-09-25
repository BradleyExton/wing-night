// One bay of the deck (DESIGN.md §2.2C): a panel of the slab's front face with
// a team's name cut into it.
//
// `--wn-bay-name` is the wordmark's size, set here so the reserved two-line box
// below can be expressed in it. The inset box-shadow is the panel joint — a
// dark edge down each side against the footer's bright seam — plus the face
// falling into shadow as it meets the plinth.
export const bay =
  "relative isolate grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-[clamp(0.85rem,1.4vw,2rem)] overflow-hidden bg-bg px-[clamp(1rem,1.6vw,2.25rem)] pb-[clamp(0.7rem,1.3vh,1.4rem)] pt-[clamp(1.1rem,2.2vh,2.3rem)] [--wn-bay-name:clamp(1.3rem,1.9vw,2.4rem)] [box-shadow:inset_1px_0_0_theme(colors.shade/50%),inset_-1px_0_0_theme(colors.shade/50%),inset_0_-16px_26px_-16px_theme(colors.shade/72%)]";

export const edge = "pointer-events-none absolute inset-y-0 left-0 z-[2] w-[3px]";

// The leader's stretch of lip runs gold instead of ember, so the deck itself
// says who is ahead. Above the deck chrome's own lip (z-3), and clipped by the
// bay, so it stops exactly at the panel joints.
export const leadLip =
  "pointer-events-none absolute inset-x-0 top-0 z-[4] h-[2px] bg-gold [box-shadow:0_0_10px_theme(colors.gold/75%),0_2px_14px_theme(colors.gold/40%)]";

// The emblem as a watermark: low alpha, right-aligned and a touch off-axis,
// under the bay's own info and score (both positioned so they paint over it).
// It brightens with the lead tint so the leader's bay reads as lit.
//
// Sized off the bay rather than the viewport: a `vw` clamp overshot a short
// bay and the crest came out sheared flat against both its edges, which reads
// as a crop rather than a watermark. 72% leaves the 8-degree tilt room to
// swing inside the bay at every stage height.
export const watermark =
  "pointer-events-none absolute right-[-6%] top-1/2 z-0 h-[72%] -translate-y-1/2 -rotate-[8deg] opacity-[0.14]";

export const watermarkLead =
  "pointer-events-none absolute right-[-6%] top-1/2 z-0 h-[72%] -translate-y-1/2 -rotate-[8deg] opacity-[0.22]";

// Top-aligned rather than centred, and over a name box that always reserves
// two lines: that is what puts every bay's rank label on one line across the
// whole deck, and it fixes the band's height for the night so a team renaming
// itself cannot reflow the stage above.
export const info = "relative z-[1] grid min-w-0 content-start gap-[0.22rem]";

export const meta =
  "inline-flex items-center gap-[0.4em] text-[clamp(0.7rem,0.85vw,0.95rem)] font-semibold uppercase leading-none tracking-[0.18em] text-muted";

export const metaLead = "text-gold";

export const metaIcon =
  "h-[1.1em] w-[1.1em] [filter:drop-shadow(0_0_6px_theme(colors.gold/50%))]";

// Sized above the 24px TV floor (docs/team-identity.md) so the genre face is
// allowed here; two lines rather than a truncation because a display face
// earns its width. The case and tracking are the `none` kit's; a treatment
// that owns its own (rope, torn, scanline) overrides them.
//
// The two lines are reserved whether or not the name uses them, and the name
// is centred in them: sized to its own content the block grew by a line and
// shunted that bay's rank label out of line with its neighbours', so one long
// name tilted the whole deck.
export const name =
  "m-0 flex min-h-[calc(var(--wn-bay-name)*2.1)] min-w-0 items-center font-extrabold uppercase tracking-[0.06em] text-text";

export const wordmark = "line-clamp-2 text-[length:var(--wn-bay-name)] leading-[1.05]";

// The halo is load-bearing, not decoration: the score is flush right, which
// lands it on the densest part of the crest behind it, and a faceted disco
// ball or a toothed skull eats the edges of a white digit without it.
export const score =
  "relative z-[1] m-0 whitespace-nowrap font-mono text-[clamp(2rem,2.9vw,3.6rem)] font-black tabular-nums leading-none tracking-[-0.04em] text-text [text-shadow:0_0_14px_theme(colors.bg),0_0_4px_theme(colors.bg)]";

export const scoreLead = "text-gold";
