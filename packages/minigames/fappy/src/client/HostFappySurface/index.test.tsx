import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { FappyMinigameHostView, Player, Team } from "@wingnight/shared";

import { HostFappySurface } from "./index.js";

const players: Player[] = [
  { id: "p-1", name: "Alex" },
  { id: "p-2", name: "Morgan" }
];
const teams: Team[] = [
  { id: "team-alpha", name: "Team Alpha", playerIds: ["p-1", "p-2"], totalScore: 0, genre: "country" }
];
const teamNameByTeamId = new Map([["team-alpha", "Team Alpha"]]);

const createView = (overrides: Partial<FappyMinigameHostView> = {}): FappyMinigameHostView => {
  return {
    minigame: "FAPPY",
    activeTurnTeamId: "team-alpha",
    pendingPointsByTeamId: { "team-alpha": 3 },
    phase: "ready",
    legIndex: 0,
    legsPerTurn: 2,
    gatesPerLeg: 3,
    pointsPerGate: 1,
    legs: [
      { legIndex: 0, playerId: "p-1", seed: 11, status: "ready", flapTicks: [], gatesCleared: 0, endTick: null, outcome: null },
      { legIndex: 1, playerId: "p-2", seed: 12, status: "ready", flapTicks: [], gatesCleared: 0, endTick: null, outcome: null }
    ],
    totalGatesCleared: 0,
    ...overrides
  };
};

const render = (view: FappyMinigameHostView | null, phase: "intro" | "play" = "play"): string => {
  return renderToStaticMarkup(
    <HostFappySurface
      phase={phase}
      minigameType="FAPPY"
      minigameHostView={view}
      activeTeamName="Team Alpha"
      teamNameByTeamId={teamNameByTeamId}
      canDispatchAction
      onDispatchAction={(): void => {
        return;
      }}
      serverOrigin={null}
      players={players}
      teams={teams}
    />
  );
};

test("does brief the relay without a corridor during the intro", () => {
  const html = render(createView(), "intro");

  assert.match(html, /Fappy Bird/);
  assert.match(html, /fly a relay/);
  assert.doesNotMatch(html, /data-fappy-arena/);
});

test("does draw the leg's course and name the player who is up", () => {
  const html = render(createView());

  assert.match(html, /data-fappy-arena/);
  assert.match(html, /data-fappy-scene="host-fappy"/);
  assert.equal((html.match(/data-fappy-gate="/g) ?? []).length, 3);
  assert.match(html, /Leg 1 of 2/);
  assert.match(html, /Flying: Alex/);
  assert.match(html, /Pass the tablet → Morgan/);
  assert.match(html, /\+3 pending/);
  assert.match(html, /Tap anywhere on the corridor/);
});

test("does keep the pass button locked until the leg has landed", () => {
  const readyHtml = render(createView());
  const landedHtml = render(
    createView({
      phase: "landed",
      legs: [
        { legIndex: 0, playerId: "p-1", seed: 11, status: "landed", flapTicks: [0, 14], gatesCleared: 2, endTick: 190, outcome: "crashed" },
        { legIndex: 1, playerId: "p-2", seed: 12, status: "ready", flapTicks: [], gatesCleared: 0, endTick: null, outcome: null }
      ],
      totalGatesCleared: 2
    })
  );

  assert.match(readyHtml, /<button[^>]*disabled=""[^>]*>Pass the tablet/);
  assert.doesNotMatch(landedHtml, /<button[^>]*disabled=""[^>]*>Pass the tablet/);
  assert.match(landedHtml, /data-fappy-outcome="crashed"/);
  assert.match(landedHtml, /Down in the sand\./);
  assert.match(landedHtml, /\+2 gates/);
  assert.match(landedHtml, /2 gates cleared/);
});

test("does offer to finish the relay on the last leg and report it over when done", () => {
  const lastLegHtml = render(createView({ legIndex: 1 }));
  const doneHtml = render(createView({ phase: "done", legIndex: 2 }));

  assert.match(lastLegHtml, /Finish the relay/);
  assert.match(lastLegHtml, /Leg 2 of 2/);
  assert.match(doneHtml, /Relay over/);
  assert.doesNotMatch(doneHtml, /Pass the tablet/);
});

test("does fall back to the house hen when the leg names nobody on the roster", () => {
  const html = render(
    createView({
      legs: [
        { legIndex: 0, playerId: null, seed: 11, status: "ready", flapTicks: [], gatesCleared: 0, endTick: null, outcome: null },
        { legIndex: 1, playerId: null, seed: 12, status: "ready", flapTicks: [], gatesCleared: 0, endTick: null, outcome: null }
      ]
    })
  );

  assert.match(html, /Flying: the house hen/);
  assert.match(html, /data-character-body="round"/);
});
