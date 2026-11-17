import type { CharacterAppearance } from "@wingnight/cast";
import type { GenreKey, Outfit, OutfitLook, TeamTheme } from "@wingnight/shared";

import { OutfitCrop } from "../OutfitCrop";
import { resolveOutfitLooks, resolveOutfitSlotCrop, resolveWornLookOutfit } from "../wardrobeState";
import { wardrobeLooksCopy } from "./copy";
import * as styles from "./styles";

type WardrobeLooksProps = {
  genre: GenreKey;
  theme: TeamTheme;
  // The Look the bird is wearing exactly, if any (resolveWornLookId).
  wornLookId: string | null;
  // The guest's bird wearing any outfit: their head, their name's body, the Look to try.
  dressBird: (outfit: Outfit) => CharacterAppearance;
  onLook: (look: OutfitLook) => void;
  onDressMe: () => void;
};

// What the wardrobe opens on: the team's named outfits, each your own bird wearing all of it,
// whole and on its Stage over the Look's name, one tap to put on; and the dice. Most guests need
// nothing below this. A Look's window on the bird is a Stage tile's, the one sized for the whole
// bird, floor and head.
export const WardrobeLooks = ({ genre, theme, wornLookId, dressBird, onLook, onDressMe }: WardrobeLooksProps): JSX.Element => {
  const looks = resolveOutfitLooks(genre);
  // The dice takes the cell an odd Look leaves empty, or a row of its own under an even number.
  const isDiceWide = looks.length % 2 === 0;

  return (
    <div className={styles.grid} data-testid="wardrobe-looks">
      {looks.map((look) => {
        const isOn = look.id === wornLookId;

        return (
          <button
            key={look.id}
            type="button"
            className={styles.look}
            aria-pressed={isOn}
            onClick={(): void => onLook(look)}
            data-testid="wardrobe-look"
            data-look={look.id}
          >
            <span className={isOn ? styles.pictureOn : styles.picture}>
              <OutfitCrop
                appearance={dressBird(resolveWornLookOutfit(genre, look))}
                theme={theme}
                viewBox={resolveOutfitSlotCrop(theme.silhouette, "stage")}
                showpieces
                whole
              />
            </span>
            <span className={isOn ? styles.nameOn : styles.name}>{look.name}</span>
          </button>
        );
      })}
      {isDiceWide ? (
        <button
          type="button"
          className={styles.diceWide}
          aria-label={wardrobeLooksCopy.dressMeLabel}
          onClick={onDressMe}
          data-testid="wardrobe-dress-me"
        >
          <span className={styles.diceMarkWide} aria-hidden>
            {wardrobeLooksCopy.dice}
          </span>
          {wardrobeLooksCopy.dressMe}
        </button>
      ) : (
        <button
          type="button"
          className={styles.look}
          aria-label={wardrobeLooksCopy.dressMeLabel}
          onClick={onDressMe}
          data-testid="wardrobe-dress-me"
        >
          <span className={styles.dicePicture} aria-hidden>
            {wardrobeLooksCopy.dice}
          </span>
          <span className={styles.name}>{wardrobeLooksCopy.dressMe}</span>
        </button>
      )}
    </div>
  );
};
