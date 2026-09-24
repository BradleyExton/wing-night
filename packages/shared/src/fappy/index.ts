export {
  FAPPY_WORLD,
  resolveFappyChampTop,
  resolveFappyCliffPerchY,
  resolveFappyGates,
  resolveFappyLandingX,
  resolveFappyLegTickCap,
  resolveFappyPerchY,
  resolveFappySpit,
  resolveFappySpitPhase,
  resolveFappyWaitingX,
  resolveFappyWave
} from "./world/index.js";
export {
  advanceFappy,
  createFappyLegLanding,
  createFappyLegStart,
  runFappyLeg,
  stepFappy
} from "./simulate/index.js";
export type {
  FappyBird,
  FappyChampKind,
  FappyFrame,
  FappyGate,
  FappyKnockedEagle,
  FappyLegCourse,
  FappyLegRun,
  FappyOutcome,
  FappySpit,
  FappySplat
} from "./types.js";
