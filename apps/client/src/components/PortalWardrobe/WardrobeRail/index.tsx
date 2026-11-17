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

// The rail, for a guest who wants to mix their own: every slot the genre has (country has no
// Boots) on one page, each under its name, the kit first and the showpieces after, each group
// under the line that says where it is worn. With one tile per idea a slot is a row or two, so
// the page scrolls where it used to tab, and the bird stays in view above it (the page pins the
// stage).
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
  const [moveLoop, setMoveLoop] = useState(0);
  const groups = [
    { id: "kit", note: wardrobeRailCopy.kitNote, slots: slots.filter((slot) => !isOutfitCropOnShow(slot)) },
    { id: "showpieces", note: wardrobeRailCopy.showpieceNote, slots: slots.filter(isOutfitCropOnShow) }
  ];

  // The first beat after the rail opens restarts the Move tiles onto the bar, then every
  // MOVE_LOOP_BEATS after it. Under reduced motion the clock never beats and the tiles stand
  // still, which is what the cast's motion-safe Moves would show anyway.
  useEffect(() => {
    const root = beatRootRef.current;

    if (root === null) {
      return undefined;
    }

    let beats = 0;

    return subscribeToBeat(root, () => {
      beats += 1;

      if (beats % MOVE_LOOP_BEATS === 1) {
        setMoveLoop((count) => count + 1);
      }
    });
  }, [beatRootRef]);

  return (
    <div className={styles.rail} data-testid="wardrobe-rail" data-genre={genre}>
      {groups.map(
        (group) =>
          group.slots.length > 0 && (
            <div key={group.id} className={styles.group}>
              <p className={styles.groupNote}>{group.note}</p>
              {group.slots.map((slot) => (
                <WardrobeSlot
                  key={slot}
                  genre={genre}
                  slot={slot}
                  theme={theme}
                  outfit={outfit}
                  dressBird={dressBird}
                  onDress={onDress}
                  onRestyle={onRestyle}
                  moveLoop={moveLoop}
                />
              ))}
            </div>
          )
      )}
    </div>
  );
};

type WardrobeSlotProps = Omit<WardrobeRailProps, "beatRootRef"> & {
  slot: OutfitSlot;
  // Counts the Move tiles' loops: a new count starts every Move tile again.
  moveLoop: number;
};

// One slot (research §2.5): its name, and beside it the styles of the item on when that item has
// more than one; then the grid, three across, None first, each tile your own bird wearing the
// item, cropped to where it sits.
const WardrobeSlot = ({ genre, slot, theme, outfit, dressBird, onDress, onRestyle, moveLoop }: WardrobeSlotProps): JSX.Element => {
  const rail = resolveOutfitRail(genre, slot);
  const worn = outfit[slot];
  const wornItem = worn === undefined ? undefined : findOutfitItem(worn.item);
  const headingId = `wardrobe-slot-${slot}`;

  return (
    <section
      className={styles.slot}
      aria-labelledby={headingId}
      data-testid="wardrobe-slot"
      data-slot={slot}
      data-filled={worn !== undefined}
    >
      <div className={styles.slotHead}>
        <h3 id={headingId} className={styles.slotName}>
          {OUTFIT_SLOT_NAMES[slot]}
        </h3>
        {worn !== undefined && wornItem !== undefined && wornItem.styles.length > 1 && (
          <div
            className={`${styles.styleRow} ${theme.colorVariant.characterFillClassName}`}
            role="group"
            aria-label={wardrobeRailCopy.stylesLabel(OUTFIT_SLOT_NAMES[slot])}
          >
            {wornItem.styles.map((style) => {
              const isOn = (worn.style ?? wornItem.styles[0]) === style;

              return (
                <button
                  key={style}
                  type="button"
                  className={`${isOn ? styles.swatchOn : styles.swatch} ${SWATCH_CLASS_BY_STYLE[style]}`}
                  aria-pressed={isOn}
                  aria-label={OUTFIT_STYLE_NAMES[style]}
                  onClick={(): void => onRestyle(slot, style)}
                  data-testid="wardrobe-style"
                  data-style={style}
                />
              );
            })}
          </div>
        )}
      </div>
      <div className={styles.grid} role="group" aria-labelledby={headingId} data-testid="wardrobe-grid">
        <button
          type="button"
          className={worn === undefined ? styles.tileOn : styles.tile}
          aria-pressed={worn === undefined}
          onClick={(): void => onDress(slot, null)}
          data-testid="wardrobe-tile"
          data-item="none"
        >
          <span className={styles.none}>{wardrobeRailCopy.none}</span>
        </button>
        {rail.map((item) => {
          const isOn = worn?.item === item.id;
          const trial = dressOutfitSlot(outfit, slot, item.id);

          return (
            <button
              key={item.id}
              type="button"
              className={isOn ? styles.tileOn : styles.tile}
              aria-pressed={isOn}
              aria-label={item.name}
              onClick={(): void => onDress(slot, item)}
              data-testid="wardrobe-tile"
              data-item={item.id}
              data-styles={item.styles.length > 1 ? "many" : "one"}
            >
              <OutfitCrop
                key={slot === "move" ? moveLoop : undefined}
                appearance={dressBird(trial)}
                theme={theme}
                viewBox={resolveOutfitSlotCrop(theme.silhouette, slot)}
                showpieces={isOutfitCropOnShow(slot)}
                whole={isOutfitCropWhole(slot)}
                move={slot === "move" ? (item.id as CharacterMove) : undefined}
              />
              {slot === "move" && <span className={styles.moveName}>{item.name}</span>}
              {item.genre === "shared" && slot !== "move" && <span className={styles.shared}>{wardrobeRailCopy.shared}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
};
