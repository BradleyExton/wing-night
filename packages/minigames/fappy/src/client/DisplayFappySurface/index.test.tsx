import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { FappyMinigameDisplayView, Player, Team } from "@wingnight/shared";

import { DisplayFappySurface } from "./index.js";

const players: Player[] = [
  { id: "p-1", name: "Alex", avatarSrc: "avatars/alex.png" },
  { id: "p-2", name: "Morgan" }
];
const teams: Team[] = [
  { id: "team-alpha", name: "Team Alpha", playerIds: ["p-1", "p-2"], totalScore: 0, genre: "disco" }
];

const createView = (overrides: Partial<FappyMinigameDisplayView> = {}): FappyMinigameDisplayView => {
  return {
    minigame: "FAPPY",
    activeTurnTeamId: "team-alpha",
    pendingPointsByTeamId: { "team-alpha": 5 },
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

const render = (
  view: FappyMinigameDisplayView | null,
  phase: "intro" | "play" = "play",
  serverOrigin: string | null = "http://127.0.0.1:3000"
): string => {
  return renderToStaticMarkup(
    <DisplayFappySurface
      phase={phase}
      minigameType="FAPPY"
      minigameDisplayView={view}
      activeTeamName="Team Alpha"
      serverOrigin={serverOrigin}
      players={players}
      teams={teams}
    />
  );
};

test("does show the intro card before play", () => {
  const html = render(createView(), "intro");

  assert.match(html, /Fappy Bird/);
  assert.doesNotMatch(html, /data-fappy-scene/);
});

test("does wait when there is no view yet", () => {
  assert.match(render(null), /Waiting for the relay/);
});

test("does draw the marquee, the course and the player's own bird", () => {
  const html = render(createView());

  assert.match(html, /Team Alpha/);
  assert.match(html, /Leg 1 of 2/);
  assert.match(html, /0 \/ 6 gates/);
  assert.match(html, /\+5/);
  assert.match(html, /data-fappy-scene="display-fappy"/);
  assert.equal((html.match(/data-fappy-gate="/g) ?? []).length, 3);
  assert.match(html, /content-assets\/avatars\/alex\.png/);
  assert.match(html, /data-character-apparel="lapels"/);
  assert.match(html, /Alex is up — tap to launch/);
});

test("does drop the plaque over the corridor once the leg has landed", () => {
  const html = render(
    createView({
      phase: "landed",
      legs: [
        { legIndex: 0, playerId: "p-1", seed: 11, status: "landed", flapTicks: [0], gatesCleared: 3, endTick: 400, outcome: "cleared" },
        { legIndex: 1, playerId: "p-2", seed: 12, status: "ready", flapTicks: [], gatesCleared: 0, endTick: null, outcome: null }
      ],
      totalGatesCleared: 3
    })
  );

  assert.match(html, /data-fappy-result="cleared"/);
  assert.match(html, /Section cleared/);
  assert.match(html, /3 \/ 6 gates/);
});

test("does keep the last leg on the wall and call the relay over when done", () => {
  const html = render(createView({ phase: "done", legIndex: 2 }));

  assert.match(html, /Leg 2 of 2/);
  assert.match(html, /Relay over/);
  assert.match(html, /Morgan/);
});
