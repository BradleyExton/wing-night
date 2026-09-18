import type { TeamTheme } from "@wingnight/shared";

import * as styles from "./styles";

type TeamAmbientProps = {
  theme: TeamTheme;
  /** Half strength for a surface where the team is context rather than the headline. */
  strength?: "full" | "half";
};

// The genre's texture as a stage-body layer: absolutely positioned over the
// body, `z-1` like the embers and the lobby strut, never over content. The
// drawing is CSS (index.css, "Team identity kit") keyed off --tint; this
// element only names the texture and sets the tint. `prefers-reduced-motion`
// stops its drift in the stylesheet. A kit with no texture renders nothing.
export const TeamAmbient = ({ theme, strength = "full" }: TeamAmbientProps): JSX.Element | null => {
  if (theme.texture === null) {
    return null;
  }

  return (
    <span
      className={`${styles.layer} ${styles.textures[theme.texture]} ${theme.colorVariant.tintClassName} ${strength === "half" ? styles.half : ""}`}
      aria-hidden
      data-team-ambient={theme.texture}
    />
  );
};
