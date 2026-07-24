import type { RoomState } from "@wingnight/shared";

import { resolveCanAdvancePhase } from "../phaseState/index.js";
import { getRoomState } from "../stateStore/index.js";

export const getRoomStateSnapshot = (): RoomState => {
  const roomState = getRoomState();
  const snapshot = structuredClone(roomState);
  snapshot.canAdvancePhase = resolveCanAdvancePhase(roomState);

  return snapshot;
};
