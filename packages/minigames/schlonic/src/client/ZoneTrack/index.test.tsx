import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { SchlonicMinigameRun, SchlonicPlayerFigure } from "@wingnight/shared";
import { resolveSchlonicZone } from "@wingnight/shared";

import { resolveRunnerFigure } from "../resolveRunnerFigure/index.js";
import { ZoneTrack } from "./index.js";

const ZONE = resolveSchlonicZone({ seed: 20260919, chunks: 22 });

const ALEX: SchlonicPlayerFigure = {
  playerId: "p-1",
  name: "Alex",
  avatarSrc: "avatars/alex.png",
  teamId: "team-alpha",
  genre: "metal"
};

const createRun = (overrides: Partial<SchlonicMinigameRun>): SchlonicMinigameRun => ({
  runIndex: 0,
  player: ALEX,
  status: "done",
  inputs: [],
  skipped: false,
  result: null,
  ...overrides
});

const render = (runs: SchlonicMinigameRun[], shownRunIndex: number, figure: SchlonicPlayerFigure | null = ALEX): string => {
  const runner = resolveRunnerFigure({ figure, activeTurnTeamId: "team-alpha", serverOrigin: "http://tv.test" });

  return renderToStaticMarkup(
    <ZoneTrack
      zone={ZONE}
      runs={runs}
      shownRunIndex={shownRunIndex}
      runner={runner}
      teamFillClassName={runner.fillClassName}
    />
  );
};

test("does lay out every hazard, every rail, every trench and the post along the strip", () => {
  const markup = render([], 0);
  const hazards = ZONE.props.filter((prop) => prop.kind !== "wing" && prop.kind !== "rail").length;
  const rails = ZONE.props.filter((prop) => prop.kind === "rail").length;

  assert.equal(markup.split("data-schlonic-track-hazard=").length - 1, hazards);
  assert.equal(markup.split("data-schlonic-track-rail=").length - 1, rails);
  assert.equal(markup.split("data-schlonic-track-pit=").length - 1, ZONE.pits.length);
  assert.ok(markup.includes("data-schlonic-track-post"));
  assert.ok(markup.includes(`${hazards} hazards, ${rails} rail${rails === 1 ? "" : "s"} and ${ZONE.pits.length} trenches`));
});

test("does ride the runner's own head along the rail", () => {
  const markup = render([], 0);

  assert.ok(markup.includes("data-schlonic-track-runner"));
  assert.ok(markup.includes('src="http://tv.test/content-assets/avatars/alex.png"'));
  // A team with nobody on the roster still gets a pin: the house hen, in the team's colour.
  assert.ok(render([], 0, null).includes("data-schlonic-track-runner"));
});

test("does pin the turn's earlier runs where they ended, and only the refereed ones", () => {
  const runs = [
    createRun({ runIndex: 0, result: { outcome: "cleared", endTick: 900, wings: 70, distance: 1275 } }),
    createRun({ runIndex: 1, result: { outcome: "fell", endTick: 300, wings: 0, distance: 280 } }),
    createRun({ runIndex: 2, skipped: true, result: null }),
    createRun({ runIndex: 3, status: "running", result: null })
  ];
  const markup = render(runs, 3);

  assert.ok(markup.includes('data-schlonic-track-pin="cleared" data-schlonic-track-at="100"'));
  assert.ok(markup.includes('data-schlonic-track-pin="fell"'));
  assert.ok(markup.includes("Alex went into the roadworks here"));
  assert.equal(markup.split("data-schlonic-track-pin=").length - 1, 2);
  // The run on the wall is the live pin, not a finished one.
  assert.equal(render(runs, 1).split("data-schlonic-track-pin=").length - 1, 1);
});
