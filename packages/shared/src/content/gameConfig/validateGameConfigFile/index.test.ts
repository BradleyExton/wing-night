import assert from "node:assert/strict";
import test from "node:test";

import type { ValidationIssue } from "../../validationIssue/index.js";
import {
  isGameConfigFile,
  SETUP_PREVIEW_ROUND_SLOTS_MAX,
  validateGameConfigFile
} from "./index.js";

const validRound = (roundNumber: number): Record<string, unknown> => ({
  round: roundNumber,
  label: `Round ${roundNumber}`,
  sauce: "Mild",
  pointsPerPlayer: 3,
  minigame: "TRIVIA"
});

const validGameConfig = (): Record<string, unknown> => ({
  name: "Wing Night",
  rounds: [validRound(1), validRound(2)],
  minigameScoring: { defaultMax: 10, finalRoundMax: 20 },
  timers: {
    eatingSeconds: 300,
    triviaSeconds: 60,
    geoSeconds: 60,
    drawingSeconds: 90
  }
});

const configWith = (overrides: Record<string, unknown>): unknown => ({
  ...validGameConfig(),
  ...overrides
});

const pathsOf = (issues: ValidationIssue[]): string[] => {
  return issues.map((issue) => issue.path);
};

test("returns no issues when the config satisfies every rule", () => {
  assert.deepEqual(validateGameConfigFile(validGameConfig()), []);
});

test("returns no issues when the optional fields are present and in range", () => {
  const config = configWith({
    minigameRules: { trivia: { questionsPerTurn: 3 } },
    setupPreviewRoundSlots: SETUP_PREVIEW_ROUND_SLOTS_MAX
  });

  assert.deepEqual(validateGameConfigFile(config), []);
});

test("reports a root issue when the value is not an object", () => {
  assert.deepEqual(validateGameConfigFile("nope"), [
    { path: "", message: "must be an object" }
  ]);
});

test("reports the name path when the name is blank", () => {
  const issues = validateGameConfigFile(configWith({ name: "   " }));

  assert.deepEqual(pathsOf(issues), ["name"]);
});

test("reports the offending field path when a round sauce is blank", () => {
  const config = configWith({
    rounds: [validRound(1), { ...validRound(2), sauce: "" }]
  });

  assert.deepEqual(pathsOf(validateGameConfigFile(config)), ["rounds[1].sauce"]);
});

test("reports the offending field path when a round minigame is unknown", () => {
  const config = configWith({
    rounds: [{ ...validRound(1), minigame: "RACING" }]
  });

  assert.deepEqual(pathsOf(validateGameConfigFile(config)), [
    "rounds[0].minigame"
  ]);
});

test("reports the index when round numbers are not contiguous", () => {
  const config = configWith({ rounds: [validRound(1), validRound(3)] });
  const issues = validateGameConfigFile(config);

  assert.deepEqual(pathsOf(issues), ["rounds[1].round"]);
  assert.match(issues[0].message, /must be 2/);
});

test("accumulates every violation rather than stopping at the first", () => {
  const config = {
    name: "",
    rounds: [{ ...validRound(1), label: "", pointsPerPlayer: 0 }],
    minigameScoring: { defaultMax: 0, finalRoundMax: 20 },
    timers: { eatingSeconds: 300, triviaSeconds: 60, geoSeconds: 60 }
  };

  assert.deepEqual(pathsOf(validateGameConfigFile(config)), [
    "name",
    "rounds[0].label",
    "rounds[0].pointsPerPlayer",
    "minigameScoring.defaultMax",
    "timers.drawingSeconds"
  ]);
});

test("reports every missing timer key separately", () => {
  const issues = validateGameConfigFile(configWith({ timers: {} }));

  assert.deepEqual(pathsOf(issues), [
    "timers.eatingSeconds",
    "timers.triviaSeconds",
    "timers.geoSeconds",
    "timers.drawingSeconds"
  ]);
});

test("reports the rounds path when the rounds array is empty", () => {
  const issues = validateGameConfigFile(configWith({ rounds: [] }));

  assert.deepEqual(pathsOf(issues), ["rounds"]);
});

test("reports setupPreviewRoundSlots when it exceeds the maximum", () => {
  const config = configWith({
    setupPreviewRoundSlots: SETUP_PREVIEW_ROUND_SLOTS_MAX + 1
  });

  assert.deepEqual(pathsOf(validateGameConfigFile(config)), [
    "setupPreviewRoundSlots"
  ]);
});

test("reports the rules key when a minigameRules entry is not an object", () => {
  const config = configWith({ minigameRules: { trivia: 5 } });

  assert.deepEqual(pathsOf(validateGameConfigFile(config)), [
    "minigameRules.trivia"
  ]);
});

test("yields exactly one minigameRules issue when the injected validateRules rejects", () => {
  const config = configWith({ minigameRules: { trivia: { bad: true } } });

  const issues = validateGameConfigFile(config, { validateRules: () => false });

  assert.deepEqual(pathsOf(issues), ["minigameRules.trivia"]);
});

test("yields no rules issue when the validateRules option is omitted", () => {
  const config = configWith({ minigameRules: { trivia: { bad: true } } });

  assert.deepEqual(validateGameConfigFile(config), []);
});

test("offers only the registry's own rules keys to the injected validateRules", () => {
  const config = configWith({
    minigameRules: { trivia: { ok: true }, bogus: { ok: true } }
  });
  const offeredKeys: string[] = [];

  const issues = validateGameConfigFile(config, {
    validateRules: (rulesKey) => {
      offeredKeys.push(rulesKey);
      return true;
    }
  });

  assert.deepEqual(offeredKeys, ["trivia"]);
  assert.deepEqual(issues, []);
});

test("does not hand a malformed rules entry to the injected validateRules", () => {
  const config = configWith({ minigameRules: { trivia: [] } });
  let wasCalled = false;

  const issues = validateGameConfigFile(config, {
    validateRules: () => {
      wasCalled = true;
      return true;
    }
  });

  assert.equal(wasCalled, false);
  assert.deepEqual(pathsOf(issues), ["minigameRules.trivia"]);
});

test("accepts a config the predicate accepts when both run on the same value", () => {
  const config = validGameConfig();

  assert.equal(isGameConfigFile(config), validateGameConfigFile(config).length === 0);
  assert.equal(isGameConfigFile(config), true);
});

test("rejects via the predicate every value the validator reports issues for", () => {
  const rejected: unknown[] = [
    null,
    "nope",
    [],
    configWith({ name: "" }),
    configWith({ rounds: [] }),
    configWith({ rounds: [validRound(2)] }),
    configWith({ minigameScoring: { defaultMax: 10 } }),
    configWith({ timers: { eatingSeconds: 300 } }),
    configWith({ minigameRules: { trivia: null } }),
    configWith({ setupPreviewRoundSlots: 0 })
  ];

  for (const value of rejected) {
    assert.equal(isGameConfigFile(value), false);
    assert.ok(validateGameConfigFile(value).length > 0);
  }
});
