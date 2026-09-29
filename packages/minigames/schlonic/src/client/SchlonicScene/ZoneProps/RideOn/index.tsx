import type { SchlonicProp, SchlonicZone } from "@wingnight/shared";

import { Rail } from "../Rail/index.js";
import { Bench } from "./Bench/index.js";
import { Car } from "./Car/index.js";
import { Ledge } from "./Ledge/index.js";

/**
 * A piece of the street's furniture: flat on top from `x` to `toX` at `y`, which is exactly
 * the ledge the sim catches a falling board on, and which piece the prop says. Every one of
 * them is a handrail to the sim; the drawing is what tells the room how high the landing is.
 */
export const RideOn = ({ prop, zone }: { prop: SchlonicProp; zone: SchlonicZone }): JSX.Element => {
  const rideOn = prop.rideOn ?? "rail";

  return (
    <g data-schlonic-rail={prop.index} data-schlonic-ride-on={rideOn}>
      {rideOn === "rail" && <Rail prop={prop} zone={zone} />}
      {rideOn === "bench" && <Bench prop={prop} zone={zone} />}
      {rideOn === "ledge" && <Ledge prop={prop} zone={zone} />}
      {rideOn === "car" && <Car prop={prop} zone={zone} />}
    </g>
  );
};
