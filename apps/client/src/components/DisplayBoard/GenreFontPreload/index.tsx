import type { Team } from "@wingnight/shared";

import { resolveGenreFontSrcs } from "../../../utils/resolveTeamTheme";
import * as styles from "./styles";

type GenreFontPreloadProps = {
  teams: ReadonlyArray<Pick<Team, "genre">>;
};

// Preloads the active roster's genre faces the moment the TV knows the
// roster, so the first MINIGAME_INTRO headline is drawn in its face rather
// than in the house sans for a beat — and the marquee's own two faces with
// them, so the first neon sign of the night is not drawn in the sans either. Faces are `font-display: block`, which
// is exactly the flash this removes. A preload link in the body is honoured
// by every browser the TV runs; `crossOrigin` is required for a font preload
// to match the stylesheet's fetch even on the same origin.
export const GenreFontPreload = ({ teams }: GenreFontPreloadProps): JSX.Element => {
  return (
    <>
      {resolveGenreFontSrcs(teams).map((fontSrc) => (
        <link
          key={fontSrc}
          className={styles.link}
          rel="preload"
          as="font"
          type="font/woff2"
          href={fontSrc}
          crossOrigin="anonymous"
          data-genre-font-preload
        />
      ))}
    </>
  );
};
