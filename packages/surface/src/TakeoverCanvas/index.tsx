import type { ReactNode } from "react";

import * as styles from "./styles.js";

// The takeover layout for a game whose body is a single continuous region that
// should be as large as the tablet allows (docs/takeover-layout-api.md §5).
// Use it when chrome can float over the body without covering something the
// host must read or press — the body's meaning is spread evenly across it, so
// a chip in one corner costs a corner of scenery. Use `<TakeoverStage>` when
// it cannot.
//
// It is pure placement. It holds no room state, calls no hook that reads any,
// and never branches on phase: it takes elements and puts them where §5 says
// they go.
//
// A body rendered here may not float its own chrome — if a chip belongs on the
// canvas it belongs in a slot — may not take the dock gutter itself, and may
// not set `isolate` on itself. The layout has all three.
export type TakeoverCanvasProps = {
  // Shell-owned. `<HostMiniRail />`, forwarded by the game untouched.
  rail: ReactNode;
  // Shell-owned. `<TakeoverTimerChip />`, which renders nothing when the room
  // has no timer. A slot, not an overlay, so an empty clock reserves nothing.
  clock: ReactNode;
  // Game-owned, read-only: the turn's live counts, right of the rail and left
  // of the clock. No tap targets — the chrome row is read-only, and a control
  // there would sit beside the clock, which is where the host will not look.
  counter?: ReactNode;
  // The body, full bleed: it fills the takeover's padding box, not the
  // viewport. Isolated, so a game may use any z-index inside it — Leaflet's
  // 400-1000 included — without reaching the shell's chrome or the dock.
  children: ReactNode;
  // Game-owned, optional: the turn's one or two controls plus the hint that
  // explains them, floating bottom-left — the one corner where a control is
  // neither under the dock nor over the pin the team just placed.
  actions?: ReactNode;
  // Game-owned, optional: the turn's numbers, floating bottom-right ABOVE the
  // dock. Distance and points, the running totals, the last shot's score.
  // There is no bottom-right slot for a *control*; that corner is the dock's.
  readout?: ReactNode;
};

const isFilled = (slot: ReactNode): boolean => slot !== null && slot !== undefined;

export const TakeoverCanvas = ({
  rail,
  clock,
  counter,
  children,
  actions,
  readout
}: TakeoverCanvasProps): JSX.Element => (
  <div className={styles.container}>
    <div className={styles.body}>{children}</div>
    <div className={styles.chromeRow}>
      <div className={styles.rail}>{rail}</div>
      {counter}
      {clock}
    </div>
    {isFilled(actions) ? <div className={styles.actions}>{actions}</div> : null}
    {isFilled(readout) ? <div className={styles.readout}>{readout}</div> : null}
  </div>
);
