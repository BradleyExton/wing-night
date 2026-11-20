import assert from "node:assert/strict";
import test from "node:test";
import type { BrawlCrewHenStats, BrawlPlayerFigure } from "@wingnight/shared";

import { resolveTurnAwards } from "./index.js";

const figure = (playerId: string, name: string): BrawlPlayerFigure => ({ playerId, name, avatarSrc: null, teamId: "team-alpha", genre: null, outfit: null });
const roster = [figure("p1", "Alex"), figure("p2", "Caitlin"), figure("p3", "Dan"), figure("p4", "Rosie")];
const stats = (overrides: Partial<BrawlCrewHenStats>): BrawlCrewHenStats => ({ goons: 0, worth: 0, hits: 0, downs: 0, revives: 0, ...overrides });

test("does name the hen with the most geese, the most revives and the one carried most often", () => {
  const awards = resolveTurnAwards(
    { p1: stats({ goons: 9, downs: 1 }), p2: stats({ goons: 14, revives: 1 }), p3: stats({ goons: 3, revives: 4, downs: 3 }) },
    roster
  );

  assert.deepEqual(
    awards.map((award) => [award.kind, award.winners.map((winner) => winner.name), award.value]),
    [
      ["geese", ["Caitlin"], 14],
      ["revives", ["Dan"], 4],
      ["carried", ["Dan"], 3]
    ]
  );
});

test("does name everyone in a tie, in roster order", () => {
  const awards = resolveTurnAwards({ p3: stats({ goons: 5 }), p1: stats({ goons: 5 }), p2: stats({ goons: 2 }) }, roster);

  assert.deepEqual(awards[0]?.winners.map((winner) => winner.name), ["Alex", "Dan"]);
});

test("does not give an award nobody scored on: a crew that never went down has nobody to tease", () => {
  const awards = resolveTurnAwards({ p1: stats({ goons: 2 }), p2: stats({ goons: 1 }) }, roster);

  assert.deepEqual(awards.map((award) => award.kind), ["geese"]);
});

test("does not give an award the whole crew shares: a wipe carried every one of them once", () => {
  const awards = resolveTurnAwards({ p1: stats({ goons: 4, downs: 1 }), p2: stats({ goons: 2, downs: 1 }), p3: stats({ downs: 1 }) }, roster);

  assert.deepEqual(awards.map((award) => award.kind), ["geese"]);
});

test("does still name a hen who played the street alone", () => {
  assert.deepEqual(resolveTurnAwards({ p2: stats({ goons: 6, downs: 2 }) }, roster).map((award) => [award.kind, award.value]), [
    ["geese", 6],
    ["carried", 2]
  ]);
});

test("does count only the players who were on the street, and give nothing before the turn is over", () => {
  assert.deepEqual(resolveTurnAwards(null, roster), []);
  assert.deepEqual(resolveTurnAwards({}, roster), []);
  assert.deepEqual(
    resolveTurnAwards({ ghost: stats({ goons: 99 }), p4: stats({ goons: 1 }) }, roster).map((award) => award.winners.map((winner) => winner.name)),
    [["Rosie"]]
  );
});
