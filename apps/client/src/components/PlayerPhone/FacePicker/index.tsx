import type { Player, PlayerClaimRefusalReason, TeamTheme } from "@wingnight/shared";

import * as shellStyles from "../../PortalShell/styles";
import { PlayerBird } from "../PlayerBird";
import { facePickerCopy } from "./copy";
import * as styles from "./styles";

type FacePickerProps = {
  players: Player[];
  claimedPlayerIds: readonly string[];
  teamThemeByPlayerId: ReadonlyMap<string, TeamTheme>;
  serverOrigin: string | null;
  claimingPlayerId: string | null;
  refusal: PlayerClaimRefusalReason | null;
  // The face this phone holds, if any: claimed, but never taken from here.
  ownPlayerId?: string | null;
  onClaim: (playerId: string) => void;
};

const resolveFaceClassName = (isTaken: boolean, isPressed: boolean): string => {
  if (isTaken) {
    return styles.faceTaken;
  }

  return isPressed ? styles.facePressed : styles.face;
};

// Every face on tonight's roster; tap yours. A face another phone holds is
// greyed and cannot be tapped — the host frees it from the tablet if it is
// yours. This phone's own face stays tappable: re-claiming it hands back the
// secret. Teams are not chosen here: a seated face just wears its team's colour.
export const FacePicker = ({
  players,
  claimedPlayerIds,
  teamThemeByPlayerId,
  serverOrigin,
  claimingPlayerId,
  refusal,
  ownPlayerId = null,
  onClaim
}: FacePickerProps): JSX.Element => {
  const claimed = new Set(claimedPlayerIds);

  return (
    <>
      <div className={shellStyles.heading}>
        <p className={shellStyles.eyebrow}>{facePickerCopy.eyebrow}</p>
        <h1 className={shellStyles.title}>{facePickerCopy.title}</h1>
      </div>

      {players.length === 0 ? (
        <p className={shellStyles.voice}>{facePickerCopy.emptyRoster}</p>
      ) : (
        <ul className={styles.grid}>
          {players.map((player) => {
            const isTaken = claimed.has(player.id) && player.id !== ownPlayerId;
            const isPressed = player.id === claimingPlayerId;

            return (
              <li key={player.id}>
                <button
                  type="button"
                  className={resolveFaceClassName(isTaken, isPressed)}
                  disabled={isTaken || claimingPlayerId !== null}
                  aria-pressed={isPressed}
                  aria-label={
                    isTaken ? facePickerCopy.takenLabel(player.name) : facePickerCopy.claimLabel(player.name)
                  }
                  data-face-player-id={player.id}
                  data-face-taken={isTaken}
                  onClick={(): void => {
                    onClaim(player.id);
                  }}
                >
                  <PlayerBird
                    player={player}
                    teamTheme={teamThemeByPlayerId.get(player.id) ?? null}
                    serverOrigin={serverOrigin}
                    size="tile"
                  />
                  <span className={styles.name}>{player.name}</span>
                  {isTaken && <span className={styles.tag}>{facePickerCopy.taken}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {refusal !== null && (
        <p className={shellStyles.statusError} role="alert">
          {facePickerCopy.refusal(refusal)}
        </p>
      )}
      <p className={shellStyles.fine}>{facePickerCopy.hint}</p>
    </>
  );
};
