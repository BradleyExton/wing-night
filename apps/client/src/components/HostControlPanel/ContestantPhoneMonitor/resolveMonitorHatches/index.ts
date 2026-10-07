import type { MinigameDisplayView } from "@wingnight/shared";

import { contestantPhoneMonitorCopy } from "../copy";

const { hatchLabels } = contestantPhoneMonitorCopy;

// The host's hatches for an arcade leg a phone is playing — the same moves the game's own host
// surface offers on the tablet, minus the inputs, which are the phone's. Every one of them always
// lands on the server, whoever holds the leg. JOUST adds its pacing: the next shot is the room's
// beat, called from the tablet once the replay has landed on the TV.
export type MonitorHatch = {
  actionType: string;
  label: string;
  isEnabled: boolean;
  // A skip acts on the leg in hand, so it waits out the handoff beat (`useHandoffSettle`); a
  // reset, or JOUST's next shot once the shot has landed, does not.
  isLegScoped: boolean;
};

export const resolveMonitorHatches = (view: MinigameDisplayView | null): MonitorHatch[] => {
  if (view === null) {
    return [];
  }

  const reset: MonitorHatch = { actionType: "resetTurn", label: hatchLabels.resetTurn, isEnabled: true, isLegScoped: false };

  switch (view.minigame) {
    case "FAPPY":
      return [
        {
          actionType: "skipLeg",
          label: hatchLabels.skipLeg,
          isEnabled: view.phase === "ready" || view.phase === "flying",
          isLegScoped: true
        },
        reset
      ];
    case "SCHLONIC":
      return [
        {
          actionType: "skipRun",
          label: hatchLabels.skipRun,
          isEnabled: view.phase === "ready" || view.phase === "running",
          isLegScoped: true
        },
        reset
      ];
    case "BRAWL":
      return [
        {
          actionType: "skipBlock",
          label: hatchLabels.skipBlock,
          isEnabled: view.phase === "ready" || view.phase === "running",
          isLegScoped: true
        },
        reset
      ];
    case "JOUST":
      return [
        { actionType: "nextShot", label: hatchLabels.nextShot, isEnabled: view.phase === "resolved", isLegScoped: false },
        { actionType: "skipShot", label: hatchLabels.skipShot, isEnabled: view.phase === "aiming", isLegScoped: true },
        reset
      ];
    default:
      return [];
  }
};
