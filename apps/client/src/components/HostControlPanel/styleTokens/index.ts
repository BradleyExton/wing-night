// =============================================================================
// Forms & buttons — used by override-dock content (ScoreOverrideSurface,
// TurnOrderSurface, OverrideActionsSurface) and inline forms.
// =============================================================================

export const fieldLabel = "text-xs font-semibold uppercase tracking-wide text-muted";

export const inputBase =
  "h-11 rounded-md border border-text/30 bg-bg px-3 text-base text-text placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const selectBase =
  "h-11 rounded-md border border-text/30 bg-bg px-3 text-base text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const actionButtonPrimary =
  "h-11 rounded-md border border-primary/70 bg-primary/20 px-4 text-base font-semibold text-text transition hover:bg-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50";

// =============================================================================
// Cards & section headings — used by the floating override dock content.
// =============================================================================

export const cardBase = "rounded-lg border border-text/10 bg-surfaceAlt p-4";

export const sectionHeading = "text-xl font-semibold text-text";

export const sectionDescriptionDefault = "mt-1 text-sm text-text/80";

// =============================================================================
// Mini-rail — top of every stage hero; shows round / sauce / minigame /
// active-team color pill as inline pills.
// =============================================================================

export const miniRail =
  "flex flex-wrap items-center gap-x-[clamp(0.75rem,1.2vw,1.1rem)] gap-y-2 text-[clamp(0.72rem,0.85vw,0.85rem)] font-semibold uppercase tracking-[0.32em] text-muted";

export const miniRailStrong = "text-text";

export const miniRailDivider = "h-1.5 w-1.5 rounded-full bg-text/20";

export const miniRailTeamPill =
  "inline-flex items-center gap-2 rounded-full border border-primary/45 bg-primary/15 px-3 py-1.5 text-text";

export const miniRailTeamDot =
  "h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_currentColor] text-primary";

// =============================================================================
// Stage hero — left 65% of the canvas; dramatic eyebrow + headline + meta or
// a live datum (timer, score). Subtle radial-gradient glow backdrop.
// =============================================================================

export const stageRoot =
  "relative isolate flex min-h-0 flex-col gap-[clamp(0.75rem,1.4vh,1.25rem)] overflow-hidden p-[clamp(1.75rem,3.2vw,3rem)]";

export const stageGlow =
  "pointer-events-none absolute inset-[-10%_-10%_30%_-20%] -z-10 blur-[50px]";

export const stageGlowDefault =
  "[background:radial-gradient(ellipse_at_30%_50%,rgba(249,115,22,0.16),transparent_60%)]";

export const stageGlowEating =
  "[background:radial-gradient(ellipse_at_25%_35%,rgba(249,115,22,0.22),transparent_55%),radial-gradient(ellipse_at_70%_75%,rgba(239,68,68,0.1),transparent_60%)]";

export const stageEyebrow =
  "text-[clamp(0.85rem,1.05vw,1.1rem)] font-extrabold uppercase tracking-[0.34em] text-primary";

export const stageHeadline =
  "m-0 text-[clamp(3.5rem,7.5vw,7rem)] font-black leading-[0.92] tracking-[-0.035em] text-text";

export const stageHeadlineAccent = "text-primary";

export const stageMeta =
  "max-w-[38ch] text-[clamp(1rem,1.2vw,1.25rem)] font-medium leading-[1.4] text-muted";

export const stageMetaStrong = "font-bold text-text";

export const stageTimer =
  "m-0 font-mono text-[clamp(8rem,18vw,16rem)] font-black leading-[0.82] tracking-[-0.06em] tabular-nums text-primary [text-shadow:0_0_60px_rgba(249,115,22,0.3)]";

export const stageTimerUrgent =
  "text-heat [text-shadow:0_0_60px_rgba(239,68,68,0.4)] motion-safe:[animation:pulse_0.7s_ease-in-out_infinite]";

export const stageTimerCap =
  "text-[clamp(0.85rem,1.05vw,1.1rem)] font-bold uppercase tracking-[0.34em] text-muted";

// =============================================================================
// Control deck — right 35% of the canvas; vertical stack of deck-groups
// (group head + tappable rows + inline create form, no card chrome).
// Foot of the deck holds the override entry button.
// =============================================================================

export const deckRoot =
  "relative flex min-h-0 flex-col gap-[clamp(1rem,1.6vh,1.4rem)] overflow-y-auto border-l border-text/5 bg-black/20 p-[clamp(1.25rem,2vw,1.75rem)]";

export const deckGroupRoot = "flex flex-col";

export const deckGroupHead =
  "mb-1 flex items-baseline justify-between px-1.5 text-[clamp(0.65rem,0.8vw,0.78rem)] font-extrabold uppercase tracking-[0.34em] text-muted/70";

export const deckGroupCount = "font-mono tracking-[0.12em] text-primary";

export const deckRow =
  "flex min-h-[60px] cursor-pointer items-center justify-between gap-3 border-b border-text/5 px-1.5 last:border-b-0";

export const deckRowSelected =
  "border-l-[3px] border-l-primary bg-gradient-to-r from-primary/15 to-transparent pl-[calc(0.375rem-3px)]";

export const deckRowName =
  "inline-flex items-center gap-2 text-[clamp(0.95rem,1.15vw,1.15rem)] font-bold text-text";

export const deckRowMeta =
  "text-[clamp(0.72rem,0.85vw,0.85rem)] font-semibold uppercase tracking-[0.2em] text-muted";

export const deckRowCheck =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] border-muted/60 transition-colors";

export const deckRowCheckActive = "border-primary bg-primary";

export const deckRowCheckIcon = "h-4 w-4 text-bg";

export const deckAddRow = "mt-2 flex gap-1.5 px-1.5";

export const deckInput =
  "h-13 min-h-[52px] flex-1 rounded-md border border-text/10 bg-text/[0.04] px-3.5 text-[clamp(0.95rem,1.1vw,1.05rem)] text-text placeholder:text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const deckAddButton =
  "min-h-[52px] rounded-md border border-primary/50 bg-primary/15 px-4 text-[clamp(0.85rem,1vw,0.95rem)] font-extrabold uppercase tracking-[0.18em] text-primary transition hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50";

export const deckChipRow = "inline-flex gap-1.5";

export const deckChip =
  "inline-flex h-9 min-w-[36px] items-center justify-center gap-1.5 rounded-md border border-text/10 bg-text/[0.03] px-2 font-mono text-[clamp(0.7rem,0.85vw,0.85rem)] font-extrabold uppercase tracking-[0.14em] text-muted transition hover:border-text/25 disabled:cursor-not-allowed disabled:opacity-50";

export const deckChipActive =
  "border-primary/55 bg-primary/15 text-primary hover:border-primary/70";

export const deckTimerControls = "grid grid-cols-[1.4fr_1fr_1fr] gap-1.5";

export const deckCtrlButton =
  "inline-flex min-h-[56px] items-center justify-center gap-1.5 rounded-md border border-text/10 bg-text/[0.04] px-3 text-[clamp(0.85rem,1.05vw,1rem)] font-extrabold uppercase tracking-[0.16em] text-text transition hover:bg-text/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50";

export const deckFoot = "mt-auto flex justify-end pt-3";

export const deckOverridesButton =
  "inline-flex min-h-[44px] items-center gap-2 rounded-md border border-text/10 bg-text/[0.02] px-3.5 text-[0.78rem] font-bold uppercase tracking-[0.22em] text-muted transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const deckOverridesBadge =
  "inline-flex h-2 w-2 rounded-full bg-heat shadow-[0_0_8px_currentColor]";

// =============================================================================
// CTA + heat strip — full-bleed bottom row; primary action always visible per
// DESIGN.md §2.1; heat-color shimmer strip across the top of the bar adds
// energy without competing with the button.
// =============================================================================

export const ctaArea = "relative flex flex-col";

export const heatStrip =
  "relative h-3 overflow-hidden bg-gradient-to-r from-gold/40 via-primary/80 to-heat/60 motion-reduce:[&>span]:hidden";

export const heatStripShimmer =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_30%,rgba(255,255,255,0.4)_50%,transparent_70%)] motion-safe:[animation:shimmer_3s_linear_infinite]";

export const ctaBar = "flex bg-bg";

export const ctaButton =
  "inline-flex min-h-[clamp(84px,10vh,112px)] flex-1 items-center justify-center gap-3 bg-primary px-4 text-[clamp(1.2rem,1.7vw,1.6rem)] font-black uppercase tracking-[0.18em] text-bg transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary";

// =============================================================================
// Team accents — small color dot used wherever a team name is rendered.
// =============================================================================

export const teamDot = "h-2.5 w-2.5 shrink-0 rounded-full";
