import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { FappyMinigameHostView, FappyMinigameLeg, Player, Team } from "@wingnight/shared";

import { HostFappySurface } from "./index.js";

const players: Player[] = [
  { id: "p-1", name: "Alex" },
  { id: "p-2", name: "Morgan" }
];
const teams: Team[] = [
  { id: "team-alpha", name: "Team Alpha", playerIds: ["p-1", "p-2"], totalScore: 0, genre: "country" }
];
const teamNameByTeamId = new Map([["team-alpha", "Team Alpha"]]);
const T0 = 1_700_000_000_000;

const createLeg = (overrides: Partial<FappyMinigameLeg> = {}): FappyMinigameLeg => {
  return {
    legIndex: 0,
    playerId: "p-1",
    seed: 11,
    status: "ready",
    attempt: 0,
    checkpointGate: 0,
    flapTicks: [],
    crashes: 0,
    skipped: false,
    lastRun: null,
    ...overrides
  };
};

const createView = (overrides: Partial<FappyMinigameHostView> = {}): FappyMinigameHostView => {
  return {
    minigame: "FAPPY",
    activeTurnTeamId: "team-alpha",
    pendingPointsByTeamId: { "team-alpha": 3 },
    phase: "ready",
    legIndex: 0,
    legsPerTurn: 2,
    gatesPerLeg: 3,
    parSeconds: 20,
    limitSeconds: 60,
    legs: [createLeg(), createLeg({ legIndex: 1, playerId: "p-2", seed: 12 })],
    totalGatesCleared: 0,
    startedAtMs: null,
    finishedAtMs: null,
    timedOutAtMs: null,
    elapsedMs: null,
    points: null,
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
  assert.match(html, /against one clock/);
  assert.doesNotMatch(html, /data-fappy-arena/);
});

test("does draw the leg's course, the idle clock and the player who is up", () => {
  const html = render(createView());

  assert.match(html, /data-fappy-arena/);
  assert.match(html, /data-fappy-scene="host-fappy"/);
  assert.equal((html.match(/data-fappy-gate="/g) ?? []).length, 3);
  assert.equal((html.match(/data-fappy-champ/g) ?? []).length, 3);
  assert.match(html, /Leg 1 of 2/);
  assert.match(html, /Flying: Alex/);
  assert.match(html, /0:00\.0/);
  assert.match(html, /\/ 1:00/);
  assert.match(html, /0 of 6 gates/);
  assert.match(html, /Tap anywhere on the corridor/);
  assert.doesNotMatch(html, /data-fappy-handoff/);
});

test("does call the handoff over the corridor when the next leg is ready", () => {
  const html = render(
    createView({
      legIndex: 1,
      startedAtMs: T0,
      legs: [
        createLeg({ status: "cleared", flapTicks: [0, 9], lastRun: { endTick: 300, gatesCleared: 3, outcome: "cleared" } }),
        createLeg({ legIndex: 1, playerId: "p-2", seed: 12 })
      ],
      totalGatesCleared: 3
    })
  );

  assert.match(html, /data-fappy-handoff/);
  assert.match(html, /Hand it to Morgan!/);
  assert.match(html, /Leg 2 of 2/);
  assert.match(html, /Flying: Morgan/);
  assert.match(html, /3 of 6 gates/);
});

test("does send a crashed bird back to its perch with the crash count showing", () => {
  const html = render(
    createView({
      startedAtMs: T0,
      legs: [
        createLeg({ attempt: 2, checkpointGate: 1, crashes: 2, lastRun: { endTick: 120, gatesCleared: 1, outcome: "crashed" } }),
        createLeg({ legIndex: 1, playerId: "p-2", seed: 12 })
      ],
      totalGatesCleared: 1
    })
  );

  assert.match(html, /Back on the perch at gate 1/);
  assert.match(html, /data-fappy-crashes="2"/);
  assert.match(html, /2 crashes/);
  assert.doesNotMatch(html, /data-fappy-handoff/);
});

test("does show the time and the points once the relay is through", () => {
  const html = render(
    createView({
      phase: "finished",
      legIndex: 2,
      startedAtMs: T0,
      finishedAtMs: T0 + 31_500,
      elapsedMs: 31_500,
      points: 12,
      legs: [
        createLeg({ status: "cleared" }),
        createLeg({ legIndex: 1, playerId: "p-2", seed: 12, status: "cleared", crashes: 1 })
      ],
      totalGatesCleared: 6,
      pendingPointsByTeamId: { "team-alpha": 15 }
    })
  );

  assert.match(html, /data-fappy-finish="finished"/);
  assert.match(html, /Through!/);
  assert.match(html, /0:31\.5/);
  assert.match(html, /\+12/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Skip leg/);
});

test("does call time when the limit caught the team", () => {
  const html = render(
    createView({
      phase: "timedOut",
      startedAtMs: T0,
      timedOutAtMs: T0 + 60_000,
      elapsedMs: 60_000,
      points: 2,
      totalGatesCleared: 4
    })
  );

  assert.match(html, /data-fappy-finish="timedOut"/);
  assert.match(html, /Time!/);
  assert.match(html, /4 of 6 gates/);
  assert.match(html, /\+2/);
});

test("does fall back to the house hen when the leg names nobody on the roster", () => {
  const html = render(createView({ legs: [createLeg({ playerId: null }), createLeg({ legIndex: 1, playerId: null })] }));

  assert.match(html, /Flying: the house hen/);
  assert.match(html, /data-character-body="round"/);
});
