import assert from "node:assert/strict";
import test from "node:test";
import type { MinigameType } from "@wingnight/shared";

import {
  isSerializableValue,
  type MinigameModule,
  type SerializableRecord
} from "./index.js";

type DummyAction = {
  type: "noop";
};

type DummyState = {
  turns: number;
};

const dummyModule = {
  id: "TRIVIA" as MinigameType,
  init: (_input) => ({ turns: 0 }),
  reduce: ({ state }) => state,
  selectHostView: ({ state }) => ({ turns: state.turns }),
  selectDisplayView: ({ state }) => ({ turns: state.turns })
} satisfies MinigameModule<DummyState, DummyAction, SerializableRecord, SerializableRecord>;

test("isSerializableValue accepts supported JSON-like values", () => {
  const value = {
    name: "Wing Night",
    rounds: [1, 2, 3],
    enabled: true,
    nested: {
      active: null,
      promptIds: ["p1", "p2"]
    }
  };

  assert.equal(isSerializableValue(value), true);
});

test("isSerializableValue rejects unsupported values", () => {
  assert.equal(isSerializableValue(Number.NaN), false);
  assert.equal(isSerializableValue(Number.POSITIVE_INFINITY), false);
  assert.equal(isSerializableValue(new Date()), false);
  assert.equal(isSerializableValue(() => 1), false);
  assert.equal(
    isSerializableValue({
      valid: "yes",
      invalid: undefined
    }),
    false
  );
});

test("MinigameModule contract remains callable", () => {
  const state = dummyModule.init({
    teamIds: ["team-1"],
    pointsMax: 10,
    context: {}
  });

  const nextState = dummyModule.reduce({
    teamIds: ["team-1"],
    pointsMax: 10,
    context: {},
    action: { type: "noop" },
    state
  });

  assert.equal(nextState.turns, 0);
});
