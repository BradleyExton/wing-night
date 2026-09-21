export {
  FAPPY_WORLD,
  resolveFappyChampTop,
  resolveFappyCliffPerchY,
  resolveFappyGates,
  resolveFappyLandingX,
  resolveFappyLegTickCap,
  resolveFappyPerchY,
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
  FappyFrame,
  FappyGate,
  FappyKnockedEagle,
  FappyLegCourse,
  FappyLegRun,
  FappyOutcome
} from "./types.js";
