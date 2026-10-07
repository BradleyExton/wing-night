import { useSyncExternalStore } from "react";

import type { PlayerSeatController, PlayerSeatState } from "../../../utils/playerSeat";

const LOCKED: PlayerSeatState = { status: "locked" };

const subscribeToNothing = (): (() => void) => () => undefined;

// The phone's own seat as React state. Without a controller (no socket, a
// server render) the phone has nothing to sit on, which reads as "scan the TV".
export const usePlayerSeat = (controller: PlayerSeatController | null): PlayerSeatState => {
  return useSyncExternalStore(
    controller?.subscribe ?? subscribeToNothing,
    () => controller?.getState() ?? LOCKED,
    () => controller?.getState() ?? LOCKED
  );
};
