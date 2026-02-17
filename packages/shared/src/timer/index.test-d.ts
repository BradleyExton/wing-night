import type { ActiveTimer, ActiveTimerKind } from "../index.js";

type IsAssignable<From, To> = From extends To ? true : false;
type Assert<T extends true> = T;

export type ActiveTimerShapeCheck = Assert<
  IsAssignable<
    {
      kind: ActiveTimerKind;
      startsAt: number;
      endsAt: number;
      durationSeconds: number;
    },
    ActiveTimer
  >
>;

// @ts-expect-error ActiveTimer.kind does not allow arbitrary values.
export type InvalidTimerKindCheck = Assert<IsAssignable<"ROUND", ActiveTimerKind>>;
