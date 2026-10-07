import { shouldSettleMountedRun } from "@wingnight/surface";

type WatchedClimbInput = {
  status: "ready" | "running" | "done" | null;
  // This screen's own run for the climb, if it made one: whether its clock started and whether
  // it already reported the climb ended.
  localRun: { startedAtMs: number | null; hasEnded: boolean } | null;
  canAct: boolean;
};

// Whether a `running` climb this screen did not start should be handed to the server as ended:
// only on a screen that can act (a reload of the climber's own tablet), never on one that is only
// watching — a take-back, a reconnect, a second device — which would cut short a climb someone
// else is on (`shouldSettleMountedRun`, the rule FAPPY, SCHLONIC and BRAWL follow).
export const shouldEndWatchedClimb = ({ status, localRun, canAct }: WatchedClimbInput): boolean => {
  return (
    localRun !== null &&
    shouldSettleMountedRun({
      isRunLive: status === "running",
      hasLocalClock: localRun.startedAtMs !== null,
      hasEnded: localRun.hasEnded,
      canAct
    })
  );
};
