import type { SchlonicProp, SchlonicZone } from "@wingnight/shared";

import { Wing } from "../Wing/index.js";
import { Badnik } from "./Badnik/index.js";
import { GoalPost } from "./GoalPost/index.js";
import { Springboard } from "./Springboard/index.js";
import { Thorns } from "./Thorns/index.js";

// Everything standing on the zone's floor, drawn once and scrolled with it. A taken wing and a
// squashed schlong are hidden by the paint loop through these refs rather than by a re-render:
// there are a couple of hundred of them and the loop runs at sixty frames a second.
export type RegisterProp = (index: number, element: SVGGElement | null) => void;

const ZoneWing = ({ prop }: { prop: SchlonicProp }): JSX.Element => (
  <g data-schlonic-wing={prop.index} transform={`translate(${prop.x} ${prop.y})`}>
    <Wing />
  </g>
);

type ZonePropsProps = {
  zone: SchlonicZone;
  registerProp: RegisterProp;
  goalGroundY: number;
};

const drawProp = (prop: SchlonicProp): JSX.Element => {
  if (prop.kind === "wing") {
    return <ZoneWing prop={prop} />;
  }

  if (prop.kind === "spike") {
    return <Thorns prop={prop} />;
  }

  if (prop.kind === "spring") {
    return <Springboard prop={prop} />;
  }

  return <Badnik prop={prop} />;
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
        {drawProp(prop)}
      </g>
    ))}
    <GoalPost goalX={zone.goalX} groundY={goalGroundY} />
  </g>
);
