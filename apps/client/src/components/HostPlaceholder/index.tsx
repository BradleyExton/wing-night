import type { ChangeEvent, FormEvent } from "react";
import { useMemo, useState } from "react";
import { Phase, type RoomState } from "@wingnight/shared";

import {
  actionButtonClassName,
  assignmentSelectClassName,
  cardClassName,
  containerClassName,
  controlsRowClassName,
  headingClassName,
  lockNoticeClassName,
  listClassName,
  listRowClassName,
  panelClassName,
  participationControlClassName,
  participationLabelClassName,
  participationRowClassName,
  playersCardClassName,
  playerMetaClassName,
  playerNameClassName,
  primaryButtonClassName,
  sectionDescriptionClassName,
  sectionGridClassName,
  sectionHeadingClassName,
  subtextClassName,
  teamCreateFormClassName,
  teamInputClassName,
  teamInputGroupClassName,
  teamInputLabelClassName,
  teamMetaClassName,
  teamNameClassName
} from "./styles";
import { hostPlaceholderCopy } from "./copy";

type HostPlaceholderProps = {
  roomState: RoomState | null;
  onNextPhase?: () => void;
  onCreateTeam?: (name: string) => void;
  onAssignPlayer?: (playerId: string, teamId: string | null) => void;
  onSetWingParticipation?: (playerId: string, didEat: boolean) => void;
};

export const HostPlaceholder = ({
  roomState,
  onNextPhase,
  onCreateTeam,
  onAssignPlayer,
  onSetWingParticipation
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
  const teams = roomState?.teams ?? [];
  const isSetupPhase = roomState?.phase === Phase.SETUP;
  const isEatingPhase = roomState?.phase === Phase.EATING;
  const wingParticipationByPlayerId = roomState?.wingParticipationByPlayerId ?? {};
  const setupMutationsDisabled = onCreateTeam === undefined || !isSetupPhase;
  const assignmentDisabled = onAssignPlayer === undefined || !isSetupPhase;
  const participationDisabled =
    onSetWingParticipation === undefined || !isEatingPhase;

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

  return (
    <main className={containerClassName}>
      <div className={panelClassName}>
        <h1 className={headingClassName}>{hostPlaceholderCopy.title}</h1>
        <p className={subtextClassName}>{hostPlaceholderCopy.description}</p>

        <div className={controlsRowClassName}>
          <button
            className={primaryButtonClassName}
            type="button"
            onClick={onNextPhase}
            disabled={onNextPhase === undefined}
          >
            {hostPlaceholderCopy.nextPhaseButtonLabel}
          </button>
        </div>

        {!roomState && (
          <p className={subtextClassName}>{hostPlaceholderCopy.loadingStateLabel}</p>
        )}
        {roomState && !isSetupPhase && (
          <p className={lockNoticeClassName}>{hostPlaceholderCopy.setupLockedLabel}</p>
        )}

        <section className={sectionGridClassName}>
          <div className={cardClassName}>
            <h2 className={sectionHeadingClassName}>
              {hostPlaceholderCopy.teamSetupTitle}
            </h2>
            <p className={sectionDescriptionClassName}>
              {hostPlaceholderCopy.teamSetupDescription}
            </p>
            <form
              className={teamCreateFormClassName}
              onSubmit={handleCreateTeamSubmit}
            >
              <div className={teamInputGroupClassName}>
                <label className={teamInputLabelClassName} htmlFor="team-name-input">
                  {hostPlaceholderCopy.teamNameInputLabel}
                </label>
                <input
                  id="team-name-input"
                  className={teamInputClassName}
                  value={nextTeamName}
                  disabled={setupMutationsDisabled}
                  onChange={(event): void => {
                    setNextTeamName(event.target.value);
                  }}
                  placeholder={hostPlaceholderCopy.teamNameInputPlaceholder}
                />
              </div>
              <button
                className={actionButtonClassName}
                type="submit"
                disabled={setupMutationsDisabled}
              >
                {hostPlaceholderCopy.createTeamButtonLabel}
              </button>
            </form>
          </div>

          <div className={cardClassName}>
            <h2 className={sectionHeadingClassName}>
              {hostPlaceholderCopy.teamsSectionTitle}
            </h2>
            {teams.length === 0 && (
              <p className={sectionDescriptionClassName}>
                {hostPlaceholderCopy.noTeamsLabel}
              </p>
            )}
            {teams.length > 0 && (
              <ul className={listClassName}>
                {teams.map((team) => {
                  return (
                    <li className={listRowClassName} key={team.id}>
                      <span className={teamNameClassName}>{team.name}</span>
                      <span className={teamMetaClassName}>
                        {hostPlaceholderCopy.teamMembersLabel(team.playerIds.length)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className={`${cardClassName} ${playersCardClassName}`}>
          <h2 className={sectionHeadingClassName}>
            {hostPlaceholderCopy.playersSectionTitle}
          </h2>
          {isEatingPhase && (
            <p className={sectionDescriptionClassName}>
              {hostPlaceholderCopy.eatingParticipationDescription}
            </p>
          )}
          {players.length === 0 && (
            <p className={sectionDescriptionClassName}>
              {hostPlaceholderCopy.noPlayersLabel}
            </p>
          )}
          {players.length > 0 && (
            <ul className={listClassName}>
              {players.map((player) => {
                const assignedTeamId = assignedTeamByPlayerId.get(player.id) ?? "";

                return (
                  <li key={player.id} className={listRowClassName}>
                    <span className={playerNameClassName}>{player.name}</span>
                    {isSetupPhase && (
                      <select
                        aria-label={hostPlaceholderCopy.assignmentSelectLabel(player.name)}
                        className={assignmentSelectClassName}
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
                      <div className={participationRowClassName}>
                        <span className={playerMetaClassName}>
                          {assignedTeamId.length > 0
                            ? hostPlaceholderCopy.assignedTeamLabel(
                                teamNameByTeamId.get(assignedTeamId) ??
                                  hostPlaceholderCopy.noAssignedTeamLabel
                              )
                            : hostPlaceholderCopy.noAssignedTeamLabel}
                        </span>
                        <label className={participationLabelClassName}>
                          <input
                            className={participationControlClassName}
                            type="checkbox"
                            checked={wingParticipationByPlayerId[player.id] === true}
                            onChange={(event): void => {
                              handleWingParticipationChange(
                                player.id,
                                event.target.checked
                              );
                            }}
                            disabled={participationDisabled}
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
      </div>
    </main>
  );
};
