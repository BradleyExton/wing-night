export type MountedRunInput = {
  /** The server has the run under way: FAPPY's leg `flying`, a SCHLONIC run or BRAWL block `running`. */
  isRunLive: boolean;
  /** This screen started the run's clock itself — its own finger is on it. */
  hasLocalClock: boolean;
  /** This screen has already reported the run ended. */
  hasEnded: boolean;
  /** This seat may dispatch the game's actions right now. */
  canAct: boolean;
};

/**
 * Whether an arcade runner should report a run ended that it found already under way. A runner that
 * mounts on a live run with no clock of its own is not playing it: after a reload the run's player
 * is gone, so the screen that can act hands the server the log it has, and the server referees it.
 * A screen that cannot act is only watching — a take-back, a reconnect, a second device — and must
 * never end a run someone else is playing: the log is strictly ascending, so a run another device
 * started can never be continued, only cut short. FAPPY, SCHLONIC and BRAWL each ask this, with
 * `canAct` among their effect's dependencies, so a reload that earns its controls after mounting
 * still settles the run.
 */
export const shouldSettleMountedRun = ({
  isRunLive,
  hasLocalClock,
  hasEnded,
  canAct
}: MountedRunInput): boolean => {
  return canAct && isRunLive && !hasLocalClock && !hasEnded;
};
