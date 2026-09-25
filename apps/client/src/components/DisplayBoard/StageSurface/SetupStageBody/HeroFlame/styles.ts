export const container =
  "pointer-events-none absolute inset-0 z-0 flex items-end justify-center";

// Sized by HEIGHT, not width: the flame is anchored to the floor and its tips stop just
// short of the top, so the silhouette is a whole flame on a 1080p panel and a 4K one
// alike. The 8% overshoot buries the base under the footer instead of ending it on a
// flat line. Width follows from the viewBox ratio.
export const svg =
  "h-[108%] w-auto max-w-none [filter:drop-shadow(0_0_50px_theme(colors.primary/50%))_drop-shadow(0_0_140px_theme(colors.heat/35%))]";

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
