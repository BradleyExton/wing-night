import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  createContentRoot,
  writeContentFile,
  writeValidContentTree
} from "../contentLoader/testHarness.js";
import {
  applyRoomStateMutation,
  getRoomStateSnapshot,
  resetRoomState,
  setRoomStateFatalError,
  setRoomStatePlayers,
  setRoomStateTeams
} from "../roomState/index.js";
import { reloadContentIntoRoomState } from "./index.js";

beforeEach(() => {
  resetRoomState();
});

const writeTwoRoundGameConfig = (contentRoot: string): void => {
  writeContentFile(
    contentRoot,
    "local/gameConfig.json",
    JSON.stringify({
      name: "Two Rounds",
      rounds: [
        {
          round: 1,
          label: "Warm Up",
          sauce: "Frank's",
          pointsPerPlayer: 2,
          minigame: "TRIVIA"
        },
        {
          round: 2,
          label: "Finale",
          sauce: "Ghost",
          pointsPerPlayer: 3,
          minigame: "DRAWING"
        }
      ],
      minigameScoring: { defaultMax: 15, finalRoundMax: 20 },
      timers: {
        eatingSeconds: 120,
        triviaSeconds: 30,
        geoSeconds: 45,
        drawingSeconds: 60
      }
    })
  );
};

test("re-seeds room state from disk and recomputes totalRounds", () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "sample", "Sample");
  writeTwoRoundGameConfig(contentRoot);

  const result = reloadContentIntoRoomState({ contentRootDir: contentRoot });

  assert.equal(result.ok, true);
  const snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.gameConfig?.name, "Two Rounds");
  assert.equal(snapshot.totalRounds, 2);
});

// The Plan's decided semantics: apply re-seeds from the files and overwrites
// live setup edits — pre-flight wins pre-night, the deck wins in-room after.
test("replaces live rosters with the file contents when it re-seeds", () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "sample", "Sample");

  setRoomStatePlayers([{ id: "live-1", name: "Live Player" }]);
  setRoomStateTeams([
    { id: "live-team", name: "Live Team", playerIds: [], totalScore: 0 }
  ]);

  reloadContentIntoRoomState({ contentRootDir: contentRoot });

  const snapshot = getRoomStateSnapshot();
  assert.deepEqual(
    snapshot.players.map((player) => player.name),
    ["Sample Player"]
  );
  assert.deepEqual(
    snapshot.teams.map((team) => team.name),
    ["Sample Team"]
  );
});

// The repair path: a server that booted fatal on bad content must be able to
// come back, or the config surface cannot fix the thing it exists to fix.
test("clears fatalError so a server that booted broken can be repaired", () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "sample", "Sample");

  setRoomStateFatalError("content/local/gameConfig.json is unparseable");
  assert.notEqual(getRoomStateSnapshot().fatalError, null);

  const result = reloadContentIntoRoomState({ contentRootDir: contentRoot });

  assert.equal(result.ok, true);
  assert.equal(getRoomStateSnapshot().fatalError, null);
});

test("returns a failure reason rather than throwing when content will not load", () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "sample", "Sample");
  writeContentFile(contentRoot, "local/gameConfig.json", "{ not json");

  const result = reloadContentIntoRoomState({ contentRootDir: contentRoot });

  assert.equal(result.ok, false);
  assert.match(
    result.ok ? "" : result.reason,
    /Failed to parse game config content/
  );
});

// Apply's failure policy, and the reason the reload returns a result instead
// of throwing: `setRoomStateFatalError` resets the room before flagging, so a
// throwing reload would have cost the host the roster they just typed in.
test("leaves live room state untouched when the reload fails", () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "sample", "Sample");
  writeContentFile(contentRoot, "local/players.json", "{ not json");

  setRoomStatePlayers([{ id: "live-1", name: "Live Player" }]);

  reloadContentIntoRoomState({ contentRootDir: contentRoot });

  assert.deepEqual(
    getRoomStateSnapshot().players.map((player) => player.name),
    ["Live Player"]
  );
  assert.equal(getRoomStateSnapshot().fatalError, null);
});

// The broadcast proof chain. `socketServer`'s `broadcastAfter` is
// `applyRoomStateMutation(runMutation)` and then a broadcast to the host and
// display rooms IFF `didMutate` — so this asserts the exact condition that
// decides whether host and display see the new config. The four re-seed
// setters are plain functions that never raise the flag; only the reload's own
// `reportRoomStateMutation()` does.
test("reports its mutation so the broadcast gate opens after a re-seed", () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "sample", "Sample");

  const mutationResult = applyRoomStateMutation(() => {
    reloadContentIntoRoomState({ contentRootDir: contentRoot });
    return getRoomStateSnapshot();
  });

  assert.equal(mutationResult.didMutate, true);
});

// The negative half: without a reported mutation the gate stays shut. This is
// what makes the test above meaningful rather than vacuous — it pins that
// `didMutate` is genuinely off by default in this window.
test("leaves the broadcast gate shut when no mutation is reported", () => {
  const mutationResult = applyRoomStateMutation(() => getRoomStateSnapshot());

  assert.equal(mutationResult.didMutate, false);
});

test("reports a failed reload as no mutation so nothing is broadcast", () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "sample", "Sample");
  writeContentFile(contentRoot, "local/teams.json", "{ not json");

  const mutationResult = applyRoomStateMutation(() => {
    reloadContentIntoRoomState({ contentRootDir: contentRoot });
    return getRoomStateSnapshot();
  });

  assert.equal(mutationResult.didMutate, false);
});
