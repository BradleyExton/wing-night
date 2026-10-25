import { useEffect, useState, type RefObject } from "react";
import type { CharacterAppearance, CharacterMove } from "@wingnight/cast";
import {
  findOutfitItem,
  resolveOutfitRail,
  resolveOutfitSlots,
  type GenreKey,
  type Outfit,
  type OutfitItem,
  type OutfitSlot,
  type OutfitStyle,
  type TeamTheme
} from "@wingnight/shared";

import { subscribeToBeat } from "../beatCue";
import { OUTFIT_SLOT_NAMES, OUTFIT_STYLE_NAMES } from "../copy";
import { OutfitCrop } from "../OutfitCrop";
import { dressOutfitSlot, isOutfitCropOnShow, isOutfitCropWhole, resolveOutfitSlotCrop } from "../wardrobeState";
import { wardrobeRailCopy } from "./copy";
import * as styles from "./styles";

// A Move tile plays its Move on a loop, on the page's beat: a bar of four, then two beats'
// breath, so the bird is seen at rest as well as mid-move and every tile starts on the bar the
// team below is dancing.
const MOVE_LOOP_BEATS = 6;

const SWATCH_CLASS_BY_STYLE: Record<OutfitStyle, string> = {
  ink: styles.swatchInk,
  white: styles.swatchWhite,
  team: styles.swatchTeam,
  gold: styles.swatchGold
};

type WardrobeRailProps = {
  genre: GenreKey;
  theme: TeamTheme;
  outfit: Outfit;
  // The guest's bird wearing any outfit: their head, their name's body, the item to try.
  dressBird: (outfit: Outfit) => CharacterAppearance;
  onDress: (slot: OutfitSlot, item: OutfitItem | null) => void;
  onRestyle: (slot: OutfitSlot, style: OutfitStyle) => void;
  // The page's beat (`beatCue`), which the Move tiles loop on.
  beatRootRef: RefObject<HTMLElement | null>;
};

// The rail (research §2.5): a tab per slot the genre has (country has no Boots), a dot on each
// filled one, sticking to the top of the screen while the grid scrolls; then the grid, three
// across, None first, each tile your own bird wearing the item, cropped to where it sits; then,
// when the item on has more than one, its styles.
export const WardrobeRail = ({
  genre,
  theme,
  outfit,
  dressBird,
  onDress,
  onRestyle,
  beatRootRef
}: WardrobeRailProps): JSX.Element => {
  const slots = resolveOutfitSlots(genre);
  const [tab, setTab] = useState<OutfitSlot>("top");
  const [moveLoop, setMoveLoop] = useState(0);
  const rail = resolveOutfitRail(genre, tab);
  const worn = outfit[tab];
  const wornItem = worn === undefined ? undefined : findOutfitItem(worn.item);

  // The first beat after the tab opens restarts the tiles onto the bar, then every
  // MOVE_LOOP_BEATS after it. Under reduced motion the clock never beats and the tiles stand
  // still, which is what the cast's motion-safe Moves would show anyway.
  useEffect(() => {
    const root = beatRootRef.current;

    if (tab !== "move" || root === null) {
      return undefined;
    }

    let beats = 0;

    return subscribeToBeat(root, () => {
      beats += 1;

      if (beats % MOVE_LOOP_BEATS === 1) {
        setMoveLoop((count) => count + 1);
      }
    });
  }, [tab, beatRootRef]);

  return (
    <div className={styles.rail} data-testid="wardrobe-rail" data-genre={genre}>
      <div className={styles.tabs} role="tablist" aria-label={wardrobeRailCopy.tabsLabel}>
        {slots.map((slot) => (
          <button
            key={slot}
            type="button"
            role="tab"
            id={`wardrobe-tab-${slot}`}
            aria-selected={slot === tab}
            aria-controls="wardrobe-grid"
            className={slot === tab ? styles.tabOn : styles.tab}
            onClick={(): void => setTab(slot)}
            data-testid="wardrobe-tab"
            data-slot={slot}
            data-filled={outfit[slot] !== undefined}
          >
            {OUTFIT_SLOT_NAMES[slot]}
            {outfit[slot] !== undefined && <span className={styles.tabDot} aria-label={wardrobeRailCopy.filled} />}
          </button>
        ))}
      </div>
      <p className={styles.tabNote}>{isOutfitCropOnShow(tab) ? wardrobeRailCopy.showpieceNote : wardrobeRailCopy.kitNote}</p>
      <div
        className={styles.grid}
        id="wardrobe-grid"
        role="tabpanel"
        aria-labelledby={`wardrobe-tab-${tab}`}
        data-testid="wardrobe-grid"
      >
        <button
          type="button"
          className={worn === undefined ? styles.tileOn : styles.tile}
          aria-pressed={worn === undefined}
          onClick={(): void => onDress(tab, null)}
          data-testid="wardrobe-tile"
          data-item="none"
        >
          <span className={styles.none}>{wardrobeRailCopy.none}</span>
        </button>
        {rail.map((item) => {
          const isOn = worn?.item === item.id;
          const trial = dressOutfitSlot(outfit, tab, item.id);

          return (
            <button
              key={item.id}
              type="button"
              className={isOn ? styles.tileOn : styles.tile}
              aria-pressed={isOn}
              aria-label={item.name}
              onClick={(): void => onDress(tab, item)}
              data-testid="wardrobe-tile"
              data-item={item.id}
              data-styles={item.styles.length > 1 ? "many" : "one"}
            >
              <OutfitCrop
                key={tab === "move" ? moveLoop : undefined}
                appearance={dressBird(trial)}
                theme={theme}
                viewBox={resolveOutfitSlotCrop(theme.silhouette, tab)}
                showpieces={isOutfitCropOnShow(tab)}
                whole={isOutfitCropWhole(tab)}
                move={tab === "move" ? (item.id as CharacterMove) : undefined}
              />
              {tab === "move" && <span className={styles.moveName}>{item.name}</span>}
              {item.genre === "shared" && tab !== "move" && <span className={styles.shared}>{wardrobeRailCopy.shared}</span>}
            </button>
          );
        })}
      </div>
      {worn !== undefined && wornItem !== undefined && wornItem.styles.length > 1 && (
        <div className={`${styles.styleRow} ${theme.colorVariant.characterFillClassName}`} role="group" aria-label={wardrobeRailCopy.stylesLabel}>
          <span className={styles.stylesLabel}>{wardrobeRailCopy.style}</span>
          {wornItem.styles.map((style) => {
            const isOn = (worn.style ?? wornItem.styles[0]) === style;

            return (
              <button
                key={style}
                type="button"
                className={`${isOn ? styles.swatchOn : styles.swatch} ${SWATCH_CLASS_BY_STYLE[style]}`}
                aria-pressed={isOn}
                aria-label={OUTFIT_STYLE_NAMES[style]}
                onClick={(): void => onRestyle(tab, style)}
                data-testid="wardrobe-style"
                data-style={style}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
