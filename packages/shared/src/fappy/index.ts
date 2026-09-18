export {
  FAPPY_WORLD,
  createFappyRandom,
  resolveFappyChampTop,
  resolveFappyGates,
  resolveFappyLegTickCap,
  resolveFappyPerchY,
  resolveFappyWave
} from "./world/index.js";
export { advanceFappy, createFappyLegStart, runFappyLeg, stepFappy } from "./simulate/index.js";
export type {
  FappyBird,
  FappyFrame,
  FappyGate,
  FappyLegCourse,
  FappyLegRun,
  FappyOutcome
} from "./types.js";
