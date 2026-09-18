import type { TeamTheme } from "@wingnight/shared";

import * as styles from "./styles";

type TeamWordmarkProps = {
  name: string;
  theme: TeamTheme;
  /** The caller's size (and, for a winner, colour) — the wordmark never picks its own scale. */
  sizeClassName: string;
  /** Play the genre's entrance beat on mount; off for a name that is simply sitting there. */
  entrance?: boolean;
};

// The team name in its genre face with the treatment on top. Treatments are
// CSS only (index.css, "Team identity kit"): gradients, text-shadow and
// text-stroke keyed off the --tint the colour variant sets, no per-letter
// markup. A `plain` treatment adds nothing, so a team with no genre renders
// exactly the caller's type. Legibility floor per docs/team-identity.md: only
// where the name is 24px+ on the TV or 20px+ on the tablet.
export const TeamWordmark = ({
  name,
  theme,
  sizeClassName,
  entrance = false
}: TeamWordmarkProps): JSX.Element => {
  const className = [
    styles.base,
    theme.fontClassName,
    theme.colorVariant.tintClassName,
    styles.treatments[theme.wordmark],
    entrance ? styles.entrances[theme.entrance] : "",
    sizeClassName
  ]
    .filter((part) => part.length > 0)
    .join(" ");

  return (
    <span className={className} data-team-wordmark={theme.wordmark}>
      {name}
    </span>
  );
};
