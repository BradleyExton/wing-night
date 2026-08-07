import type {
  PlayersContentEntry,
  PlayersContentFile,
  TeamsContentEntry,
  TeamsContentFile
} from "@wingnight/shared";

import { adminCopy } from "../../../copy/admin";
import { blankPlayer, blankTeam, setPlayerAvatarSrc } from "../contentDraft";
import { addEntry, removeEntry, setEntry } from "../entryListDraft";
import { EntryListEditor, type EntryFieldSpec } from "../EntryListEditor";
import type { IssueMessagesByPath } from "../selectIssueMessages";
import * as styles from "./styles";

type RosterStepProps = {
  players: PlayersContentFile;
  teams: TeamsContentFile;
  playerIssueMessagesByPath: IssueMessagesByPath;
  teamIssueMessagesByPath: IssueMessagesByPath;
  isLocked: boolean;
  onPlayersChange: (players: PlayersContentFile) => void;
  onTeamsChange: (teams: TeamsContentFile) => void;
};

const PLAYER_FIELDS: readonly EntryFieldSpec<PlayersContentEntry>[] = [
  {
    name: "name",
    label: adminCopy.playerNameFieldLabel,
    read: (player) => player.name,
    write: (player, name) => ({ ...player, name })
  },
  {
    name: "avatarSrc",
    label: adminCopy.playerAvatarFieldLabel,
    // Absent is the normal state, and the validator rejects a PRESENT empty
    // string — so the input shows "" for absent and `setPlayerAvatarSrc` maps
    // "" back to absent rather than writing one.
    read: (player) => player.avatarSrc ?? "",
    write: setPlayerAvatarSrc
  }
];

const TEAM_FIELDS: readonly EntryFieldSpec<TeamsContentEntry>[] = [
  {
    name: "name",
    label: adminCopy.teamNameFieldLabel,
    read: (team) => team.name,
    write: (team, name) => ({ ...team, name })
  }
];

export const RosterStep = ({
  players,
  teams,
  playerIssueMessagesByPath,
  teamIssueMessagesByPath,
  isLocked,
  onPlayersChange,
  onTeamsChange
}: RosterStepProps): JSX.Element => {
  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>{adminCopy.playersSectionTitle}</h2>
        <p className={styles.sectionHint}>{adminCopy.rosterOverwriteHint}</p>
        <EntryListEditor
          idPrefix="admin-player"
          listPath="players"
          entries={players.players}
          fields={PLAYER_FIELDS}
          entryHeading={adminCopy.playerHeading}
          removeLabel={adminCopy.removePlayerLabel}
          addLabel={adminCopy.addPlayerLabel}
          issueMessagesByPath={playerIssueMessagesByPath}
          isLocked={isLocked}
          onEntryChange={(entryIndex, player): void => {
            onPlayersChange(setEntry(players, "players", entryIndex, player));
          }}
          onAdd={(): void => {
            onPlayersChange(addEntry(players, "players", blankPlayer()));
          }}
          onRemove={(entryIndex): void => {
            onPlayersChange(removeEntry(players, "players", entryIndex));
          }}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>{adminCopy.teamsSectionTitle}</h2>
        <EntryListEditor
          idPrefix="admin-team"
          listPath="teams"
          entries={teams.teams}
          fields={TEAM_FIELDS}
          entryHeading={adminCopy.teamHeading}
          removeLabel={adminCopy.removeTeamLabel}
          addLabel={adminCopy.addTeamLabel}
          issueMessagesByPath={teamIssueMessagesByPath}
          isLocked={isLocked}
          onEntryChange={(entryIndex, team): void => {
            onTeamsChange(setEntry(teams, "teams", entryIndex, team));
          }}
          onAdd={(): void => {
            onTeamsChange(addEntry(teams, "teams", blankTeam()));
          }}
          onRemove={(entryIndex): void => {
            onTeamsChange(removeEntry(teams, "teams", entryIndex));
          }}
        />
      </section>
    </>
  );
};
