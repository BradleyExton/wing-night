import type { SerializableValue } from "@wingnight/minigames-core";
import { SilentSurface, TakeoverStage, useVerdictDispatch } from "@wingnight/surface";
import type { ContestantTurn } from "@wingnight/shared";

import { useHostHandlers } from "../../../context/HostHandlersContext";
import { useHostRoomState } from "../../../context/RoomStateContext";
import { resolveMinigameRendererBundle } from "../../../minigames/registry";
import { resolveLegHandset } from "../../../utils/resolveContestantHandset";
import { useServerOrigin } from "../../../utils/useServerOrigin";
import { ScaledDeviceFrame } from "../../ScaledDeviceFrame";
import { HostMiniRail } from "../HostMiniRail";
import { TakeoverTimerChip } from "../HostPhaseBody/MinigamePlayTakeover/TakeoverTimerChip";
import { contestantPhoneMonitorCopy } from "./copy";
import { resolveMonitorHatches } from "./resolveMonitorHatches";
import { useHandoffSettle } from "./useHandoffSettle";
import * as styles from "./styles";

// The TV's own canvas: the mirror is laid out at the TV's size and scaled into the stage body.
const TV_DEVICE = { width: 1920, height: 1080 } as const;

type ContestantPhoneMonitorProps = {
  turn: ContestantTurn;
  activeTeamName: string | null;
};

// The tablet while a contestant's phone plays the leg in hand. The tablet must not run the game's
// runner — the phone is the leg's one log writer — so it shows the TV's picture instead, silent
// (the TV is the room's only speaker), and keeps every hatch: Take it back, skip, reset, and
// JOUST's next shot. When the phone drops mid-leg, the leg waits and Take it back is the prompt.
export const ContestantPhoneMonitor = ({ turn, activeTeamName }: ContestantPhoneMonitorProps): JSX.Element => {
  const roomState = useHostRoomState();
  const handlers = useHostHandlers();
  const serverOrigin = useServerOrigin();
  const view = roomState?.minigameDisplayView ?? null;
  const rendererBundle = resolveMinigameRendererBundle(turn.minigame);
  const players = roomState?.players ?? [];
  const nameOf = (playerId: string | null): string | null =>
    players.find((player) => player.id === playerId)?.name ?? null;
  const isDropped = turn.droppedPlayerId !== null;
  const isHandoffSettling = useHandoffSettle(turn.legIndex);
  const contestantName = nameOf(turn.droppedPlayerId ?? turn.contestantPlayerId);
  const { dispatchVerdict, isSettling } = useVerdictDispatch(
    (actionType: string, actionPayload: SerializableValue): void => {
      handlers.onDispatchMinigameAction?.(turn.minigame, actionType, actionPayload);
    }
  );
  const takeBack = (): void => {
    handlers.onTakeBackContestantLeg?.();
  };
  const takeBackButton = (
    <button
      className={styles.primaryButton}
      type="button"
      // Not in the handoff beat either: the mirror still shows the leg that just ended, and a take
      // back then would restart the NEXT player's leg.
      disabled={handlers.onTakeBackContestantLeg === undefined || isHandoffSettling}
      onClick={takeBack}
      data-contestant-take-back
    >
      {contestantPhoneMonitorCopy.takeBackLabel}
    </button>
  );

  return (
    <TakeoverStage
      rail={<HostMiniRail />}
      clock={<TakeoverTimerChip />}
      counter={
        <span
          className={`${styles.status} ${isDropped ? styles.statusDropped : styles.statusLive}`}
          data-contestant-monitor={isDropped ? "dropped" : "phone"}
        >
          {isDropped
            ? contestantPhoneMonitorCopy.droppedChip(contestantName)
            : contestantPhoneMonitorCopy.onPhone(contestantName)}
        </span>
      }
      actions={
        <div className={styles.actions}>
          {!isDropped && takeBackButton}
          {resolveMonitorHatches(view).map((hatch) => (
            <button
              key={hatch.actionType}
              className={styles.secondaryButton}
              type="button"
              disabled={
                !hatch.isEnabled ||
                isSettling ||
                (hatch.isLegScoped && isHandoffSettling) ||
                handlers.onDispatchMinigameAction === undefined
              }
              onClick={(): void => {
                dispatchVerdict(hatch.actionType, {});
              }}
            >
              {hatch.label}
            </button>
          ))}
          {!isDropped && <span className={styles.hint}>{contestantPhoneMonitorCopy.takeBackHint}</span>}
        </div>
      }
    >
      <div className={styles.mirrorArea}>
        <ScaledDeviceFrame
          frameClassName={styles.mirrorFrame}
          deviceWidth={TV_DEVICE.width}
          deviceHeight={TV_DEVICE.height}
        >
          <div className={styles.mirrorShell} data-contestant-mirror={turn.minigame}>
            {rendererBundle === null || view === null ? (
              <p className={styles.waiting}>{contestantPhoneMonitorCopy.waitingForView}</p>
            ) : (
              <SilentSurface>
                <rendererBundle.DisplaySurface
                  phase="play"
                  minigameType={turn.minigame}
                  minigameDisplayView={view}
                  activeTeamName={activeTeamName}
                  clock={null}
                  clockLine={null}
                  serverOrigin={serverOrigin}
                  handset={resolveLegHandset(turn)}
                />
              </SilentSurface>
            )}
          </div>
        </ScaledDeviceFrame>
        {isDropped && (
          <div className={styles.dropOverlay} data-contestant-dropped={turn.droppedPlayerId ?? undefined}>
            <div className={styles.dropCard}>
              <p className={styles.dropTitle}>{contestantPhoneMonitorCopy.droppedTitle(contestantName)}</p>
              <p className={styles.hint}>{contestantPhoneMonitorCopy.droppedBody}</p>
              {takeBackButton}
            </div>
          </div>
        )}
      </div>
    </TakeoverStage>
  );
};
