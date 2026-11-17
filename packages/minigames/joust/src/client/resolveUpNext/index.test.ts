import assert from "node:assert/strict";
import test from "node:test";

import type { JoustPlayerFigure } from "@wingnight/shared";

import { resolveUpNextName } from "./index.js";

const figure = (playerId: string, name: string): JoustPlayerFigure =>
  ({ playerId, name }) as JoustPlayerFigure;

const TEAMMATES = [figure("p1", "Alex"), figure("p2", "Sara"), figure("p3", "Dan")];
const LINEUP = [figure("r1", "Rosie"), figure("r2", "Darren")];

const view = (overrides: Partial<Parameters<typeof resolveUpNextName>[0]> = {}) => ({
  phase: "resolved" as const,
  shotIndex: 0,
  shotsPerTurn: 3,
  teammates: TEAMMATES,
  lineup: LINEUP,
  downPlayerIds: [],
  ...overrides
});

test("does name the next teammate in turn order when a shot has landed", () => {
  assert.equal(resolveUpNextName(view()), "Sara");
  assert.equal(resolveUpNextName(view({ shotIndex: 1 })), "Dan");
});

test("does name nobody while aiming or after the turn's last shot", () => {
  assert.equal(resolveUpNextName(view({ phase: "aiming" })), null);
  assert.equal(resolveUpNextName(view({ phase: "done" })), null);
  assert.equal(resolveUpNextName(view({ shotIndex: 2 })), null);
});

test("does name nobody when the shot left nobody standing", () => {
  assert.equal(resolveUpNextName(view({ downPlayerIds: ["r1", "r2"] })), null);
});
