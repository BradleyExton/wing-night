export {
  FAPPY_WORLD,
  createFappyRandom,
  resolveFappyGates,
  resolveFappyLegTickCap
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
