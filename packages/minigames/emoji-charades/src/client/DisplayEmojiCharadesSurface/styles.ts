// TV surface per DESIGN.md §2.6 ("Clue Board"): bulb marquee over a fixed
// board of clue slots, letterboxed into whatever height the marquee and the
// status line leave. The ember stage is DRAWING's showtime material (§2.5),
// shared so the two minigames read as the same show.
export const container =
  "flex h-full min-h-0 flex-col gap-[clamp(0.7rem,1.2vh,1.2rem)] bg-[radial-gradient(ellipse_at_top,#2a1306_0%,#0f0a08_60%,#050505_100%)] p-[clamp(0.8rem,1.4vw,1.6rem)]";

export {
  marqueeBulbs,
  marqueeMeta,
  marqueeTeamName as teamName,
  marqueeTitle as showTitle
} from "@wingnight/surface";

// Grand bulb marquee, the one DRAWING uses: team + pending left, show title
// centred, the turn clock right. The right column used to hold a spacer span
// whose only job was to keep the grid three-wide under a chip the shell pinned
// over the corner — the seventh idiom for the same reserve. The clock is an
// ordinary child of that column now, which is where the mockup
// (`emoji-charades-display/02-clue-wall.html`) always drew it.
export const marquee =
  "relative grid grid-cols-[1fr_auto_1fr] items-center gap-6 rounded-2xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-[clamp(1.4rem,2.4vw,2.4rem)] py-[clamp(0.8rem,1.4vh,1.3rem)] shadow-[inset_0_0_36px_rgba(251,191,36,0.2),0_8px_20px_rgba(0,0,0,0.55)]";

export const pendingPoints =
  "ml-[0.8rem] font-mono text-[clamp(0.95rem,1.4vw,1.5rem)] font-extrabold text-gold";

export const boardArea =
  "relative grid min-h-0 flex-1 justify-items-center gap-[clamp(0.4rem,1vh,0.9rem)] px-[clamp(1rem,3vw,3rem)] [grid-template-rows:1fr_auto]";

export const statusLine =
  "text-center text-[clamp(0.72rem,1.1vw,1.1rem)] font-bold uppercase tracking-[0.24em] text-muted";

export const statusCount = "font-mono text-gold";

// Turn-complete card: the last thing on screen before the host advances, so
// it carries the turn's haul rather than a bare headline.
export const turnCompleteCard =
  "self-center rounded-2xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-[clamp(2rem,4vw,4rem)] py-[clamp(1.2rem,2.4vh,2.4rem)] text-center shadow-[inset_0_0_36px_rgba(251,191,36,0.2)]";

export const turnCompleteTitle =
  "text-center text-[clamp(1.5rem,3vw,3rem)] font-black uppercase tracking-[0.08em] text-text";

export const turnCompleteHint = `${statusLine} mt-2`;
