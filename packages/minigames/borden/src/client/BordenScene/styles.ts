// The base is drawn in world units in one window 160 by 90, fitted whole into whatever box the
// surface gives the scene; the sky and the ground run on past the window either side, so a wide
// phone shows more base rather than bars.

// Night over the base: the house dark running down into the hearth's warm glass at the horizon.
const sceneSky = "bg-[linear-gradient(180deg,theme(colors.bg)_0%,theme(colors.bg)_30%,theme(colors.hearthGlass)_72%,theme(colors.hearthGlass)_100%)]";

// The night palette every drawing paints with (`palette.ts`), set here from the theme. Every one is
// written out whole, because Tailwind only generates a class it can read whole.
const sceneBase =
  "[--bb-far:theme(colors.surface)] [--bb-far-line:theme(colors.surfaceAlt)] [--bb-window:theme(colors.ember/45%)] [--bb-fence:theme(colors.mutedWarmDim)] [--bb-wire:theme(colors.mutedWarm)] [--bb-ground:theme(colors.surface)] [--bb-ground-line:theme(colors.mutedWarmDim)] [--bb-paint:theme(colors.gold/55%)]";

const sceneKit =
  "[--bb-steel:theme(colors.mutedWarm)] [--bb-steel-dark:theme(colors.surfaceAlt)] [--bb-olive:theme(colors.success/55%)] [--bb-olive-dark:theme(colors.success/30%)] [--bb-alarm:theme(colors.danger)] [--bb-shot:theme(colors.glowHot)] [--bb-shell:theme(colors.heat)]";

const sceneSauce =
  "[--bb-mild:theme(colors.primary)] [--bb-hot:theme(colors.heat)] [--bb-puddle:theme(colors.heat/55%)] [--bb-spread:theme(colors.gold)] [--bb-long:theme(colors.glowHot)]";

const sceneMarks =
  "[--bb-flag:theme(colors.heat)] [--bb-lamp:theme(colors.glowHot)] [--bb-shadow:theme(colors.shade/45%)] [--bb-ink:theme(colors.text)] [--bb-ink-dark:theme(colors.bg)] [--bb-gate:theme(colors.gold)] [--bb-stripe:theme(colors.danger)]";

export const frame = `relative h-full w-full overflow-hidden ${sceneSky} ${sceneBase} ${sceneKit} ${sceneSauce} ${sceneMarks}`;

export const svg = "absolute inset-0 block h-full w-full overflow-visible";

// The names over the hens and the gate's sign: the score face, set in world units.
export const henTag = "font-score text-[5px] font-bold";

export const gateSign = "font-score text-[3.4px] font-black tracking-[0.08em]";

export const alarm = "font-score text-[9px] font-black";
