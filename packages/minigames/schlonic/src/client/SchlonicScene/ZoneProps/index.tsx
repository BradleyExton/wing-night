import type { SchlonicProp, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import { Wing } from "../Wing/index.js";
import { Crowd } from "./Crowd/index.js";
import { GoalPost } from "./GoalPost/index.js";
import { Kicker } from "./Kicker/index.js";
import { RideOn } from "./RideOn/index.js";

// Everything standing on the zone's floor, drawn once and scrolled with it. A taken wing is
// hidden, and a swaying crowd member moved, by the paint loop through these refs rather than by
// a re-render: there are a couple of hundred of them and the loop runs at sixty frames a second.
export type RegisterProp = (index: number, element: SVGGElement | null) => void;

// A high-line wing is worth two and drawn bigger by the same factor the sim reaches for it, so
// what the room sees is what the bird hits (§2.11).
const ZoneWing = ({ prop }: { prop: SchlonicProp }): JSX.Element => (
  <g
    data-schlonic-wing={prop.index}
    data-schlonic-wing-worth={prop.worth ?? 1}
    transform={`translate(${prop.x} ${prop.y})`}
  >
    <Wing scale={(prop.worth ?? 1) > 1 ? SCHLONIC_WORLD.highLineWingScale : 1} />
  </g>
);

type ZonePropsProps = {
  zone: SchlonicZone;
  registerProp: RegisterProp;
  goalGroundY: number;
};

const drawProp = (prop: SchlonicProp, zone: SchlonicZone): JSX.Element => {
  if (prop.kind === "wing") {
    return <ZoneWing prop={prop} />;
  }

  if (prop.kind === "kicker") {
    return <Kicker prop={prop} />;
  }

  if (prop.kind === "rail") {
    return <RideOn prop={prop} zone={zone} />;
  }

  return <Crowd prop={prop} />;
};

export const ZoneProps = ({ zone, registerProp, goalGroundY }: ZonePropsProps): JSX.Element => (
  <g data-schlonic-props>
    {zone.props.map((prop) => (
      <g
        key={prop.index}
        ref={(element): void => {
          registerProp(prop.index, element);
        }}
      >
        {drawProp(prop, zone)}
      </g>
    ))}
    <GoalPost goalX={zone.goalX} groundY={goalGroundY} />
  </g>
);
