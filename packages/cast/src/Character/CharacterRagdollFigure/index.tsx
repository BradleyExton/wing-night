import { useId, type ReactNode } from "react";

import type { CharacterAppearance } from "../../resolvePlayerAppearance/index.js";
import type { CharacterApparel } from "../../resolveTeamApparel/index.js";
import type { CharacterSilhouette } from "../../resolveTeamSilhouette/index.js";
import { CharacterHead } from "../CharacterHead/index.js";
import { CHARACTER_PIVOTS, type CharacterPivot } from "../geometry/index.js";
import type { CharacterRagdollPart, CharacterRagdollTransforms } from "../ragdoll/index.js";
import { legPath, resolveCharacterShapes, thighPath } from "../shapes/index.js";
import * as styles from "./styles.js";

// The hen as a physics ragdoll: the same bird as `CharacterFigure`, a bare
// `<g>` in the 80×72 box, but with every part placed by the transforms a sim
// hands over (`ragdoll`) rather than turned by a named pose. Nothing here
// moves on its own and nothing loops; each frame is the sim's.
export type CharacterRagdollFigureProps = {
  appearance: CharacterAppearance;
  apparel?: CharacterApparel;
  // The team's own shape (`resolveTeamSilhouette`). It changes the drawing
  // only: the bones a sim reads (`CHARACTER_RAGDOLL_SEGMENTS`) are the stock
  // bird's whatever the genre, so every team's hen weighs and reaches the same.
  silhouette?: CharacterSilhouette;
  // The `text-*` class the bird is painted in. Left off, it inherits whatever
  // the surface wrapped it in, as `CharacterFigure` does.
  fillClassName?: string;
  transforms: CharacterRagdollTransforms;
};

// Where each part's drawing hangs from in the box: the rig pivot it is drawn
// around. Both wings are the one wing path, drawn about the near shoulder, so
// the far wing's drawing hangs from there too and its transform puts it on its
// own shoulder.
const DRAWN_ABOUT: Record<CharacterRagdollPart, CharacterPivot> = {
  wingFar: CHARACTER_PIVOTS.wing,
  legFar: CHARACTER_PIVOTS.legFar,
  body: CHARACTER_PIVOTS.body,
  legNear: CHARACTER_PIVOTS.legNear,
  wingNear: CHARACTER_PIVOTS.wing,
  head: CHARACTER_PIVOTS.head
};

// A part on its transform: the outer translate puts the joint where the sim
// says, the rotate turns it about that joint, and the inner translate puts the
// drawing's own pivot on the joint. `layer` names what is drawn when it is not
// the part itself, which is only the tail: it rides on the body's transform
// but is drawn behind the far leg, as the rig draws it.
const RagdollPart = ({
  part,
  layer = part,
  transforms,
  children
}: {
  part: CharacterRagdollPart;
  layer?: CharacterRagdollPart | "tail";
  transforms: CharacterRagdollTransforms;
  children: ReactNode;
}): JSX.Element => {
  const { x, y, rotation } = transforms[part];
  const pivot = DRAWN_ABOUT[part];

  return (
    <g data-character-ragdoll-part={layer} transform={`translate(${x} ${y}) rotate(${rotation})`}>
      <g transform={`translate(${-pivot.x} ${-pivot.y})`}>{children}</g>
    </g>
  );
};

export const CharacterRagdollFigure = ({
  appearance,
  apparel,
  silhouette,
  fillClassName,
  transforms
}: CharacterRagdollFigureProps): JSX.Element => {
  const haloId = useId();
  const shapes = resolveCharacterShapes({ ...appearance, silhouette });
  // Spikes need a mitered join, as on the posed figure.
  const ink = shapes.mitered ? styles.silhouetteMitered : styles.silhouette;

  // Back to front, the rig's own order with the far wing behind it all.
  return (
    <g
      className={fillClassName}
      data-character-ragdoll
      data-character-body={appearance.body}
      data-character-comb={appearance.comb}
      data-character-tail={appearance.tail}
      data-character-silhouette={silhouette}
    >
      <RagdollPart part="wingFar" transforms={transforms}>
        <path className={ink} d={shapes.wing} data-character-wing="far" />
      </RagdollPart>
      <RagdollPart part="body" layer="tail" transforms={transforms}>
        <path className={ink} d={shapes.tail} />
      </RagdollPart>
      <RagdollPart part="legFar" transforms={transforms}>
        <g className={styles.legFar}>
          <path className={styles.legs} d={legPath(CHARACTER_PIVOTS.legFar)} />
        </g>
      </RagdollPart>
      <RagdollPart part="body" transforms={transforms}>
        <path className={ink} d={shapes.body} />
        <path className={styles.shade} d={shapes.belly} />
      </RagdollPart>
      <RagdollPart part="legNear" transforms={transforms}>
        <path className={ink} d={thighPath(CHARACTER_PIVOTS.legNear)} />
        <path className={styles.legs} d={legPath(CHARACTER_PIVOTS.legNear)} />
      </RagdollPart>
      <RagdollPart part="wingNear" transforms={transforms}>
        <path className={ink} d={shapes.wing} data-character-wing />
      </RagdollPart>
      <RagdollPart part="head" transforms={transforms}>
        <path className={ink} d={shapes.neck} />
        <CharacterHead appearance={appearance} apparel={apparel} combPath={shapes.comb} ink={ink} haloId={haloId} />
      </RagdollPart>
    </g>
  );
};
