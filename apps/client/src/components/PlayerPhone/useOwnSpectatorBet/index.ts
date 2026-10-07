import { useSyncExternalStore } from "react";

import type { OwnSpectatorBet, SpectatorBetSlipController } from "../../../utils/spectatorBetSlip";

const subscribeToNothing = (): (() => void) => () => undefined;

// The phone's own pick as React state. Without a controller (no socket) the phone has placed none.
export const useOwnSpectatorBet = (controller: SpectatorBetSlipController | null): OwnSpectatorBet | null => {
  return useSyncExternalStore(
    controller?.subscribe ?? subscribeToNothing,
    () => controller?.getOwnBet() ?? null,
    () => controller?.getOwnBet() ?? null
  );
};
