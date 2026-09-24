import type { Player, Team, TeamTheme } from "@wingnight/shared";

import { quickPlayLauncherCopy } from "../copy";
import type { QuickPlayDraft } from "../quickPlayDraft";
import * as styles from "./styles";

type TeamDealerProps = {
  players: Player[];
  presetTeams: Team[];
  teamThemeByTeamId: Map<string, TeamTheme>;
  draft: QuickPlayDraft;
  maxTeamCount: number;
  minTeamCount: number;
  onSetTeamCount: (teamCount: number) => void;
  onShuffle: () => void;
  onCyclePlayerSeat: (playerId: string) => void;
};

const resolveTeamCountOptions = (minTeamCount: number, maxTeamCount: number): number[] => {
  const options: number[] = [];

  for (let teamCount = minTeamCount; teamCount <= maxTeamCount; teamCount += 1) {
    options.push(teamCount);
  }

  return options;
};

// The deal, laid out one column per team. The teams are the pack's own — the
// names, genres and anthems the room already knows — so the first team's
// briefing on the TV looks exactly like it would on the night.
export const TeamDealer = ({
  players,
  presetTeams,
  teamThemeByTeamId,
  draft,
  maxTeamCount,
  minTeamCount,
  onSetTeamCount,
  onShuffle,
  onCyclePlayerSeat
}: TeamDealerProps): JSX.Element => {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const dealtTeams = presetTeams.slice(0, draft.teamCount);

  return (
    <section className={styles.group}>
      <div className={styles.groupHead}>
        <span>{quickPlayLauncherCopy.teamsSectionTitle}</span>
        <span className={styles.groupCount}>{draft.teamCount}</span>
      </div>
      <div className={styles.controls}>
        <span className={styles.controlLabel}>{quickPlayLauncherCopy.teamCountLabel}</span>
        <div className={styles.chipRow} role="group" aria-label={quickPlayLauncherCopy.teamCountLabel}>
          {resolveTeamCountOptions(minTeamCount, maxTeamCount).map((teamCount) => {
            const isActive = teamCount === draft.teamCount;

            return (
              <button
                key={teamCount}
                type="button"
                className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
                aria-pressed={isActive}
                aria-label={quickPlayLauncherCopy.teamCountChipAriaLabel(teamCount)}
                onClick={(): void => {
                  onSetTeamCount(teamCount);
                }}
              >
                {teamCount}
              </button>
            );
          })}
        </div>
        <button type="button" className={styles.actionButton} onClick={onShuffle}>
          {quickPlayLauncherCopy.shuffleButtonLabel}
        </button>
      </div>
      <div className={styles.columns}>
        {dealtTeams.map((team, seat) => {
          const colorVariant = teamThemeByTeamId.get(team.id)?.colorVariant;
          const memberIds = draft.presentPlayerIds.filter(
            (playerId) => draft.seatByPlayerId[playerId] === seat
          );

          return (
            <div key={team.id} className={styles.column} data-quick-play-team={team.id}>
              <span className={styles.teamName}>
                <span
                  className={`${styles.teamDot} ${colorVariant?.dotAccentClassName ?? ""}`}
                  aria-hidden
                />
                {team.name}
              </span>
              {memberIds.length === 0 && (
                <span className={styles.emptyTeam}>{quickPlayLauncherCopy.teamEmptyLabel}</span>
              )}
              {memberIds.map((playerId) => {
                const playerName = playerById.get(playerId)?.name ?? playerId;

                return (
                  <button
                    key={playerId}
                    type="button"
                    className={styles.member}
                    aria-label={quickPlayLauncherCopy.teamMemberAriaLabel(playerName, team.name)}
                    onClick={(): void => {
                      onCyclePlayerSeat(playerId);
                    }}
                  >
                    {playerName}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      <p className={styles.hint}>{quickPlayLauncherCopy.teamsHint}</p>
    </section>
  );
};
