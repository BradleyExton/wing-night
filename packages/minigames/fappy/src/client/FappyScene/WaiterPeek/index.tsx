import { forwardRef } from "react";

import { PlayerHead } from "../../PlayerHead/index.js";
import type { LegBird } from "../../resolveLegBird/index.js";
import { waiterPeekCopy } from "./copy.js";
import * as styles from "./styles.js";

// Who is standing on the cliff the flyer cannot see yet. The scene's paint
// loop owns whether it is up (see `paintWaiter`); this only draws it.
export const WaiterPeek = forwardRef<HTMLDivElement, { bird: LegBird }>(
  ({ bird }, ref): JSX.Element => (
    <div ref={ref} className={`${styles.bubble} ${bird.fillClassName}`} data-fappy-waiter-peek>
      <span className={styles.head}>
        <PlayerHead bird={bird} />
      </span>
      <span className={styles.text}>
        <span className={styles.name}>{waiterPeekCopy.name(bird.playerName)}</span>
        <span className={styles.line}>{waiterPeekCopy.line}</span>
      </span>
    </div>
  )
);

WaiterPeek.displayName = "WaiterPeek";
