import { Character, UNSEATED_CHARACTER_FILL_CLASS_NAME, resolvePlayerAppearance } from "@wingnight/cast";
import type { Player, TeamTheme } from "@wingnight/shared";

import * as styles from "./styles";

type PlayerBirdProps = {
  player: Player;
  // The team's look, or none for a guest the host has not seated yet — who
  // wears the cast's warm neutral, exactly as the lobby parade draws them.
  teamTheme: TeamTheme | null;
  serverOrigin: string | null;
  size: "tile" | "hero";
};

// A face on the phone is always the bird the TV draws, never a bare photo:
// the bird is who the guest is tonight.
export const PlayerBird = ({ player, teamTheme, serverOrigin, size }: PlayerBirdProps): JSX.Element => {
  return (
    <span className={size === "hero" ? styles.hero : styles.tile} aria-hidden>
      <Character
        appearance={resolvePlayerAppearance(player, serverOrigin)}
        apparel={teamTheme?.apparel}
        silhouette={teamTheme?.silhouette}
        dance={teamTheme?.dance}
        fillClassName={teamTheme?.colorVariant.characterFillClassName ?? UNSEATED_CHARACTER_FILL_CLASS_NAME}
        pose={size === "hero" ? "idle" : "still"}
      />
    </span>
  );
};
