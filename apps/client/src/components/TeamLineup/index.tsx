import { Character, resolvePlayerAppearance } from "@wingnight/cast";
import type { Player, TeamTheme } from "@wingnight/shared";

import { useServerOrigin } from "../../utils/useServerOrigin";
import * as styles from "./styles";

type TeamLineupProps = {
  players: Player[];
  theme: TeamTheme;
  /** The caller's height for the row; each bird fills it. */
  sizeClassName: string;
};

// The team's players as `Character`s standing in formation: evenly spaced,
// costume heads and the genre's apparel on, painted in the team colour. Adds
// nothing to `Character` — it is the same bird the lobby strut draws, just
// standing still so the room can look at who is up. Decoration; the roster's
// names, where a surface wants them, are its own line.
export const TeamLineup = ({ players, theme, sizeClassName }: TeamLineupProps): JSX.Element | null => {
  // Heads live in the content pack the SERVER serves; `null` on the first
  // paint, and every player wears their drawn head until it resolves.
  const serverOrigin = useServerOrigin();

  if (players.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.container} ${sizeClassName}`} aria-hidden data-team-lineup>
      {players.map((player) => (
        <span key={player.id} className={styles.member} data-lineup-member={player.id}>
          <Character
            appearance={resolvePlayerAppearance(player, serverOrigin)}
            apparel={theme.apparel}
            fillClassName={theme.colorVariant.characterFillClassName}
          />
        </span>
      ))}
    </div>
  );
};
