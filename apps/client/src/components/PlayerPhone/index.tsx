import { useMemo } from "react";
import type { Player, Team, TeamTheme } from "@wingnight/shared";

import { usePlayerRoomState } from "../../context/RoomStateContext";
import type { PlayerSeatController, PlayerSeatState } from "../../utils/playerSeat";
import { resolveTeamThemeById } from "../../utils/resolveTeamTheme";
import { useServerOrigin } from "../../utils/useServerOrigin";
import * as shellStyles from "../PortalShell/styles";
import { ClaimGoneCard } from "./ClaimGoneCard";
import { playerPhoneCopy } from "./copy";
import { FacePicker } from "./FacePicker";
import { PlayerIdleCard } from "./PlayerIdleCard";
import { ScanTheTvCard } from "./ScanTheTvCard";
import * as styles from "./styles";
import { usePlayerSeat } from "./usePlayerSeat";

type PlayerPhoneProps = {
  seat: PlayerSeatController | null;
};

type Seating = {
  teamByPlayerId: Map<string, Team>;
  teamThemeByPlayerId: Map<string, TeamTheme>;
};

const resolveSeating = (teams: Team[]): Seating => {
  const themeByTeamId = resolveTeamThemeById(teams);
  const teamByPlayerId = new Map<string, Team>();
  const teamThemeByPlayerId = new Map<string, TeamTheme>();

  for (const team of teams) {
    const theme = themeByTeamId.get(team.id);

    for (const playerId of team.playerIds) {
      teamByPlayerId.set(playerId, team);

      if (theme !== undefined) {
        teamThemeByPlayerId.set(playerId, theme);
      }
    }
  }

  return { teamByPlayerId, teamThemeByPlayerId };
};

const EMPTY_PLAYERS: Player[] = [];
const EMPTY_TEAMS: Team[] = [];

// A guest's phone at `/play`. Who is here and who sits where comes from the
// PLAYER snapshot; which face is this phone's comes from the seat, which no
// snapshot carries. The phone never advances the night or touches a score —
// the most it does is claim a face and let it go. No sound, ever: the TV is
// the room's only speaker.
export const PlayerPhone = ({ seat }: PlayerPhoneProps): JSX.Element => {
  const roomState = usePlayerRoomState();
  const seatState: PlayerSeatState = usePlayerSeat(seat);
  const serverOrigin = useServerOrigin();
  const players = roomState?.players ?? EMPTY_PLAYERS;
  const teams = roomState?.teams ?? EMPTY_TEAMS;
  const claimedPlayerIds = roomState?.claimedPlayerIds ?? [];
  const seating = useMemo(() => resolveSeating(teams), [teams]);

  const renderBody = (): JSX.Element => {
    if (seatState.status === "locked") {
      return <ScanTheTvCard />;
    }

    if (roomState === null) {
      return <p className={shellStyles.voice}>{playerPhoneCopy.findingTheParty}</p>;
    }

    if (seatState.status === "claim_gone") {
      return (
        <ClaimGoneCard
          playerId={seatState.playerId}
          reason={seatState.reason}
          onPickAgain={() => seat?.backToPicker()}
          onPlayHere={(playerId) => seat?.claim(playerId)}
        />
      );
    }

    const seatedPlayer =
      seatState.status === "seated" ? players.find((player) => player.id === seatState.playerId) : undefined;

    if (seatedPlayer !== undefined) {
      return (
        <PlayerIdleCard
          player={seatedPlayer}
          team={seating.teamByPlayerId.get(seatedPlayer.id) ?? null}
          teamTheme={seating.teamThemeByPlayerId.get(seatedPlayer.id) ?? null}
          serverOrigin={serverOrigin}
          onRelease={() => seat?.release()}
        />
      );
    }

    return (
      <FacePicker
        players={players}
        claimedPlayerIds={claimedPlayerIds}
        teamThemeByPlayerId={seating.teamThemeByPlayerId}
        serverOrigin={serverOrigin}
        claimingPlayerId={seatState.status === "picking" ? seatState.claimingPlayerId : null}
        refusal={seatState.status === "picking" ? seatState.refusal : null}
        ownPlayerId={seatState.status === "picking" ? seatState.ownPlayerId : null}
        onClaim={(playerId) => seat?.claim(playerId)}
      />
    );
  };

  return (
    <main
      className={shellStyles.root}
      data-player-seat-status={seatState.status}
      data-player-self={
        seatState.status === "seated" && seatState.confirmed ? seatState.playerId : undefined
      }
    >
      <div className={styles.column}>
        <div className={shellStyles.topBar}>
          <span className={shellStyles.wordmark}>{playerPhoneCopy.brandLabel}</span>
          {roomState !== null && players.length > 0 && (
            <span className={styles.joinedCount}>
              {playerPhoneCopy.formatJoinedCount(claimedPlayerIds.length, players.length)}
            </span>
          )}
        </div>
        {renderBody()}
      </div>
    </main>
  );
};
