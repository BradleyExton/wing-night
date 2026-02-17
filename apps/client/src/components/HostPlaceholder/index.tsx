import type { ChangeEvent, FormEvent } from "react";
import { useMemo, useState } from "react";
import { Phase, type RoomState } from "@wingnight/shared";

import * as styles from "./styles";
import { hostPlaceholderCopy } from "./copy";

type HostPlaceholderProps = {
  roomState: RoomState | null;
  onNextPhase?: () => void;
  onCreateTeam?: (name: string) => void;
  onAssignPlayer?: (playerId: string, teamId: string | null) => void;
  onSetWingParticipation?: (playerId: string, didEat: boolean) => void;
  onRecordTriviaAttempt?: (isCorrect: boolean) => void;
};

const EMPTY_TEAMS: RoomState["teams"] = [];

export const HostPlaceholder = ({
  roomState,
  onNextPhase,
  onCreateTeam,
  onAssignPlayer,
  onSetWingParticipation,
  onRecordTriviaAttempt
}: HostPlaceholderProps): JSX.Element => {
  const [nextTeamName, setNextTeamName] = useState("");

  const assignedTeamByPlayerId = useMemo(() => {
    const map = new Map<string, string>();

    if (!roomState) {
      return map;
    }

    for (const team of roomState.teams) {
      for (const playerId of team.playerIds) {
        map.set(playerId, team.id);
      }
    }

    return map;
  }, [roomState]);

  const teamNameByTeamId = useMemo(() => {
    const map = new Map<string, string>();

    if (!roomState) {
      return map;
    }

    for (const team of roomState.teams) {
      map.set(team.id, team.name);
    }

    return map;
  }, [roomState]);

  const players = roomState?.players ?? [];
  const teams = roomState?.teams ?? EMPTY_TEAMS;
  const phase = roomState?.phase ?? null;
  const isSetupPhase = phase === Phase.SETUP;
  const isEatingPhase = phase === Phase.EATING;
  const isMinigameIntroPhase = phase === Phase.MINIGAME_INTRO;
  const isMinigamePlayPhase = phase === Phase.MINIGAME_PLAY;
  const isCompactSummaryPhase =
    phase === Phase.INTRO ||
    phase === Phase.ROUND_INTRO ||
    phase === Phase.ROUND_RESULTS ||
    phase === Phase.FINAL_RESULTS;
  const isTriviaMinigamePlayPhase =
    isMinigamePlayPhase &&
    roomState?.currentRoundConfig?.minigame === "TRIVIA";
  const wingParticipationByPlayerId = roomState?.wingParticipationByPlayerId ?? {};
  const currentTriviaPrompt = roomState?.currentTriviaPrompt ?? null;
  const activeTurnTeamId = roomState?.activeTurnTeamId ?? null;
  const activeTurnTeamName =
    activeTurnTeamId !== null
      ? (teamNameByTeamId.get(activeTurnTeamId) ??
        hostPlaceholderCopy.noAssignedTeamLabel)
      : hostPlaceholderCopy.noAssignedTeamLabel;
  const setupMutationsDisabled = onCreateTeam === undefined || !isSetupPhase;
  const assignmentDisabled = onAssignPlayer === undefined || !isSetupPhase;
  const participationDisabled =
    onSetWingParticipation === undefined || !isEatingPhase;
  const triviaAttemptDisabled =
    onRecordTriviaAttempt === undefined ||
    !isTriviaMinigamePlayPhase ||
    activeTurnTeamId === null ||
    currentTriviaPrompt === null;
  const shouldRenderSetupSections = isSetupPhase || isMinigameIntroPhase;
  const shouldRenderPlayersSection =
    shouldRenderSetupSections || isEatingPhase || isMinigamePlayPhase;
  const currentRoundConfig = roomState?.currentRoundConfig ?? null;
  const sortedStandings = useMemo(() => {
    return [...teams].sort((leftTeam, rightTeam) => {
      if (rightTeam.totalScore !== leftTeam.totalScore) {
        return rightTeam.totalScore - leftTeam.totalScore;
      }

      return leftTeam.name.localeCompare(rightTeam.name);
    });
  }, [teams]);

  const handleCreateTeamSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!onCreateTeam || !isSetupPhase) {
      return;
    }

    const normalizedTeamName = nextTeamName.trim();

    if (normalizedTeamName.length === 0) {
      return;
    }

    onCreateTeam(normalizedTeamName);
    setNextTeamName("");
  };

  const handleAssignmentChange = (
    event: ChangeEvent<HTMLSelectElement>,
    playerId: string
  ): void => {
    if (!onAssignPlayer || !isSetupPhase) {
      return;
    }

    const selectedTeamId = event.target.value;
    onAssignPlayer(playerId, selectedTeamId.length === 0 ? null : selectedTeamId);
  };

  const handleWingParticipationChange = (
    playerId: string,
    didEat: boolean
  ): void => {
    if (!onSetWingParticipation || !isEatingPhase) {
      return;
    }

    onSetWingParticipation(playerId, didEat);
  };

  const handleRecordTriviaAttempt = (isCorrect: boolean): void => {
    if (!onRecordTriviaAttempt || !isTriviaMinigamePlayPhase) {
      return;
    }

    onRecordTriviaAttempt(isCorrect);
  };

  return (
    <main className={styles.container}>
      <div className={styles.panel}>
        <h1 className={styles.heading}>{hostPlaceholderCopy.title}</h1>
        <p className={styles.subtext}>{hostPlaceholderCopy.description}</p>

        <div className={styles.controlsRow}>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={onNextPhase}
            disabled={onNextPhase === undefined}
          >
            {hostPlaceholderCopy.nextPhaseButtonLabel}
          </button>
        </div>

        {!roomState && (
          <p className={styles.subtext}>{hostPlaceholderCopy.loadingStateLabel}</p>
        )}
        {roomState && !isSetupPhase && (
          <p className={styles.lockNotice}>{hostPlaceholderCopy.setupLockedLabel}</p>
        )}

        {isCompactSummaryPhase && roomState && phase !== null && (
          <section className={styles.compactGrid}>
            <div className={styles.card}>
              <h2 className={styles.sectionHeading}>
                {hostPlaceholderCopy.compactPhaseStatusTitle}
              </h2>
              <p className={styles.compactPhaseBadge}>
                {hostPlaceholderCopy.compactPhaseLabel(phase)}
              </p>
              <p className={styles.sectionDescription}>
                {hostPlaceholderCopy.compactPhaseDescription(phase)}
              </p>
            </div>

            <div className={styles.card}>
              <h2 className={styles.sectionHeading}>
                {hostPlaceholderCopy.compactRoundContextTitle}
              </h2>
              {currentRoundConfig && (
                <ul className={styles.compactMetaList}>
                  <li>
                    {hostPlaceholderCopy.compactRoundProgressLabel(
                      roomState.currentRound,
                      roomState.totalRounds
                    )}
                  </li>
                  <li>{hostPlaceholderCopy.compactRoundLabel(currentRoundConfig.label)}</li>
                  <li>{hostPlaceholderCopy.compactSauceLabel(currentRoundConfig.sauce)}</li>
                  <li>
                    {hostPlaceholderCopy.compactMinigameLabel(
                      currentRoundConfig.minigame
                    )}
                  </li>
                </ul>
              )}
              {!currentRoundConfig && (
                <p className={styles.sectionDescription}>
                  {hostPlaceholderCopy.compactNoRoundContextLabel}
                </p>
              )}
            </div>

            <div className={styles.card}>
              <h2 className={styles.sectionHeading}>
                {hostPlaceholderCopy.compactStandingsTitle}
              </h2>
              {sortedStandings.length > 0 && (
                <ul className={styles.compactStandingsList}>
                  {sortedStandings.map((team, index) => {
                    const isLeader = index === 0;

                    return (
                      <li
                        className={`${styles.compactStandingsRow} ${
                          isLeader ? styles.compactLeaderRow : ""
                        }`}
                        key={team.id}
                      >
                        <span className={styles.teamName}>{team.name}</span>
                        <div className={styles.compactStandingsMeta}>
                          {isLeader && (
                            <span className={styles.compactLeaderLabel}>
                              {hostPlaceholderCopy.compactLeaderLabel}
                            </span>
                          )}
                          <span className={styles.compactScore}>
                            {hostPlaceholderCopy.compactScoreLabel(team.totalScore)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {sortedStandings.length === 0 && (
                <p className={styles.sectionDescription}>
                  {hostPlaceholderCopy.compactNoStandingsLabel}
                </p>
              )}
            </div>

            <div className={styles.card}>
              <h2 className={styles.sectionHeading}>
                {hostPlaceholderCopy.compactNextActionTitle}
              </h2>
              <p className={styles.compactHint}>
                {hostPlaceholderCopy.compactNextActionHint(phase)}
              </p>
            </div>
          </section>
        )}

        {!isCompactSummaryPhase && (
          <>
            {shouldRenderSetupSections && (
              <section className={styles.sectionGrid}>
                <div className={styles.card}>
                  <h2 className={styles.sectionHeading}>
                    {hostPlaceholderCopy.teamSetupTitle}
                  </h2>
                  <p className={styles.sectionDescription}>
                    {hostPlaceholderCopy.teamSetupDescription}
                  </p>
                  <form
                    className={styles.teamCreateForm}
                    onSubmit={handleCreateTeamSubmit}
                  >
                    <div className={styles.teamInputGroup}>
                      <label className={styles.teamInputLabel} htmlFor="team-name-input">
                        {hostPlaceholderCopy.teamNameInputLabel}
                      </label>
                      <input
                        id="team-name-input"
                        className={styles.teamInput}
                        value={nextTeamName}
                        disabled={setupMutationsDisabled}
                        onChange={(event): void => {
                          setNextTeamName(event.target.value);
                        }}
                        placeholder={hostPlaceholderCopy.teamNameInputPlaceholder}
                      />
                    </div>
                    <button
                      className={styles.actionButton}
                      type="submit"
                      disabled={setupMutationsDisabled}
                    >
                      {hostPlaceholderCopy.createTeamButtonLabel}
                    </button>
                  </form>
                </div>

                <div className={styles.card}>
                  <h2 className={styles.sectionHeading}>
                    {hostPlaceholderCopy.teamsSectionTitle}
                  </h2>
                  {teams.length === 0 && (
                    <p className={styles.sectionDescription}>
                      {hostPlaceholderCopy.noTeamsLabel}
                    </p>
                  )}
                  {teams.length > 0 && (
                    <ul className={styles.list}>
                      {teams.map((team) => {
                        return (
                          <li className={styles.listRow} key={team.id}>
                            <span className={styles.teamName}>{team.name}</span>
                            <span className={styles.teamMeta}>
                              {hostPlaceholderCopy.teamMembersLabel(team.playerIds.length)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            )}

            {shouldRenderPlayersSection && (
              <section className={`${styles.card} ${styles.playersCard}`}>
                <h2 className={styles.sectionHeading}>
                  {hostPlaceholderCopy.playersSectionTitle}
                </h2>
                {isEatingPhase && (
                  <p className={styles.sectionDescription}>
                    {hostPlaceholderCopy.eatingParticipationDescription}
                  </p>
                )}
                {isTriviaMinigamePlayPhase && (
                  <>
                    <p className={styles.sectionDescription}>
                      {hostPlaceholderCopy.triviaSectionDescription}
                    </p>
                    <div className={styles.triviaMeta}>
                      <div>
                        <p className={styles.triviaLabel}>
                          {hostPlaceholderCopy.triviaActiveTeamLabel(activeTurnTeamName)}
                        </p>
                      </div>
                      {currentTriviaPrompt && (
                        <>
                          <div>
                            <p className={styles.triviaLabel}>
                              {hostPlaceholderCopy.triviaQuestionLabel}
                            </p>
                            <p className={styles.triviaValue}>
                              {currentTriviaPrompt.question}
                            </p>
                          </div>
                          <div>
                            <p className={styles.triviaLabel}>
                              {hostPlaceholderCopy.triviaAnswerLabel}
                            </p>
                            <p className={styles.triviaValue}>
                              {currentTriviaPrompt.answer}
                            </p>
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
                          handleRecordTriviaAttempt(true);
                        }}
                      >
                        {hostPlaceholderCopy.triviaCorrectButtonLabel}
                      </button>
                      <button
                        className={styles.actionButton}
                        type="button"
                        disabled={triviaAttemptDisabled}
                        onClick={(): void => {
                          handleRecordTriviaAttempt(false);
                        }}
                      >
                        {hostPlaceholderCopy.triviaIncorrectButtonLabel}
                      </button>
                    </div>
                  </>
                )}
                {players.length === 0 && (
                  <p className={styles.sectionDescription}>
                    {hostPlaceholderCopy.noPlayersLabel}
                  </p>
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
                              aria-label={hostPlaceholderCopy.assignmentSelectLabel(
                                player.name
                              )}
                              className={styles.assignmentSelect}
                              value={assignedTeamId}
                              onChange={(event): void => {
                                handleAssignmentChange(event, player.id);
                              }}
                              disabled={assignmentDisabled}
                            >
                              <option value="">
                                {hostPlaceholderCopy.unassignedOptionLabel}
                              </option>
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
                                  ? hostPlaceholderCopy.assignedTeamLabel(
                                      teamNameByTeamId.get(assignedTeamId) ??
                                        hostPlaceholderCopy.noAssignedTeamLabel
                                    )
                                  : hostPlaceholderCopy.noAssignedTeamLabel}
                              </span>
                              <label className={styles.participationLabel}>
                                <input
                                  className={styles.participationControl}
                                  type="checkbox"
                                  checked={wingParticipationByPlayerId[player.id] === true}
                                  onChange={(event): void => {
                                    handleWingParticipationChange(
                                      player.id,
                                      event.target.checked
                                    );
                                  }}
                                  disabled={
                                    participationDisabled || assignedTeamId.length === 0
                                  }
                                  aria-label={hostPlaceholderCopy.wingParticipationToggleLabel(
                                    player.name
                                  )}
                                />
                                <span>{hostPlaceholderCopy.ateWingLabel}</span>
                              </label>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
};
