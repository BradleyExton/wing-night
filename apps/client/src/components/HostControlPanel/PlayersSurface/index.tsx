import type { TriviaPrompt } from "@wingnight/shared";
import type { Player, Team } from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type PlayersSurfaceProps = {
  players: Player[];
  teams: Team[];
  assignedTeamByPlayerId: Map<string, string>;
  teamNameByTeamId: Map<string, string>;
  isSetupPhase: boolean;
  isEatingPhase: boolean;
  isTriviaMinigamePlayPhase: boolean;
  wingParticipationByPlayerId: Record<string, boolean>;
  currentTriviaPrompt: TriviaPrompt | null;
  activeTurnTeamName: string;
  assignmentDisabled: boolean;
  participationDisabled: boolean;
  triviaAttemptDisabled: boolean;
  onAssignPlayer: (playerId: string, selectedTeamId: string) => void;
  onSetWingParticipation: (playerId: string, didEat: boolean) => void;
  onRecordTriviaAttempt: (isCorrect: boolean) => void;
};

export const PlayersSurface = ({
  players,
  teams,
  assignedTeamByPlayerId,
  teamNameByTeamId,
  isSetupPhase,
  isEatingPhase,
  isTriviaMinigamePlayPhase,
  wingParticipationByPlayerId,
  currentTriviaPrompt,
  activeTurnTeamName,
  assignmentDisabled,
  participationDisabled,
  triviaAttemptDisabled,
  onAssignPlayer,
  onSetWingParticipation,
  onRecordTriviaAttempt
}: PlayersSurfaceProps): JSX.Element => {
  return (
    <section className={`${styles.card} ${styles.playersCard}`}>
      <h2 className={styles.sectionHeading}>{hostControlPanelCopy.playersSectionTitle}</h2>
      {isEatingPhase && (
        <p className={styles.sectionDescription}>
          {hostControlPanelCopy.eatingParticipationDescription}
        </p>
      )}
      {isTriviaMinigamePlayPhase && (
        <>
          <p className={styles.sectionDescription}>
            {hostControlPanelCopy.triviaSectionDescription}
          </p>
          <div className={styles.triviaMeta}>
            <div>
              <p className={styles.triviaLabel}>
                {hostControlPanelCopy.triviaActiveTeamLabel(activeTurnTeamName)}
              </p>
            </div>
            {currentTriviaPrompt && (
              <>
                <div>
                  <p className={styles.triviaLabel}>
                    {hostControlPanelCopy.triviaQuestionLabel}
                  </p>
                  <p className={styles.triviaValue}>{currentTriviaPrompt.question}</p>
                </div>
                <div>
                  <p className={styles.triviaLabel}>
                    {hostControlPanelCopy.triviaAnswerLabel}
                  </p>
                  <p className={styles.triviaValue}>{currentTriviaPrompt.answer}</p>
                </div>
              </>
            )}
          </div>
          <div className={styles.triviaActions}>
            <button
              className={styles.actionButton}
              type="button"
              disabled={triviaAttemptDisabled}
              onClick={(): void => {
                onRecordTriviaAttempt(true);
              }}
            >
              {hostControlPanelCopy.triviaCorrectButtonLabel}
            </button>
            <button
              className={styles.actionButton}
              type="button"
              disabled={triviaAttemptDisabled}
              onClick={(): void => {
                onRecordTriviaAttempt(false);
              }}
            >
              {hostControlPanelCopy.triviaIncorrectButtonLabel}
            </button>
          </div>
        </>
      )}

      {players.length === 0 && (
        <p className={styles.sectionDescription}>{hostControlPanelCopy.noPlayersLabel}</p>
      )}
      {players.length > 0 && (
        <ul className={styles.list}>
          {players.map((player) => {
            const assignedTeamId = assignedTeamByPlayerId.get(player.id) ?? "";

            return (
              <li key={player.id} className={styles.listRow}>
                <span className={styles.playerName}>{player.name}</span>
                {isSetupPhase && (
                  <select
                    aria-label={hostControlPanelCopy.assignmentSelectLabel(player.name)}
                    className={styles.assignmentSelect}
                    value={assignedTeamId}
                    onChange={(event): void => {
                      onAssignPlayer(player.id, event.target.value);
                    }}
                    disabled={assignmentDisabled}
                  >
                    <option value="">{hostControlPanelCopy.unassignedOptionLabel}</option>
                    {teams.map((team) => {
                      return (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      );
                    })}
                  </select>
                )}
                {isEatingPhase && (
                  <div className={styles.participationRow}>
                    <span className={styles.playerMeta}>
                      {assignedTeamId.length > 0
                        ? hostControlPanelCopy.assignedTeamLabel(
                            teamNameByTeamId.get(assignedTeamId) ??
                              hostControlPanelCopy.noAssignedTeamLabel
                          )
                        : hostControlPanelCopy.noAssignedTeamLabel}
                    </span>
                    <label className={styles.participationLabel}>
                      <input
                        className={styles.participationControl}
                        type="checkbox"
                        checked={wingParticipationByPlayerId[player.id] === true}
                        onChange={(event): void => {
                          onSetWingParticipation(player.id, event.target.checked);
                        }}
                        disabled={participationDisabled || assignedTeamId.length === 0}
                        aria-label={hostControlPanelCopy.wingParticipationToggleLabel(
                          player.name
                        )}
                      />
                      <span>{hostControlPanelCopy.ateWingLabel}</span>
                    </label>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
