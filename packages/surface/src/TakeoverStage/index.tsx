import type { ReactNode } from "react";

import * as styles from "./styles.js";

// The takeover layout for a game made of panels the host reads and presses
// (docs/takeover-layout-api.md §4). Use it when chrome cannot float over the
// body without covering something the host must read or press — a question
// card, a picture frame, an emoji picker, a drawing board. Use
// `<TakeoverCanvas>` when it can.
//
// It is pure placement. It holds no room state, calls no hook that reads any,
// and never branches on phase: it takes elements and puts them where §4 says
// they go. A game computes its slot contents however its own view type
// requires — `phase` for eight of the nine, `hostView.status` for
// EMOJI_CHARADES — and passes nothing for a slot it has nothing for this beat.
export type TakeoverStageProps = {
  // Shell-owned. `<HostMiniRail />`, forwarded by the game untouched. A game
  // never renders a rail of its own; the rail already carries the round, the
  // sauce, the minigame and the active team, and saying any of it twice on one
  // canvas is the duplication this layout exists to remove.
  rail: ReactNode;
  // Shell-owned. `<TakeoverTimerChip />`, which renders nothing when the room
  // has no timer — six of the nine minigames have `timerKey: null`. Because it
  // is a slot in a flex row rather than an overlay, nothing is reserved for it
  // when it draws nothing.
  clock: ReactNode;
  // Game-owned, read-only: the turn's live counts, right of the rail and left
  // of the clock. "Photo 2 of 3", "Shot 2 of 5", "+3 pending". May not hold a
  // button, a link or an input — the rail row is read-only — and may not
  // repeat the team name or the minigame name.
  counter?: ReactNode;
  // The body. Everything the host reads. It gets `relative isolate`, so a game
  // may absolutely position inside it freely and its z-indexes cannot escape.
  // It may not hold a control that reaches the bottom-right corner; those live
  // in `actions` or in `deck`, where the layout has already reserved the dock.
  children: ReactNode;
  // Game-owned, optional: the fixed-width right column. Only EMOJI_CHARADES,
  // RECREATE and SONG_GUESS keep one after phase 3.
  deck?: ReactNode;
  // Game-owned, optional: the foot row, full width under both the body and the
  // deck. Everything that ends a beat — verdicts, "Next photo", "Next target",
  // DRAWING's toolbar. The positive verdict comes first (§4, P7).
  actions?: ReactNode;
};

const isFilled = (slot: ReactNode): boolean => slot !== null && slot !== undefined;

export const TakeoverStage = ({
  rail,
  clock,
  counter,
  children,
  deck,
  actions
}: TakeoverStageProps): JSX.Element => (
  <div className={styles.container}>
    <div className={styles.railRow}>
      <div className={styles.rail}>{rail}</div>
      {counter}
      {clock}
    </div>
    <div className={styles.mainRow}>
      <div className={styles.body}>{children}</div>
      {isFilled(deck) ? <div className={styles.deck}>{deck}</div> : null}
    </div>
    {isFilled(actions) ? <div className={styles.actions}>{actions}</div> : null}
  </div>
);
