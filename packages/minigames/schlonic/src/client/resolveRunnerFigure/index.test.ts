import assert from "node:assert/strict";
import test from "node:test";

import { resolveRunnerFigure } from "./index.js";

const FIGURE = {
  playerId: "p1",
  name: "Alex",
  avatarSrc: "avatars/alex.png",
  teamId: "team-a",
  genre: "Metal"
};

test("runs the player's own hen, in their team's colour and their team's shape", () => {
  const runner = resolveRunnerFigure({
    figure: FIGURE,
    activeTurnTeamId: "team-b",
    serverOrigin: "http://server.test"
  });

  assert.equal(runner.playerName, "Alex");
  assert.ok(runner.fillClassName.startsWith("text-team"));
  assert.notEqual(runner.silhouette, undefined);
});

test("gives the same player the same bird every night, whatever the roster order", () => {
  const first = resolveRunnerFigure({ figure: FIGURE, activeTurnTeamId: null, serverOrigin: null });
  const again = resolveRunnerFigure({ figure: FIGURE, activeTurnTeamId: null, serverOrigin: null });

  assert.deepEqual(first.appearance, again.appearance);
});

test("falls back to the turn's team for a run with nobody on it", () => {
  const anonymous = resolveRunnerFigure({
    figure: null,
    activeTurnTeamId: "team-b",
    serverOrigin: null
  });
  const seated = resolveRunnerFigure({
    figure: { ...FIGURE, teamId: "team-b" },
    activeTurnTeamId: null,
    serverOrigin: null
  });

  assert.equal(anonymous.playerName, null);
  assert.equal(anonymous.fillClassName, seated.fillClassName);
  assert.equal(anonymous.apparel, undefined);
});

test("gives an unseated runner the cast's neutral rather than someone else's colour", () => {
  assert.equal(
    resolveRunnerFigure({ figure: null, activeTurnTeamId: null, serverOrigin: null }).fillClassName,
    "text-mutedWarm"
  );
});
