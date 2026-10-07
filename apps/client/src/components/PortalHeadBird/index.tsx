import { Character, resolvePlayerAppearance } from "@wingnight/cast";

import * as styles from "./styles";

type PortalHeadBirdProps = {
  // The guest's name picks the bird's body, comb and tail, as it will on the night.
  name: string;
  // A head to wear: the guest's (`/api/me/avatar?v=…`), a fresh paint (a `blob:` URL), or none
  // yet, which draws the stock head.
  headSrc: string | null;
  size: "large" | "small";
  label: string;
};

// A head on the cast's bird, the one way the portal ever shows a head: it is what the guest will
// be on the TV, not a picture of them.
export const PortalHeadBird = ({ name, headSrc, size, label }: PortalHeadBirdProps): JSX.Element => {
  const appearance = resolvePlayerAppearance(headSrc === null ? { name } : { name, avatarSrc: headSrc });

  return (
    <div className={size === "large" ? styles.stageLarge : styles.stageSmall} role="img" aria-label={label}>
      <span className={size === "large" ? styles.birdLarge : styles.birdSmall}>
        <Character appearance={appearance} pose={size === "large" ? "idle" : "still"} />
      </span>
    </div>
  );
};
