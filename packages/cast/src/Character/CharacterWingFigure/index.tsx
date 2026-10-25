import type { CharacterAppearance } from "../../resolvePlayerAppearance/index.js";
import type { CharacterSilhouette } from "../../resolveTeamSilhouette/index.js";
import { COSTUME_HEAD_ANCHORS, DRAWN_HEAD_ANCHORS } from "../geometry/index.js";
import { OutfitLayer } from "../Outfit/index.js";
import { resolveCharacterShapes, resolveCharacterWingPath } from "../shapes/index.js";
import * as styles from "./styles.js";

/**
 * The wing alone, as the figure draws it — its path and the Sleeve on it — for
 * a surface that draws the bird in two slices (`layer`) and turns a wing of its
 * own between them (FAPPY's beat, JOUST's reach for the band), so the Top and
 * the head still paint over it as they do on the rig. In the bird's 80×72 box
 * with the shoulder at `CHARACTER_WING_ROOT`; the surface does the turning.
 * Without an `appearance` it is the bare wing.
 */
export const CharacterWingFigure = ({
  appearance,
  silhouette
}: {
  appearance?: CharacterAppearance;
  silhouette?: CharacterSilhouette;
}): JSX.Element => {
  const wingPath = resolveCharacterWingPath(silhouette);
  // The join is the silhouette's, as on the rig's own wing: a spiky wing's
  // feather points are mitered, or they come out blunted a unit on this layer.
  const ink = resolveCharacterShapes({ body: "round", comb: "none", tail: "fan", silhouette }).mitered
    ? styles.silhouetteMitered
    : styles.silhouette;

  if (appearance?.outfit === undefined) {
    return <path className={ink} d={wingPath} />;
  }

  const shapes = resolveCharacterShapes({ ...appearance, silhouette });

  return (
    <g>
      <path className={ink} d={wingPath} />
      <OutfitLayer
        slot="sleeve"
        outfit={appearance.outfit}
        context={{ shapes, silhouette, head: appearance.avatarSrc === undefined ? DRAWN_HEAD_ANCHORS : COSTUME_HEAD_ANCHORS }}
      />
    </g>
  );
};
