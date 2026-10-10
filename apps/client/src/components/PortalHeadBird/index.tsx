import { Character, resolvePlayerAppearance } from "@wingnight/cast";
import type { TeamTheme } from "@wingnight/shared";

import * as styles from "./styles";

type PortalHeadBirdProps = {
  // The guest's name picks the bird's body, comb and tail, as it will on the night.
  name: string;
  // A head to wear: the guest's (`/api/me/avatar?v=…`), a fresh paint (a `blob:` URL), or none
  // yet, which draws the stock head.
  headSrc: string | null;
  // The picked team's kit — colour, silhouette, dance, apparel — so the bird is dressed as it
  // will be on the TV. None draws the stock bird.
  theme?: TeamTheme;
  // `tiny` is a bird in a row (a team tile's members): no stage pool, as a row of pools reads as
  // a row of puddles.
  size: "large" | "small" | "tiny";
  label: string;
};

const STAGE_BY_SIZE = { large: styles.stageLarge, small: styles.stageSmall, tiny: styles.stageTiny } as const;

const BIRD_BY_SIZE = { large: styles.birdLarge, small: styles.birdSmall, tiny: styles.birdTiny } as const;

// A head on the cast's bird, the one way the portal ever shows a head: it is what the guest will
// be on the TV, not a picture of them.
export const PortalHeadBird = ({ name, headSrc, theme, size, label }: PortalHeadBirdProps): JSX.Element => {
  const appearance = resolvePlayerAppearance(headSrc === null ? { name } : { name, avatarSrc: headSrc });

  return (
    <div
      className={STAGE_BY_SIZE[size]}
      role="img"
      aria-label={label}
      data-team-color={theme?.colorToken ?? "none"}
    >
      <span className={BIRD_BY_SIZE[size]}>
        <Character
          appearance={appearance}
          pose={size === "large" ? "idle" : "still"}
          fillClassName={theme?.colorVariant.characterFillClassName}
          silhouette={theme?.silhouette}
          dance={theme?.dance}
          apparel={theme?.apparel}
        />
      </span>
    </div>
  );
};
