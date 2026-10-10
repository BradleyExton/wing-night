import assert from "node:assert/strict";
import test from "node:test";

import { UNSEAT_KEY, findMoveTarget, resolveMoveTargets } from "./index";

const teams = [
  { id: "molten-metal", name: "Molten Metal" },
  { id: "spice-girls", name: "Spice Girls" },
  { id: "disco-inferno", name: "Disco Inferno" }
];

test("does offer every other team and then Unseat when the member is seated", () => {
  assert.deepEqual(resolveMoveTargets(teams, "Spice Girls"), [
    { key: "team:molten-metal", teamName: "Molten Metal" },
    { key: "team:disco-inferno", teamName: "Disco Inferno" },
    { key: UNSEAT_KEY, teamName: null }
  ]);
});

test("does offer every team and no Unseat when the guest is unseated", () => {
  const targets = resolveMoveTargets(teams, null);

  assert.deepEqual(
    targets.map((target) => target.teamName),
    ["Molten Metal", "Spice Girls", "Disco Inferno"]
  );
  assert.equal(findMoveTarget(targets, UNSEAT_KEY), undefined);
});

test("does keep every team on offer when the member's pick names a team the roster no longer has", () => {
  assert.equal(resolveMoveTargets(teams, "Honky Tonk Heat").length, teams.length + 1);
});

test("does find a target by its option key, and nothing for a key it never offered", () => {
  const targets = resolveMoveTargets(teams, "Molten Metal");

  assert.deepEqual(findMoveTarget(targets, "team:spice-girls"), { key: "team:spice-girls", teamName: "Spice Girls" });
  assert.deepEqual(findMoveTarget(targets, UNSEAT_KEY), { key: UNSEAT_KEY, teamName: null });
  assert.equal(findMoveTarget(targets, "team:molten-metal"), undefined);
});
