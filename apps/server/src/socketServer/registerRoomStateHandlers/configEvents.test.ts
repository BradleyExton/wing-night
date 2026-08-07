import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  CONFIG_ERROR_CODES,
  Phase,
  type ConfigResultPayload
} from "@wingnight/shared";

import {
  createContentRoot,
  writeContentFile,
  writeValidContentTree
} from "../../contentLoader/testHarness.js";
import { createConfigService } from "../../configService/index.js";
import {
  advanceRoomStatePhase,
  getRoomStateSnapshot,
  resetRoomState,
  setRoomStateFatalError,
  type RoomStateMutationResult
} from "../../roomState/index.js";
import { reloadContentIntoRoomState } from "../../reloadContentIntoRoomState/index.js";
import { setupValidTeamsAndAssignments } from "../../roomState/testHarness.js";
import {
  createRealMutationDispatch,
  setupHandlers
} from "./testHarness.js";

const VALID_SECRET = "valid-host-secret";

beforeEach(() => {
  resetRoomState();
});

type ConfigHarness = {
  emittedConfigResults: ConfigResultPayload[];
  observedMutations: RoomStateMutationResult[];
  trigger: (
    event:
      | typeof CLIENT_TO_SERVER_EVENTS.CONFIG_READ
      | typeof CLIENT_TO_SERVER_EVENTS.CONFIG_SAVE
      | typeof CLIENT_TO_SERVER_EVENTS.CONFIG_APPLY,
    payload: unknown
  ) => void;
};

// Wires the handlers to a real config service rooted at a temp directory and a
// dispatch that actually runs the mutation thunk — the production seam, minus
// the socket.
const setupConfigHarness = (contentRoot: string): ConfigHarness => {
  const observedMutations: RoomStateMutationResult[] = [];
  const harness = setupHandlers({
    dispatch: createRealMutationDispatch(observedMutations),
    configService: createConfigService({ contentRootDir: contentRoot })
  });

  return {
    emittedConfigResults: harness.emittedConfigResults,
    observedMutations,
    trigger: harness.trigger
  };
};

const lastResult = (results: ConfigResultPayload[]): ConfigResultPayload => {
  const result = results.at(-1);
  assert.ok(result, "expected a config:result emit");
  return result;
};

test("config:read returns the merged on-disk content", () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "sample", "Sample");
  writeValidContentTree(contentRoot, "local", "Local");
  const harness = setupConfigHarness(contentRoot);

  harness.trigger(CLIENT_TO_SERVER_EVENTS.CONFIG_READ, {
    hostSecret: VALID_SECRET
  });

  const result = lastResult(harness.emittedConfigResults);
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.content?.gameConfig.name, "Local");
  assert.deepEqual(
    result.ok && result.content?.players.map((player) => player.name),
    ["Local Player"]
  );
  assert.equal(result.ok && result.content?.geoPromptCount, 1);
});

// AC7's acute case: the wizard's own read path pointed at the broken file that
// put the server in its fatal state. Every content loader throws by design and
// socket.io has no surrounding catch, so an unguarded handler would take the
// process down here.
test("config:read returns an error and does not throw when local content is unparseable", () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "sample", "Sample");
  writeContentFile(contentRoot, "local/gameConfig.json", "{ not json");
  const harness = setupConfigHarness(contentRoot);

  assert.doesNotThrow(() => {
    harness.trigger(CLIENT_TO_SERVER_EVENTS.CONFIG_READ, {
      hostSecret: VALID_SECRET
    });
  });

  const result = lastResult(harness.emittedConfigResults);
  assert.equal(result.ok, false);
  assert.equal(
    !result.ok && result.code,
    CONFIG_ERROR_CODES.LOAD_FAILED
  );
  assert.match(
    !result.ok ? result.message : "",
    /Failed to parse game config content/
  );
});

test("config:save returns the validation issues and writes nothing when a payload is invalid", () => {
  const contentRoot = createContentRoot();
  const harness = setupConfigHarness(contentRoot);

  harness.trigger(CLIENT_TO_SERVER_EVENTS.CONFIG_SAVE, {
    hostSecret: VALID_SECRET,
    files: [{ key: "players", value: { players: [{ name: "" }] } }]
  });

  const result = lastResult(harness.emittedConfigResults);
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.code, CONFIG_ERROR_CODES.INVALID);
  assert.deepEqual(
    !result.ok ? result.issues : [],
    [{ path: "players.players[0].name", message: "must be a non-empty string" }]
  );
});

test("config:save is allowed once the game has left SETUP", () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "sample", "Sample");
  setupValidTeamsAndAssignments();
  advanceRoomStatePhase();
  assert.notEqual(getRoomStateSnapshot().phase, Phase.SETUP);

  const harness = setupConfigHarness(contentRoot);

  harness.trigger(CLIENT_TO_SERVER_EVENTS.CONFIG_SAVE, {
    hostSecret: VALID_SECRET,
    files: [{ key: "teams", value: { teams: [{ name: "Prepped Team" }] } }]
  });

  const result = lastResult(harness.emittedConfigResults);
  assert.equal(result.ok, true);
});

test("config:apply is rejected with CONFIG_LOCKED once the game has left SETUP", () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "sample", "Sample");
  setupValidTeamsAndAssignments();
  advanceRoomStatePhase();
  assert.notEqual(getRoomStateSnapshot().phase, Phase.SETUP);

  const harness = setupConfigHarness(contentRoot);

  harness.trigger(CLIENT_TO_SERVER_EVENTS.CONFIG_APPLY, {
    hostSecret: VALID_SECRET,
    files: [{ key: "teams", value: { teams: [{ name: "Too Late" }] } }]
  });

  const result = lastResult(harness.emittedConfigResults);
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.code, CONFIG_ERROR_CODES.LOCKED);
  assert.equal(harness.observedMutations.length, 0);
});

test("config:apply re-seeds room state from the files it just wrote", () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "sample", "Sample");
  const harness = setupConfigHarness(contentRoot);

  harness.trigger(CLIENT_TO_SERVER_EVENTS.CONFIG_APPLY, {
    hostSecret: VALID_SECRET,
    files: [{ key: "teams", value: { teams: [{ name: "Applied Team" }] } }]
  });

  assert.equal(lastResult(harness.emittedConfigResults).ok, true);
  assert.deepEqual(
    getRoomStateSnapshot().teams.map((team) => team.name),
    ["Applied Team"]
  );
});

// The broadcast gate, asserted at the seam the production code reads it:
// `socketServer`'s `broadcastAfter` emits to the host and display rooms iff
// this flag is true, one line after `applyRoomStateMutation` returns.
test("config:apply reports a mutation so host and display are broadcast to", () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "sample", "Sample");
  const harness = setupConfigHarness(contentRoot);

  harness.trigger(CLIENT_TO_SERVER_EVENTS.CONFIG_APPLY, {
    hostSecret: VALID_SECRET,
    files: [{ key: "teams", value: { teams: [{ name: "Applied Team" }] } }]
  });

  assert.equal(harness.observedMutations.length, 1);
  assert.equal(harness.observedMutations[0]?.didMutate, true);
});

test("config:apply rejects an invalid payload without dispatching a mutation", () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "sample", "Sample");
  const harness = setupConfigHarness(contentRoot);

  harness.trigger(CLIENT_TO_SERVER_EVENTS.CONFIG_APPLY, {
    hostSecret: VALID_SECRET,
    files: [{ key: "players", value: { players: [{ name: "" }] } }]
  });

  const result = lastResult(harness.emittedConfigResults);
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.code, CONFIG_ERROR_CODES.INVALID);
  assert.equal(harness.observedMutations.length, 0);
});

test("config:apply from a fatal state clears it", () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "sample", "Sample");
  writeContentFile(contentRoot, "local/gameConfig.json", "{ not json");

  const bootResult = reloadContentIntoRoomState({ contentRootDir: contentRoot });
  assert.equal(bootResult.ok, false);

  setRoomStateFatalError(bootResult.ok ? "" : bootResult.reason);
  assert.notEqual(getRoomStateSnapshot().fatalError, null);

  const harness = setupConfigHarness(contentRoot);

  // Repairing the broken file is exactly what the wizard is for.
  harness.trigger(CLIENT_TO_SERVER_EVENTS.CONFIG_APPLY, {
    hostSecret: VALID_SECRET,
    files: [
      {
        key: "gameConfig",
        value: {
          name: "Repaired",
          rounds: [
            {
              round: 1,
              label: "Warm Up",
              sauce: "Frank's",
              pointsPerPlayer: 2,
              minigame: "TRIVIA"
            }
          ],
          minigameScoring: { defaultMax: 15, finalRoundMax: 20 },
          timers: {
            eatingSeconds: 120,
            triviaSeconds: 30,
            geoSeconds: 45,
            drawingSeconds: 60
          }
        }
      }
    ]
  });

  assert.equal(lastResult(harness.emittedConfigResults).ok, true);
  assert.equal(getRoomStateSnapshot().fatalError, null);
  assert.equal(getRoomStateSnapshot().gameConfig?.name, "Repaired");
});

// The handler's own try/catch, isolated. The inner layers (readConfigContent,
// reloadContentIntoRoomState) each catch for themselves, so deleting this
// outer guard leaves the rest of the suite green — but it is the only thing
// standing between a throw from any FUTURE config operation and an
// uncaughtException that kills the server, because socket.io v4 dispatches
// listeners inside process.nextTick with nothing above them.
test("answers with an error rather than throwing when a config operation throws", () => {
  const harness = setupHandlers({
    configService: {
      read: () => {
        throw new Error("config service exploded");
      },
      save: () => assert.fail("save should not run"),
      reload: () => assert.fail("reload should not run")
    }
  });

  assert.doesNotThrow(() => {
    harness.trigger(CLIENT_TO_SERVER_EVENTS.CONFIG_READ, {
      hostSecret: VALID_SECRET
    });
  });

  const result = lastResult(harness.emittedConfigResults);
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.message, "config service exploded");
});

test("a config event with an invalid host secret emits no config result", () => {
  const contentRoot = createContentRoot();
  const harness = setupConfigHarness(contentRoot);

  harness.trigger(CLIENT_TO_SERVER_EVENTS.CONFIG_READ, {
    hostSecret: "wrong-secret"
  });

  assert.equal(harness.emittedConfigResults.length, 0);
});

test("a malformed config payload is answered rather than ignored", () => {
  const contentRoot = createContentRoot();
  const harness = setupConfigHarness(contentRoot);

  harness.trigger(CLIENT_TO_SERVER_EVENTS.CONFIG_SAVE, {
    hostSecret: VALID_SECRET,
    files: [{ key: "notAContentFile", value: {} }]
  });

  const result = lastResult(harness.emittedConfigResults);
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.code, CONFIG_ERROR_CODES.BAD_REQUEST);
});
