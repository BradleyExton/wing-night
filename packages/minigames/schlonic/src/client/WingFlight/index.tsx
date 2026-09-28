import { forwardRef } from "react";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import { Wing } from "../SchlonicScene/Wing/index.js";
import { WING_FLIGHT_MAX } from "../flyWings/index.js";
import * as styles from "./styles.js";

const BOX = SCHLONIC_WORLD.wingRadius * 2.4;

/**
 * The pool of wings that fly into the bank at the post, over the whole stage and under nothing.
 * Mounted once; `wingFlight/flyWings` throws them. Every wing sits at the layer's origin until
 * it is thrown, invisible, so the pool costs the picture nothing between posts.
 */
export const WingFlight = forwardRef<HTMLDivElement>((_props, ref): JSX.Element => (
  <div ref={ref} className={styles.layer} data-schlonic-wing-flight aria-hidden="true">
    {Array.from({ length: WING_FLIGHT_MAX }, (_unused, index) => (
      <svg key={index} className={styles.wing} viewBox={`${-BOX / 2} ${-BOX / 2} ${BOX} ${BOX}`}>
        <Wing />
      </svg>
    ))}
  </div>
));

WingFlight.displayName = "WingFlight";
