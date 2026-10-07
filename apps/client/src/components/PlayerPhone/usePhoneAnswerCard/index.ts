import { useSyncExternalStore } from "react";
import type { MinigamePlayerView } from "@wingnight/shared";

import type { PhoneAnswerCardController } from "../../../utils/phoneAnswerCard";

const subscribeToNothing = (): (() => void) => () => undefined;

// The phone's own answer card as React state. Without a controller (no socket) it has none.
export const usePhoneAnswerCard = (controller: PhoneAnswerCardController | null): MinigamePlayerView | null => {
  return useSyncExternalStore(
    controller?.subscribe ?? subscribeToNothing,
    () => controller?.getView() ?? null,
    () => controller?.getView() ?? null
  );
};
