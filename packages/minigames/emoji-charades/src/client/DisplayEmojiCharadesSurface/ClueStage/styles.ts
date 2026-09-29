import { MAX_STAGE_EMOJIS } from "../stageWindow/index.js";

// No board and no slots (DESIGN.md §2.6, "Stage"): the emoji stand on their
// own in a pool of light, at most six of them, as big as the stage allows.
// The stage is a size container, so every length below is a share of the
// space the marquee and the status line leave — the same on the TV as in the
// sandbox's scaled frame, where `vw` would measure the wrong screen.
export const stage =
  "relative h-full w-full min-h-0 overflow-hidden [container-type:size] bg-[radial-gradient(ellipse_48%_52%_at_center,theme(colors.primary/9%),transparent_72%)] transition-opacity duration-[240ms]";

// Recessed, not erased: the reveal plaque sits over a clue the room can still
// read, the way DRAWING holds its sketch under the verdict.
export const stageDimmed = "opacity-30";

// The waiting ring before the first tap: something is about to land here. It
// fades up only once a cleared row has finished shrinking away, so the two
// never share the middle of the stage.
export const placeholder =
  "absolute inset-0 m-auto h-[34cqh] w-[34cqh] motion-safe:[animation:emoji-stage-settle_500ms_ease-out_420ms_both]";

export const placeholderRing =
  "h-full w-full rounded-full border-4 border-dashed border-text/10 motion-safe:animate-pulse";

// Each emoji's box sits at its place in the row; the row is centred, so a new
// emoji pushes the rest outward and they glide there. The box is the slot's
// size, the glyph inside it is what animates.
export const item =
  "absolute left-1/2 top-1/2 grid place-items-center [height:var(--cell)] [width:var(--cell)] [margin:calc(var(--cell)/-2)_0_0_calc(var(--cell)/-2)] [transform:translateX(calc(var(--slot)*var(--pitch)))] motion-safe:[transition:transform_620ms_cubic-bezier(0.3,1.35,0.5,1),width_620ms_cubic-bezier(0.3,1.2,0.5,1),height_620ms_cubic-bezier(0.3,1.2,0.5,1),margin_620ms_cubic-bezier(0.3,1.2,0.5,1)]";

// `isolate`, so a glyph's halo sits behind that glyph alone and not behind
// the whole row.
const glyphBase =
  "relative isolate block leading-none [font-size:calc(var(--cell)*0.82)] [filter:drop-shadow(0_0.6cqh_1.6cqh_theme(colors.shade/55%))] motion-safe:[transition:font-size_620ms_cubic-bezier(0.3,1.2,0.5,1)]";

export const glyphHero = `${glyphBase} motion-safe:[animation:emoji-stage-hero_1050ms_cubic-bezier(0.22,0.9,0.28,1)_both]`;

export const glyphSettle = `${glyphBase} motion-safe:[animation:emoji-stage-settle_460ms_cubic-bezier(0.2,1.4,0.4,1)_both]`;

export const glyphLeaving = `${glyphBase} [animation:emoji-stage-exit_380ms_ease-in_both] motion-reduce:opacity-0`;

// The newest emoji is lit from behind — the one beat of gold on the stage —
// over a pool of the stage's own dark, so while it pops over the middle of the
// row the emoji it covers fall back instead of tangling with it. It rides on
// the glyph, so it travels with the pop rather than waiting at the slot.
export const glyphHalo =
  "before:absolute before:inset-[-22%] before:-z-10 before:rounded-full before:bg-[radial-gradient(circle,theme(colors.gold/30%),transparent_58%),radial-gradient(circle,theme(colors.bg/92%)_38%,transparent_70%)] before:content-['']";

// How long a leaving emoji is kept on the stage: its exit, plus a frame.
export const STAGE_EXIT_MS = 420;

// The shockwave under the hero's pop, drawn at the centre of the stage.
export const heroRing =
  "pointer-events-none absolute left-1/2 top-1/2 h-[64cqh] w-[64cqh] rounded-full border-[0.8cqh] border-gold/70 opacity-0 motion-safe:[animation:emoji-stage-ring_720ms_cubic-bezier(0.2,0.7,0.3,1)_both]";

// Six across fill ~95% of the stage's width; fewer are bound by its height, so
// one to three emoji are the same size and the row only shrinks past that.
const WIDTH_SHARE_CQW = 86;
const HEIGHT_BOUND_CQH = 58;
const PITCH_PER_CELL = 1.1;

// The hero's pop, as a multiple of its slot: roughly the same on-screen size
// whatever the row length, so the sixth emoji lands as big as the first. Keyed
// by visible count and tuned on a 16:9 stage.
const HERO_SCALE_BY_COUNT = [1.25, 1.25, 1.25, 1.25, 1.45, 1.8, 2.15] as const;

export const resolveCellSize = (visibleCount: number): string => {
  const across = Math.max(visibleCount, 2.4);

  return `min(${(WIDTH_SHARE_CQW / across).toFixed(2)}cqw, ${HEIGHT_BOUND_CQH}cqh)`;
};

export const resolveHeroScale = (visibleCount: number): number => {
  return HERO_SCALE_BY_COUNT[Math.min(visibleCount, MAX_STAGE_EMOJIS)] ?? 1;
};

// The row's geometry is data (how many emoji stand in it, and where this one
// stands), so it cannot be a static utility class. Set per emoji rather than
// on the stage, so one that is leaving keeps the size of the row it left.
// Applied through a ref so the declarations live here.
export const applyItemGeometry =
  ({ slot, rowLength }: { slot: number; rowLength: number }) =>
  (element: HTMLDivElement | null): void => {
    if (element === null) {
      return;
    }

    element.style.setProperty("--slot", String(slot));
    element.style.setProperty("--cell", resolveCellSize(rowLength));
    element.style.setProperty("--pitch", `calc(var(--cell) * ${PITCH_PER_CELL})`);
    element.style.setProperty("--hero-scale", String(resolveHeroScale(rowLength)));
  };
