// Base Borden, the two-at-a-time run-and-gun (docs/minigames/base-borden-spec.md §0.4): a pure,
// seeded, tick-stepped sim that the online room and every phone step to the same bits.
export {
  BORDEN_STICKS,
  BORDEN_STRETCHES,
  BORDEN_WORLD,
  resolveBordenCourseTotal,
  resolveBordenFoeBox,
  resolveBordenFoeHp,
  resolveBordenPairSize,
  resolveBordenPairs,
  resolveBordenStretch,
  resolveBordenWakeX
} from "./world/index.js";
export {
  advanceBorden,
  createBordenStart,
  isBordenFoeLive,
  isBordenHenAirborne,
  isBordenHenDucking,
  resolveBordenHandoffBottles,
  resolveBordenHeartsCarried,
  resolveBordenHenHeight,
  stepBorden
} from "./simulate/index.js";
export {
  bordenMasher,
  bordenRunner,
  resolveBordenBotInputs,
  type BordenBot,
  type BordenBotThumbs
} from "./bots/index.js";
export type {
  BordenBottle,
  BordenBottleDrop,
  BordenEvent,
  BordenEventKind,
  BordenFoe,
  BordenFoeKind,
  BordenFrame,
  BordenHen,
  BordenHenState,
  BordenHenStats,
  BordenInput,
  BordenOutcome,
  BordenPuddle,
  BordenSauce,
  BordenShot,
  BordenShotLevel,
  BordenSpawn,
  BordenStick,
  BordenStretch,
  BordenStretchName,
  BordenStretchSpec,
  BordenTelegraph
} from "./types.js";
