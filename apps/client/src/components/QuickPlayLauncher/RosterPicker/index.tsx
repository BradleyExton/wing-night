import type { Player, Team, TeamTheme } from "@wingnight/shared";

import { quickPlayLauncherCopy } from "../copy";
import type { QuickPlayDraft } from "../quickPlayDraft";
import * as styles from "./styles";

type RosterPickerProps = {
  players: Player[];
  presetTeams: Team[];
  teamThemeByTeamId: Map<string, TeamTheme>;
  draft: QuickPlayDraft;
  onTogglePlayer: (playerId: string) => void;
  onEveryone: () => void;
  onClear: () => void;
};

// The pack's roster as toggles. A ticked player wears the dot of the team
// the deal put them on, so the picker and the dealer beside it agree.
export const RosterPicker = ({
  players,
  presetTeams,
  teamThemeByTeamId,
  draft,
  onTogglePlayer,
  onEveryone,
  onClear
}: RosterPickerProps): JSX.Element => {
  const presentPlayerIdSet = new Set(draft.presentPlayerIds);

  return (
    <section className={styles.group}>
      <div className={styles.groupHead}>
        <span>{quickPlayLauncherCopy.rosterSectionTitle}</span>
        <span className={styles.groupCount}>{draft.presentPlayerIds.length}</span>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.actionButton} onClick={onEveryone}>
          {quickPlayLauncherCopy.rosterEveryoneButtonLabel}
        </button>
        <button type="button" className={styles.actionButton} onClick={onClear}>
          {quickPlayLauncherCopy.rosterClearButtonLabel}
        </button>
      </div>
      {players.length === 0 && (
        <p className={styles.empty}>{quickPlayLauncherCopy.rosterEmptyLabel}</p>
      )}
      <div className={styles.grid}>
        {players.map((player) => {
          const isPresent = presentPlayerIdSet.has(player.id);
          const seat = draft.seatByPlayerId[player.id];
          const seatedTeam = seat === undefined ? undefined : presetTeams[seat];
          const dotClassName =
            seatedTeam === undefined
              ? ""
              : (teamThemeByTeamId.get(seatedTeam.id)?.colorVariant.dotAccentClassName ?? "");

          return (
            <button
              key={player.id}
              type="button"
              className={`${styles.chip} ${isPresent ? styles.chipActive : ""}`}
              aria-pressed={isPresent}
              aria-label={quickPlayLauncherCopy.rosterToggleAriaLabel(player.name)}
              data-quick-play-player={player.id}
              onClick={(): void => {
                onTogglePlayer(player.id);
              }}
            >
              {isPresent && <span className={`${styles.teamDot} ${dotClassName}`} aria-hidden />}
              <span className={styles.chipName}>{player.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
