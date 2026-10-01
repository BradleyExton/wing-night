import type { MinigameType } from "@wingnight/shared";

import * as styles from "./styles";

// One line-drawn symbol per game, on a 64-unit grid: stroke only, so the card
// colours it with `currentColor`.
const GLYPH_PATHS: Record<MinigameType, JSX.Element> = {
  TRIVIA: (
    <>
      <circle cx="32" cy="32" r="24" />
      <path d="M25 25 A7 7 0 1 1 35 31 C32 33 32 35 32 38" />
      <path d="M32 46 V47" />
    </>
  ),
  GEO: (
    <>
      <path d="M32 54 C32 54 15 36 15 25 A17 17 0 0 1 49 25 C49 36 32 54 32 54 Z" />
      <circle cx="32" cy="25" r="6" />
      <path d="M18 60 H46" />
    </>
  ),
  SONG_GUESS: (
    <>
      <circle cx="26" cy="36" r="20" />
      <circle cx="26" cy="36" r="6" />
      <path d="M26 22 A14 14 0 0 1 38 30" />
      <path d="M52 40 V10 L60 14" />
      <ellipse cx="48" cy="42" rx="5" ry="4" />
    </>
  ),
  JOUST: (
    <>
      <path d="M32 60 V36 M32 36 L20 12 M32 36 L44 12" />
      <path d="M20 14 Q32 32 44 14" />
      <circle cx="32" cy="24" r="4" />
    </>
  ),
  FAPPY: (
    <>
      <circle cx="32" cy="36" r="10" />
      <path d="M28 32 L16 14 L36 27" />
      <path d="M42 34 L50 36 L42 39" />
      <path d="M4 60 Q12 44 20 46" strokeDasharray="2 4" />
    </>
  ),
  SCHLONIC: (
    <>
      <path d="M20 44 C8 36 14 16 30 18 C44 20 46 34 38 40 C32 45 26 47 20 44 Z" />
      <path d="M38 40 L47 49" />
      <circle cx="50" cy="47" r="3.2" />
      <circle cx="46" cy="53" r="3.2" />
      <path d="M3 22 H12 M1 30 H10 M5 38 H12" />
    </>
  ),
  BRAWL: (
    <>
      <circle cx="22" cy="30" r="12" />
      <path d="M34 25 L47 30 L34 35" />
      <path d="M51 19 L55 13 M53 30 H62 M51 41 L55 47" />
      <path d="M6 56 H58" />
    </>
  ),
  DRAWING: (
    <>
      <path d="M16 50 L44 22 L50 28 L22 56 Z" />
      <path d="M16 50 L12 60 L22 56" />
      <path d="M40 26 L46 32" />
      <path d="M6 18 C12 8 18 22 24 12 C28 6 32 14 34 10" />
    </>
  ),
  RECREATE: (
    <>
      <rect x="7" y="9" width="44" height="38" />
      <rect x="13" y="15" width="32" height="26" />
      <path d="M15 38 L24 28 L30 33 L36 26 L43 36" />
      <path d="M42 48 L57 60" />
      <path d="M40 46 L44 50" />
    </>
  ),
  EMOJI_CHARADES: (
    <>
      <path d="M12 10 H52 A5 5 0 0 1 57 15 V38 A5 5 0 0 1 52 43 H28 L17 53 V43 H12 A5 5 0 0 1 7 38 V15 A5 5 0 0 1 12 10 Z" />
      <path d="M23 22 V24 M41 22 V24" />
      <path d="M22 31 Q32 39 42 31" />
    </>
  )
};

export type RoundGlyphVariant = "emboss" | "badge";

type RoundGlyphProps = {
  minigame: MinigameType;
  // Pressed into a card's corner as texture (the lobby's default), or drawn
  // plainly, filling the box it is given, as a badge's symbol.
  variant?: RoundGlyphVariant;
};

export const RoundGlyph = ({ minigame, variant = "emboss" }: RoundGlyphProps): JSX.Element => {
  return (
    <svg
      className={variant === "badge" ? styles.svgBadge : styles.svg}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      data-round-glyph={minigame}
      aria-hidden
    >
      {GLYPH_PATHS[minigame]}
    </svg>
  );
};
