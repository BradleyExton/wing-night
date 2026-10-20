import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { eggPath, goldShine, trophy } from "../../paths/sharedRail/index.js";
import * as styles from "./styles.js";

// golden-egg b (shared Prop), ported from the harness's shared.js: the
// trophy, the egg held aloft. A championship cup gripped by its foot at the
// wing tip, hoisted 15 degrees back of vertical so it stands over the tail
// and never toward the face: one light foot, a stem, a deep U bowl and a flat
// lip, with the egg's lower third behind the lip. No handles (solid lugs read
// as a dog bone). White is a white egg in a silver cup; gold a gold egg in a
// gold cup, with the golden egg's shade and glint.
//
// Shared, so it is placed per body (`trophy` reads the silhouette; the
// broody's low round back gets a shorter stem). The egg is drawn first with
// its own outline, then the cup over it, then the lip on its own so its ink
// edge crosses the bowl's mouth.
export const GoldenEggB = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();
  const style = context.style ?? "white";
  const gold = style === "gold";
  const { foot, stem, bowl, lip, egg } = trophy(context.silhouette);
  const eggD = eggPath(...egg);
  const shine = gold ? goldShine(egg) : undefined;
  const cup = gold ? styles.styleFill[style] : styles.silverFill;
  const cupParts = [foot, stem, bowl];

  return (
    <g>
      <path className={styles.eggOutline} d={eggD} />
      <path className={styles.styleFill[style]} d={eggD} />
      {shine !== undefined && (
        <>
          <defs>
            <clipPath id={clipId}>
              <path d={shine.egg} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <path className={styles.shade} d={shine.shade} />
            <path className={styles.glint} d={shine.glint} />
          </g>
        </>
      )}
      {cupParts.map((d) => (
        <path key={`outline-${d}`} className={styles.cupOutline} d={d} />
      ))}
      {cupParts.map((d) => (
        <path key={`fill-${d}`} className={cup} d={d} />
      ))}
      <path className={styles.mergedOutline} d={lip} />
      <path className={cup} d={lip} />
    </g>
  );
};
