import type { SchlonicProp } from "@wingnight/shared";

import { Goose } from "./Goose/index.js";
import { Punk } from "./Punk/index.js";
import { Roadie } from "./Roadie/index.js";
import { Sleeper } from "./Sleeper/index.js";
import { Stagger } from "./Stagger/index.js";
import { Tent } from "./Tent/index.js";

export { Goose } from "./Goose/index.js";

/**
 * One of the crowd, stood at its spot: which of them the prop says. A swaying one is moved off
 * its spot every frame by the scene, which writes a translate on the group around this — the
 * drawing itself never moves. Nothing in here is flat on top, which is the whole read.
 */
export const Crowd = ({ prop }: { prop: SchlonicProp }): JSX.Element => {
  const hazard = prop.hazard ?? "punk";

  return (
    <g data-schlonic-hazard={prop.index} data-schlonic-hazard-kind={hazard}>
      {hazard === "tent" && <Tent prop={prop} />}
      {hazard === "sleeper" && <Sleeper prop={prop} />}
      {hazard === "punk" && <Punk prop={prop} />}
      {hazard === "roadie" && <Roadie prop={prop} />}
      {hazard === "stagger" && <Stagger prop={prop} />}
      {hazard === "goose" && (
        <g transform={`translate(${prop.x} ${prop.y})`}>
          <Goose />
        </g>
      )}
    </g>
  );
};
