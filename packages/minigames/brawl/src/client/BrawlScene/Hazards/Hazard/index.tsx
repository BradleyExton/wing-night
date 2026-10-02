import type { BrawlHazard } from "@wingnight/shared";

import { brawlNight } from "../../palette.js";
import { BayEdge } from "../BayEdge/index.js";
import { Plinth } from "../Plinth/index.js";
import { Railing } from "../Railing/index.js";

/**
 * The block's hazard (`BrawlBlock.hazard`), drawn as its setting has it: Dunlop's patio railing,
 * the waterfront's bay edge, the beach's plinth, from its `x` across its `width` on the near
 * sidewalk. Static street, in the scene's night palette; the root of each carries
 * `data-brawl-hazard` with its kind.
 */
export const Hazard = ({ hazard }: { hazard: BrawlHazard }): JSX.Element => {
  if (hazard.kind === "railing") {
    return <Railing x={hazard.x} width={hazard.width} palette={brawlNight} />;
  }

  if (hazard.kind === "bay") {
    return <BayEdge x={hazard.x} width={hazard.width} palette={brawlNight} />;
  }

  return <Plinth x={hazard.x} width={hazard.width} palette={brawlNight} />;
};
