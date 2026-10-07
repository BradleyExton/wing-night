import { useEffect, useState } from "react";
import type { SerializableValue } from "@wingnight/minigames-core";
import { CONTESTANT_CONTROLLERS, type ContestantMinigameHostView } from "@wingnight/shared";

import { resolveMinigameRendererBundle } from "../../../minigames/registry";
import { PhoneGameFrame } from "../../PhoneGameFrame";
import { useIsLandscape } from "../../PhoneGameFrame/useIsLandscape";
import { contestantGameCopy } from "./copy";
import * as styles from "./styles";

// Long enough to read "your leg" off a phone just turned sideways; the same beat the tablet holds
// a handoff for. The game is live under it the whole time.
export const CONTESTANT_HANDOFF_HOLD_MS = 1_800;

type ContestantGameProps = {
  // The game's host view, sent to this phone alone; null for the moment between the snapshot
  // that hands this phone the leg and the view that follows it.
  hostView: ContestantMinigameHostView | null;
  playerName: string;
  legIndex: number;
  previousPlayerName: string | null;
  activeTeamName: string | null;
  teamNameByTeamId: Map<string, string>;
  serverOrigin: string | null;
  onDispatchAction: (actionType: string, actionPayload: SerializableValue) => void;
};

// The contestant's own leg: the game's real host surface in the phone frame, seat "contestant" —
// no skip, no reset, no totals, no sound; the host keeps every hatch on the tablet and the TV is
// the room's only speaker. It opens on the handoff hold, the one beat the tablet would have spent
// changing hands.
export const ContestantGame = ({
  hostView,
  playerName,
  legIndex,
  previousPlayerName,
  activeTeamName,
  teamNameByTeamId,
  serverOrigin,
  onDispatchAction
}: ContestantGameProps): JSX.Element => {
  const [isHolding, setIsHolding] = useState(true);
  const isLandscape = useIsLandscape();
  const rendererBundle = hostView === null ? null : resolveMinigameRendererBundle(hostView.minigame);

  // The hold is a beat the player has to SEE, so its clock starts when the phone is on its side:
  // upright, the rotate card covers the game and the hold with it.
  useEffect(() => {
    if (!isHolding || !isLandscape) {
      return undefined;
    }

    const handle = window.setTimeout(() => {
      setIsHolding(false);
    }, CONTESTANT_HANDOFF_HOLD_MS);

    return (): void => {
      window.clearTimeout(handle);
    };
  }, [isHolding, isLandscape]);

  return (
    <div data-contestant-game={hostView?.minigame ?? "waiting"} data-contestant-leg={legIndex}>
      <PhoneGameFrame>
        {hostView === null || rendererBundle === null ? (
          <p className={styles.waiting}>{contestantGameCopy.waitingForLeg}</p>
        ) : (
          <rendererBundle.HostSurface
            phase="play"
            minigameType={hostView.minigame}
            minigameHostView={hostView}
            activeTeamName={activeTeamName}
            teamNameByTeamId={teamNameByTeamId}
            rail={
              <span className={styles.rail}>
                <span className={styles.railDot} aria-hidden />
                {contestantGameCopy.railLabel(playerName)}
              </span>
            }
            clock={null}
            canDispatchAction
            onDispatchAction={onDispatchAction}
            serverOrigin={serverOrigin}
            seat="contestant"
            handset={CONTESTANT_CONTROLLERS.PHONE}
          />
        )}
      </PhoneGameFrame>

      {isHolding && (
        <div className={styles.hold} data-contestant-handoff>
          <div className={styles.holdCard}>
            <p className={styles.holdEyebrow}>{contestantGameCopy.holdEyebrow(previousPlayerName)}</p>
            <p className={styles.holdTitle}>{contestantGameCopy.holdTitle}</p>
            <p className={styles.holdVoice}>{contestantGameCopy.holdVoice}</p>
          </div>
        </div>
      )}
    </div>
  );
};
