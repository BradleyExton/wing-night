export const container =
  "pointer-events-none absolute inset-0 z-0 flex items-end justify-center";

// Sized by HEIGHT, not width: the flame is anchored to the floor and its tips stop just
// short of the top, so the silhouette is a whole flame on a 1080p panel and a 4K one
// alike. The 8% overshoot buries the base under the footer instead of ending it on a
// flat line. Width follows from the viewBox ratio. `relative` so it paints over the glow,
// which is positioned.
export const svg = "relative h-[108%] w-auto max-w-none";

// The glow sits exactly under the flame (same box, same bottom-centre anchor) and bleeds
// past it. `will-change` gives it a layer of its own, so the flame repainting above it
// never re-rasterises the blur — that isolation is the whole point of it being separate.
// With no viewBox it has no ratio of its own, so it borrows the flame's — and, like the
// flame (a flex item, which shrinks), it is never wider than the stage: on a phone the flame
// is squeezed to the screen's width, and a glow drawn at full width lights a bigger fire.
export const glowSvg =
  "absolute bottom-0 left-1/2 aspect-[200/380] h-[108%] w-auto max-w-full -translate-x-1/2 overflow-visible will-change-transform";

// The old shadows were primary/50% and heat/35%, thrown by the torn, flickering tongues; the
// glow's outline is the smooth one, so it takes a little more to throw the same light
// (matched band by band against the old one on a phone and a laptop).
export const glowNear = "[flood-color:theme(colors.primary)] [flood-opacity:0.65]";

export const glowFar = "[flood-color:theme(colors.heat)] [flood-opacity:0.47]";

// Each layer flickers on its own clock, anchored at the flame's base, so the tongues
// drift apart instead of the whole silhouette pumping in unison. The negative delays
// start the cycles out of phase. Delay rides inside the shorthand for the same reason
// the embers' does (see Embers/styles.ts).
const layerBase =
  "[transform-box:fill-box] [transform-origin:50%_100%] motion-reduce:[animation:none]";

export const layerOuter = `${layerBase} [animation:flicker_3.4s_ease-in-out_infinite]`;
export const layerMid = `${layerBase} [animation:flicker_2.5s_ease-in-out_-0.8s_infinite]`;
export const layerInner = `${layerBase} [animation:flicker_1.9s_ease-in-out_-1.3s_infinite]`;
export const layerCore = `${layerBase} [animation:flicker_1.3s_ease-in-out_-0.4s_infinite]`;

// Gradient stops, bottom to top. Heat lives at the base and the tips thin out, which is
// what reads as fire rather than a stack of coloured cut-outs.
export const stopOuterBase = "[stop-color:theme(colors.heat)] [stop-opacity:0.6]";
export const stopOuterMid = "[stop-color:theme(colors.heat)] [stop-opacity:0.38]";
export const stopOuterTip = "[stop-color:theme(colors.heat)] [stop-opacity:0.06]";

export const stopMidBase = "[stop-color:theme(colors.primary)] [stop-opacity:0.8]";
export const stopMidMid = "[stop-color:theme(colors.primary)] [stop-opacity:0.55]";
export const stopMidTip = "[stop-color:theme(colors.heat)] [stop-opacity:0.2]";

export const stopInnerBase = "[stop-color:theme(colors.gold)] [stop-opacity:0.9]";
export const stopInnerMid = "[stop-color:theme(colors.ember)] [stop-opacity:0.75]";
export const stopInnerTip = "[stop-color:theme(colors.primary)] [stop-opacity:0.3]";

export const stopCoreBase = "[stop-color:theme(colors.text)] [stop-opacity:0.95]";
export const stopCoreMid = "[stop-color:theme(colors.text)] [stop-opacity:0.7]";
export const stopCoreTip = "[stop-color:theme(colors.gold)] [stop-opacity:0.35]";
