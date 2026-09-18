import assert from "node:assert/strict";
import test from "node:test";

import {
  createDevManifest,
  createPromptContentAdapter,
  isSerializableValue
} from "./index.js";

type DummyPrompt = {
  id: string;
  text: string;
};

const isDummyPrompt = (value: unknown): value is DummyPrompt => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const prompt = value as Partial<DummyPrompt>;
  return typeof prompt.id === "string" && typeof prompt.text === "string";
};

const dummyContentAdapter = createPromptContentAdapter<DummyPrompt>({
  label: "dummy",
  fileName: "minigames/dummy.json",
  invalidContentHint: "expected { prompts: [{ id, text }] }.",
  isContentFile: (value): value is { prompts: DummyPrompt[] } => {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    if (!("prompts" in value) || !Array.isArray(value.prompts)) {
      return false;
    }

    return (
      value.prompts.length > 0 &&
      value.prompts.every((prompt) => isDummyPrompt(prompt))
    );
  },
  isPrompt: isDummyPrompt,
  clonePrompt: (prompt) => ({ id: prompt.id, text: prompt.text })
});

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

test("createPromptContentAdapter parses valid content files with cloned prompts", () => {
  const sourcePrompts = [{ id: "p1", text: "One" }];
  const parsed = dummyContentAdapter.parseFileContent(
    JSON.stringify({ prompts: sourcePrompts }),
    "dummy.json"
  );

  assert.deepEqual(parsed.prompts, sourcePrompts);
  assert.notEqual(parsed.prompts[0], sourcePrompts[0]);
});

test("createPromptContentAdapter throws labeled parse and validation errors", () => {
  assert.throws(
    () => dummyContentAdapter.parseFileContent("not json", "dummy.json"),
    /Failed to parse dummy content at "dummy.json"/
  );
  assert.throws(
    () => dummyContentAdapter.parseFileContent("{}", "dummy.json"),
    /Invalid dummy content at "dummy.json": expected \{ prompts: \[\{ id, text \}\] \}\./
  );
});

test("createPromptContentAdapter resolves runtime content leniently", () => {
  assert.deepEqual(dummyContentAdapter.resolveContent(null), { prompts: [] });
  assert.deepEqual(dummyContentAdapter.resolveContent("junk"), { prompts: [] });
  assert.deepEqual(
    dummyContentAdapter.resolveContent({
      prompts: [{ id: "p1", text: "One" }, { id: "broken" }]
    }),
    { prompts: [{ id: "p1", text: "One" }] }
  );
});

test("createDevManifest supplies the standard sandbox team fixture", () => {
  const devManifest = createDevManifest({
    rules: { questionsPerTurn: 3 },
    content: { prompts: [] }
  });

  assert.deepEqual(devManifest.teamIds, [
    "team-alpha",
    "team-beta",
    "team-gamma",
    "team-delta"
  ]);
  assert.deepEqual(devManifest.teamNameByTeamId, {
    "team-alpha": "Team Alpha",
    "team-beta": "Team Beta",
    "team-gamma": "Team Gamma",
    "team-delta": "Team Delta"
  });
  assert.equal(devManifest.activeRoundTeamId, "team-alpha");
  assert.equal(devManifest.pointsMax, 15);
  assert.deepEqual(devManifest.pendingPointsByTeamId, {
    "team-alpha": 0,
    "team-beta": 0,
    "team-gamma": 0,
    "team-delta": 0
  });
  assert.deepEqual(devManifest.rules, { questionsPerTurn: 3 });
  assert.deepEqual(devManifest.content, { prompts: [] });
});

// A game that draws the room needs a plausible crowd, and the sandbox needs every slot in the
// turn order to reach the per-team content behind it — JOUST's lane is picked by that slot.
test("createDevManifest seats a full roster across every team", () => {
  const devManifest = createDevManifest({ rules: null, content: null });
  const seated = devManifest.teams.flatMap((team) => team.playerIds);

  assert.equal(devManifest.players.length, 12);
  assert.equal(devManifest.teams.length, devManifest.teamIds.length);
  assert.deepEqual(
    seated.slice().sort(),
    devManifest.players.map((player) => player.id).sort(),
    "every player is on exactly one team"
  );
  assert.equal(new Set(seated).size, seated.length, "and on only one");
});
