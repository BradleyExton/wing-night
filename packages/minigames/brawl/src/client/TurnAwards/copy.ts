import type { TurnAwardKind } from "./resolveTurnAwards/index.js";

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

export const turnAwardsCopy = {
  label: {
    geese: "Most geese",
    revives: "Most revives",
    carried: "Most often carried"
  } satisfies Record<TurnAwardKind, string>,
  value: {
    geese: (count: number): string => plural(count, "down", "down"),
    revives: (count: number): string => plural(count, "friend up", "friends up"),
    carried: (count: number): string => plural(count, "time", "times")
  } satisfies Record<TurnAwardKind, (count: number) => string>
} as const;
