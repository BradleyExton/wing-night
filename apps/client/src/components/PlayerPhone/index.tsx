import { useEffect, useMemo, useRef } from "react";
import type { Player, Team, TeamTheme } from "@wingnight/shared";

import { usePlayerRoomState } from "../../context/RoomStateContext";
import type { ContestantLegController } from "../../utils/contestantLeg";
import type { PlayerSeatController, PlayerSeatState } from "../../utils/playerSeat";
import type { SpectatorBetSlipController } from "../../utils/spectatorBetSlip";
import { resolveTeamThemeById } from "../../utils/resolveTeamTheme";
import { useServerOrigin } from "../../utils/useServerOrigin";
import * as shellStyles from "../PortalShell/styles";
import { ClaimGoneCard } from "./ClaimGoneCard";
import { ContestantGame } from "./ContestantGame";
import { ContestantTurnCard } from "./ContestantTurnCard";
import { playerPhoneCopy } from "./copy";
import { FacePicker } from "./FacePicker";
import { PlayerIdleCard } from "./PlayerIdleCard";
import { resolvePhoneBet } from "./resolvePhoneBet";
import { resolvePhoneTurn, resolveTurnTeamId } from "./resolvePhoneTurn";
import { ScanTheTvCard } from "./ScanTheTvCard";
import { SpectatorBetCard } from "./SpectatorBetCard";
import * as styles from "./styles";
import { useContestantHostView } from "./useContestantHostView";
import { useOwnSpectatorBet } from "./useOwnSpectatorBet";
import { usePlayerSeat } from "./usePlayerSeat";

type PlayerPhoneProps = {
  seat: PlayerSeatController | null;
  // The phone's own leg of an arcade relay: the game's host view, sent to this phone alone, and
  // the road its input takes back. Null without a socket.
  contestantLeg: ContestantLegController | null;
  // The phone's own side bet on another team's turn: which button it pressed, which no snapshot
  // says before the turn settles, and the road a tap takes. Null without a socket.
  betSlip?: SpectatorBetSlipController | null;
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
export const PlayerPhone = ({ seat, contestantLeg, betSlip = null }: PlayerPhoneProps): JSX.Element => {
  const roomState = usePlayerRoomState();
  const seatState: PlayerSeatState = usePlayerSeat(seat);
  const serverOrigin = useServerOrigin();
  const players = roomState?.players ?? EMPTY_PLAYERS;
  const teams = roomState?.teams ?? EMPTY_TEAMS;
  const claimedPlayerIds = roomState?.claimedPlayerIds ?? [];
  const seating = useMemo(() => resolveSeating(teams), [teams]);
  const teamNameByTeamId = useMemo(() => new Map(teams.map((team) => [team.id, team.name])), [teams]);
  const seatedPlayer =
    seatState.status === "seated" ? players.find((player) => player.id === seatState.playerId) : undefined;
  const contestantPlayerId = roomState?.contestantTurn?.contestantPlayerId ?? null;
  // Who held the leg before this phone did, as this phone saw it: the handoff hold's name. Kept
  // a render behind on purpose — the render that hands this phone the leg still reads the last.
  const previousContestantRef = useRef<string | null>(null);
  const phoneTurn =
    roomState === null || seatedPlayer === undefined
      ? null
      : resolvePhoneTurn(roomState, seatedPlayer.id, previousContestantRef.current);
  const contestantHostView = useContestantHostView(contestantLeg, phoneTurn?.role === "play");
  const ownBet = useOwnSpectatorBet(betSlip);
  // Every phone off the playing team is a bet while another team takes its turn.
  const phoneBet =
    roomState === null || seatedPlayer === undefined ? null : resolvePhoneBet(roomState, seatedPlayer.id, ownBet);
  const nameOf = (playerId: string | null): string | null =>
    players.find((player) => player.id === playerId)?.name ?? null;

  useEffect(() => {
    if (contestantPlayerId !== null && contestantPlayerId !== seatedPlayer?.id) {
      previousContestantRef.current = contestantPlayerId;
    }
  }, [contestantPlayerId, seatedPlayer?.id]);

  // The one phone that shows the game: its own leg, on its own phone, sideways.
  if (phoneTurn?.role === "play" && seatedPlayer !== undefined) {
    const activeTurnTeamId = roomState === null ? null : resolveTurnTeamId(roomState);

    return (
      <ContestantGame
        key={phoneTurn.legIndex}
        hostView={contestantHostView}
        playerName={seatedPlayer.name}
        legIndex={phoneTurn.legIndex}
        previousPlayerName={phoneTurn.legIndex === 0 ? null : nameOf(phoneTurn.previousPlayerId)}
        activeTeamName={activeTurnTeamId === null ? null : (teamNameByTeamId.get(activeTurnTeamId) ?? null)}
        teamNameByTeamId={teamNameByTeamId}
        serverOrigin={serverOrigin}
        onDispatchAction={(actionType, actionPayload) => contestantLeg?.dispatch(actionType, actionPayload)}
      />
    );
  }

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

    if (seatedPlayer !== undefined && phoneTurn !== null && phoneTurn.role !== "play") {
      return (
        <ContestantTurnCard
          turn={phoneTurn}
          player={seatedPlayer}
          teamTheme={seating.teamThemeByPlayerId.get(seatedPlayer.id) ?? null}
          contestantName={nameOf(roomState.contestantTurn?.contestantPlayerId ?? null)}
          serverOrigin={serverOrigin}
        />
      );
    }

    if (seatedPlayer !== undefined && phoneBet !== null) {
      return (
        <SpectatorBetCard
          bet={phoneBet}
          teamName={teamNameByTeamId.get(phoneBet.teamId) ?? null}
          onPick={(pick) => betSlip?.place(pick)}
        />
      );
    }

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
