import type { BrawlGoonKind } from "@wingnight/shared";

import { Boss } from "../Boss/index.js";
import { Goose } from "../Goose/index.js";
import { Gull } from "../Gull/index.js";
import { Raccoon } from "../Raccoon/index.js";
import type { GoonProps } from "../rig/index.js";

const GOONS: Record<BrawlGoonKind, (props: GoonProps) => JSX.Element> = {
  goose: Goose,
  gull: Gull,
  raccoon: Raccoon,
  boss: Boss
};

/**
 * One goon on the street, whichever kind the sim says it is. A bare `<g>` in world units for the
 * scene to drop into its own `<svg>`; its root is the kind's own root, which carries `data-brawl-goon-kind` and
 * `data-brawl-goon-state` for the e2e spec. A `gone` goon draws its root and nothing in it.
 */
export const Goon = ({ kind, ...props }: GoonProps & { kind: BrawlGoonKind }): JSX.Element => {
  const Drawing = GOONS[kind];

  return <Drawing {...props} />;
};
