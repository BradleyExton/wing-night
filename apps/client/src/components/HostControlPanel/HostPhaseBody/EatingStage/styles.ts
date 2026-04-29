export {
  stageEyebrow as eyebrow,
  stageTimer as timer,
  stageTimerUrgent as timerUrgent,
  stageTimerCap as timerCap,
  stageGlowEating as glowEating
} from "../../styleTokens";

export const heatTrack =
  "relative h-[clamp(8px,1vh,12px)] max-w-[80%] overflow-hidden rounded-full bg-text/[0.06]";

export const heatTrackFill =
  "h-full rounded-full bg-gradient-to-r from-gold via-primary to-heat shadow-[0_0_16px_rgba(249,115,22,0.4)] transition-[width] duration-1000 ease-linear";
