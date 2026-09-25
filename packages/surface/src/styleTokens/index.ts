// =============================================================================
// Forms & buttons — used by override-dock content (ScoreOverrideSurface,
// TurnOrderSurface, OverrideActionsSurface) and inline forms.
// =============================================================================

// The dock speaks the same language as the control deck (§2.0A): uppercase
// tracked group heads, 1px dividers instead of card chrome, and the deck's
// input / button shapes — so opening it never feels like a different app.

export const fieldLabel =
  "text-[0.68rem] font-extrabold uppercase tracking-[0.28em] text-muted/80";

export const inputBase =
  "min-h-[48px] w-full rounded-md border border-text/10 bg-text/[0.04] px-3.5 text-base text-text placeholder:text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const selectBase =
  "min-h-[48px] w-full rounded-md border border-text/10 bg-text/[0.04] px-3.5 text-base text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const actionButtonPrimary =
  "inline-flex min-h-[48px] items-center justify-center rounded-md border border-primary/50 bg-primary/15 px-4 text-[0.85rem] font-extrabold uppercase tracking-[0.18em] text-primary transition hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50";

export const actionButtonSecondary =
  "inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-md border border-text/10 bg-text/[0.04] px-3.5 text-[0.85rem] font-extrabold uppercase tracking-[0.16em] text-text transition hover:bg-text/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40";

// =============================================================================
// Dock groups — the floating override dock's sections. Same head / divider
// rhythm as a deck group, no card chrome.
// =============================================================================

export const cardBase = "flex flex-col border-b border-text/5 pb-5 last:border-b-0 last:pb-0";

export const sectionHeading =
  "m-0 px-1.5 text-[0.72rem] font-extrabold uppercase tracking-[0.34em] text-muted/70";

export const sectionDescriptionDefault =
  "mt-2 px-1.5 text-[0.9rem] leading-[1.45] text-muted";

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

// Geometry and glow only. The colour comes from the team's own kit, composed
// by the rail: `dotAccentClassName` fills it and `tintClassName` sets the
// `--tint` the glow reads — the same channel every wordmark and texture keys
// off. It carried `bg-primary text-primary` until 2026-09-21, which meant the
// one dot on the host that names a team was never that team's colour.
// `currentColor` is the fallback for a rail with no team to colour.
export const miniRailTeamDot =
  "h-2 w-2 rounded-full shadow-[0_0_8px_var(--tint,currentColor)]";

// The dot with no team to be. The rail still draws one beside "No team
// assigned", and a colourless circle there reads as a rendering fault rather
// than as a gap in the roster.
export const miniRailTeamDotUnassigned = "bg-primary text-primary";

// =============================================================================
// Stage hero — left 65% of the canvas; dramatic eyebrow + headline + meta or
// a live datum (timer, score). Subtle radial-gradient glow backdrop.
// =============================================================================

export const stageRoot =
  "relative isolate flex min-h-0 flex-col gap-[clamp(0.75rem,1.4vh,1.25rem)] overflow-hidden p-[clamp(1.75rem,3.2vw,3rem)]";

export const stageGlow =
  "pointer-events-none absolute inset-[-10%_-10%_30%_-20%] -z-10 blur-[50px]";

export const stageGlowDefault =
  "[background:radial-gradient(ellipse_at_30%_50%,theme(colors.primary/16%),transparent_60%)]";

export const stageGlowEating =
  "[background:radial-gradient(ellipse_at_25%_35%,theme(colors.primary/22%),transparent_55%),radial-gradient(ellipse_at_70%_75%,theme(colors.heat/10%),transparent_60%)]";

export const stageEyebrow =
  "text-[clamp(0.85rem,1.05vw,1.1rem)] font-extrabold uppercase tracking-[0.34em] text-primary";

export const stageHeadline =
  "m-0 text-[clamp(3.5rem,7.5vw,7rem)] font-black leading-[0.92] tracking-[-0.035em] text-text";

export const stageHeadlineAccent = "text-primary";

export const stageMeta =
  "max-w-[38ch] text-[clamp(1rem,1.2vw,1.25rem)] font-medium leading-[1.4] text-muted";

export const stageMetaStrong = "font-bold text-text";

export const stageTimer =
  "m-0 font-mono text-[clamp(8rem,18vw,16rem)] font-black leading-[0.82] tracking-[-0.06em] tabular-nums text-primary [text-shadow:0_0_60px_theme(colors.primary/30%)]";

export const stageTimerUrgent =
  "text-heat [text-shadow:0_0_60px_theme(colors.heat/40%)] motion-safe:[animation:pulse_0.7s_ease-in-out_infinite]";

export const stageTimerTimeUp =
  "text-heat [text-shadow:0_0_80px_theme(colors.heat/55%)] motion-safe:[animation:pulse_1.2s_ease-in-out_infinite]";

export const stageEyebrowTimeUp =
  "text-[clamp(0.85rem,1.05vw,1.1rem)] font-extrabold uppercase tracking-[0.34em] text-heat motion-safe:[animation:pulse_1.2s_ease-in-out_infinite]";

export const stageTimerCap =
  "text-[clamp(0.85rem,1.05vw,1.1rem)] font-bold uppercase tracking-[0.34em] text-muted";

// =============================================================================
// Control deck — right 35% of the canvas; vertical stack of deck-groups
// (group head + tappable rows + inline create form, no card chrome).
// Foot of the deck holds the override entry button.
// =============================================================================

export const deckRoot =
  "relative flex min-h-0 flex-col gap-[clamp(1rem,1.6vh,1.4rem)] overflow-y-auto border-l border-text/5 bg-shade/20 p-[clamp(1.25rem,2vw,1.75rem)]";

export const deckGroupRoot = "flex flex-col";

export const deckGroupHead =
  "mb-1 flex items-baseline justify-between px-1.5 text-[clamp(0.65rem,0.8vw,0.78rem)] font-extrabold uppercase tracking-[0.34em] text-muted/70";

export const deckGroupCount = "font-mono tracking-[0.12em] text-primary";

// flex-wrap lets a long name push the trailing control group (team chips)
// onto its own right-aligned line instead of clipping on narrow decks.
export const deckRow =
  "flex min-h-[60px] cursor-pointer flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-text/5 px-1.5 py-2 last:border-b-0";

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
  "h-13 min-h-[52px] min-w-0 flex-1 rounded-md border border-text/10 bg-text/[0.04] px-3.5 text-[clamp(0.95rem,1.1vw,1.05rem)] text-text placeholder:text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const deckAddButton =
  "min-h-[52px] rounded-md border border-primary/50 bg-primary/15 px-4 text-[clamp(0.85rem,1vw,0.95rem)] font-extrabold uppercase tracking-[0.18em] text-primary transition hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50";

export const deckChipRow = "ml-auto inline-flex gap-1.5";

export const deckChip =
  "inline-flex h-9 min-w-[36px] items-center justify-center gap-1.5 rounded-md border border-text/10 bg-text/[0.03] px-2 font-mono text-[clamp(0.7rem,0.85vw,0.85rem)] font-extrabold uppercase tracking-[0.14em] text-muted transition hover:border-text/25 disabled:cursor-not-allowed disabled:opacity-50";

export const deckChipActive =
  "border-primary/55 bg-primary/15 text-primary hover:border-primary/70";

export const deckTimerControls = "grid grid-cols-[1.4fr_1fr_1fr] gap-1.5";

export const deckCtrlButton =
  "inline-flex min-h-[56px] items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-text/10 bg-text/[0.04] px-3 text-[clamp(0.85rem,1.05vw,1rem)] font-extrabold uppercase tracking-[0.16em] text-text transition hover:bg-text/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50";

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
  "pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_30%,theme(colors.text/40%)_50%,transparent_70%)] motion-safe:[animation:shimmer_3s_linear_infinite]";

export const ctaBar = "flex bg-bg";

export const ctaButton =
  "inline-flex min-h-[clamp(84px,10vh,112px)] flex-1 items-center justify-center gap-3 bg-primary px-4 text-[clamp(1.2rem,1.7vw,1.6rem)] font-black uppercase tracking-[0.18em] text-bg transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary";

// =============================================================================
// Rail counter — the turn's counts in the takeover rail's `counter` slot
// ("Shot 1 of 3", "+2 pending"), one chip in two materials: solid on a Stage,
// glass over a Canvas's scene. Eight games had grown it in two copies each,
// sentence case in six and caps in two. Sentence case; colourless, so a game
// adds `text-muted` for a count or `text-gold` for pending points without two
// colours contending on one element.
// =============================================================================

const railCounterBase =
  "inline-flex shrink-0 items-center gap-2 rounded-full border border-text/10 px-3.5 text-[0.8rem] font-semibold";

export const railCounter = `${railCounterBase} bg-surface py-1.5`;

export const railCounterOverlay = `${railCounterBase} min-h-9 bg-bg/85 backdrop-blur`;

// =============================================================================
// Takeover label — the small caps kicker a minigame puts over a block of its
// own canvas ("Tonight's prompt", "Runs", "Answer (host only)"). Twenty-eight
// hand-rolled variants had grown, down to 0.55rem (8.8px) on a tablet held at
// arm's length. One size, one tracking, two colours: `muted` for a label and
// `primary` for the one that has to be seen. Not `gold` — that is the winner's.
// =============================================================================

const takeoverLabelBase = "text-[0.7rem] font-extrabold uppercase tracking-[0.24em]";

export const takeoverLabel = `${takeoverLabelBase} text-muted`;

export const takeoverLabelAccent = `${takeoverLabelBase} text-primary`;

// =============================================================================
// Takeover controls — the buttons a minigame draws on its own canvas during
// MINIGAME_PLAY (DESIGN.md §2.0B, "Takeover controls"). Nine games had grown
// four beat-ending recipes, eight secondaries and five verdict styles; these
// are the one of each. They carry skin, focus and disabled state, never size:
// a game places them with `h-*`, `w-*` or `flex-*`, which never contend with
// the token's `min-h` floor the way a second `min-h-*` would.
// =============================================================================

const takeoverFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

// One disabled look across every takeover control: the games had 0.4, 0.45 and 0.5.
const takeoverDisabled = "disabled:cursor-not-allowed disabled:opacity-40";

// The beat-ender — Lock it in, Next shot, Reveal. Flat `primary` like the
// shell's CTA bar, with the arcade's hard drop edge kept as the one flourish:
// the edge is `primary` at half strength over `shade`, a darker orange rather
// than a new colour, and it closes up when the button is pressed.
export const takeoverPrimary = `inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-[clamp(1.2rem,3vw,2.2rem)] text-[clamp(0.95rem,1.4vw,1.2rem)] font-black uppercase tracking-[0.12em] text-bg shadow-[0_4px_0_theme(colors.primary/50%),0_4px_0_theme(colors.shade)] transition hover:bg-primary/90 active:translate-y-[3px] active:shadow-[0_1px_0_theme(colors.primary/50%),0_1px_0_theme(colors.shade)] disabled:translate-y-0 disabled:shadow-none disabled:hover:bg-primary ${takeoverFocus} ${takeoverDisabled}`;

// Everything else the turn needs — Skip, Reset turn, Pause, Undo. Glass over
// the scene so it reads on a dusk sky and on a board alike. No `gold` on hover:
// gold is the winner's colour (§0.1), not a pointer's.
export const takeoverSecondary = `inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-text/15 bg-bg/85 px-4 text-[0.78rem] font-extrabold uppercase tracking-[0.14em] text-text backdrop-blur transition hover:border-primary/60 hover:text-primary ${takeoverFocus} ${takeoverDisabled}`;

// A ruling — Correct / Nope, Got it / Skip, Hit / Miss. Always an icon AND a
// label (§7: never colour alone), positive first, 44px at the least. A
// one-shot verdict is tinted; a toggle that holds its ruling sets
// `aria-pressed` and fills solid, and the attribute variant outranks the tint
// without depending on stylesheet order.
const verdictButtonBase = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 px-4 text-[clamp(0.9rem,1.3vw,1.2rem)] font-extrabold uppercase tracking-[0.1em] text-text transition aria-pressed:text-bg ${takeoverFocus} ${takeoverDisabled}`;

export const verdictButtonSuccess = `${verdictButtonBase} border-success/60 bg-success/20 hover:bg-success/30 aria-pressed:border-success aria-pressed:bg-success`;

export const verdictButtonDanger = `${verdictButtonBase} border-danger/60 bg-danger/20 hover:bg-danger/30 aria-pressed:border-danger aria-pressed:bg-danger aria-pressed:text-text`;

export const verdictIcon = "text-[1.3em] leading-none";

// =============================================================================
// Stage status line — the one sentence under a minigame's stage on the TV that
// says what is happening now ("Alex is up with The Log", "Team Alpha is
// drawing…"). Four styles had grown: primary caps, muted caps, white sentence
// case and a bigger primary. Primary caps, clamped to §4.1's 22px at 4K.
// =============================================================================

export const stageStatusLine =
  "m-0 text-center text-[clamp(0.9rem,1.25vw,1.4rem)] font-extrabold uppercase tracking-[0.24em] text-primary";

// =============================================================================
// Readout figure — a live number in the TV marquee's readout (the relay clock,
// the wings in hand) that has to read bigger than the label type the marquee
// gives its readout. Colourless on purpose: the game says what the number
// means (`text-text`, `text-gold`, `text-heat`) and nothing else contends.
// =============================================================================

export const readoutFigure =
  "font-mono text-[clamp(1.3rem,2.2vw,2.4rem)] font-extrabold normal-case leading-none tracking-normal tabular-nums";

// =============================================================================
// Reveal points — the points a result banked, on the TV. One face for every
// game: it was sans in three and mono in four. `gold` because points won are
// the one celebration a turn has (§0.1), the same colour the marquee lights
// pending points in.
// =============================================================================

export const revealPoints =
  "text-[clamp(2.4rem,4vw,4.2rem)] font-black leading-none tabular-nums text-gold [text-shadow:0_0_18px_theme(colors.gold/50%)]";

// =============================================================================
// Team accents — small color dot used wherever a team name is rendered.
// =============================================================================

export const teamDot = "h-2.5 w-2.5 shrink-0 rounded-full";
