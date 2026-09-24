import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { FappyMinigameHostView, FappyMinigameLeg, FappyPlayerFigure } from "@wingnight/shared";

import { HostFappySurface } from "./index.js";

const ALEX: FappyPlayerFigure = { playerId: "p-1", name: "Alex", avatarSrc: "avatars/alex.png", teamId: "team-alpha", genre: "country" };
const MORGAN: FappyPlayerFigure = { playerId: "p-2", name: "Morgan", avatarSrc: null, teamId: "team-alpha", genre: "country" };
const DAN: FappyPlayerFigure = { playerId: "p-3", name: "Dan B", avatarSrc: null, teamId: "team-alpha", genre: "country" };
const teamNameByTeamId = new Map([["team-alpha", "Team Alpha"]]);
const T0 = 1_700_000_000_000;

const createLeg = (overrides: Partial<FappyMinigameLeg> = {}): FappyMinigameLeg => {
  return {
    legIndex: 0,
    player: ALEX,
    seed: 11,
    status: "ready",
    attempt: 0,
    checkpointGate: 0,
    flapTicks: [],
    crashes: 0,
    skipped: false,
    knockedEagles: [],
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
    legs: [createLeg(), createLeg({ legIndex: 1, player: MORGAN, seed: 12 })],
    totalGatesCleared: 0,
    startedAtMs: null,
    finishedAtMs: null,
    timedOutAtMs: null,
    elapsedMs: null,
    points: null,
    ...overrides
  };
};

// `rail` and `clock` are the shell's, and the surface only forwards them into
// the layout's slots — a marker element each is enough to prove it does.
const RAIL = <span data-test-rail />;

const render = (
  view: FappyMinigameHostView | null,
  phase: "intro" | "play" = "play",
  serverOrigin: string | null = null
): string => {
  return renderToStaticMarkup(
    <HostFappySurface
      phase={phase}
      minigameType="FAPPY"
      minigameHostView={view}
      activeTeamName="Team Alpha"
      teamNameByTeamId={teamNameByTeamId}
      rail={phase === "play" ? RAIL : null}
      clock={null}
      canDispatchAction
      onDispatchAction={(): void => {
        return;
      }}
      serverOrigin={serverOrigin}
    />
  );
};

test("does brief the relay without a corridor during the intro", () => {
  const html = render(createView(), "intro");

  assert.match(html, /against one clock/);
  assert.doesNotMatch(html, /data-fappy-arena/);
  // The intro is a panel in the host's own control deck, not a takeover: no
  // rail slot, and so no chrome row to put one in.
  assert.doesNotMatch(html, /data-test-rail/);
});

test("does forward the shell's rail and say the team nowhere itself", () => {
  const html = render(createView());

  assert.match(html, /data-test-rail/);
  // The mini-rail names the turn's team; the chip this surface used to draw
  // said it a second time on the same canvas, which is the duplication the
  // takeover layout exists to remove. (The running totals still list every
  // team's name — that is a row of numbers, not a chip saying whose go it is.)
  assert.doesNotMatch(html, /In the air:/);
  assert.doesNotMatch(html, /shadow-\[0_0_8px_#f97316\]/);
});

test("does give the corridor the whole canvas with no deck column", () => {
  const html = render(createView());

  // The 330px deck and the hint row under the board are both gone: the frame
  // takes the body slot's full height and the layout floats the rest.
  assert.doesNotMatch(html, /w-\[clamp\(230px,28vw,330px\)\]/);
  assert.match(html, /class="relative h-full w-full touch-none[^"]*"[^>]*data-fappy-arena/);
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
  assert.match(html, /Alex: tap anywhere to take off/);
  assert.match(html, /data-fappy-cliffs/);
  assert.match(html, /data-fappy-wall/);
});

test("does stand the next player's bird on the landing cliff and name them in the hint", () => {
  const html = render(
    createView({
      legIndex: 1,
      startedAtMs: T0,
      legs: [
        createLeg({ status: "cleared", flapTicks: [0, 9], lastRun: { endTick: 300, gatesCleared: 3, outcome: "cleared" } }),
        createLeg({ legIndex: 1, player: MORGAN, seed: 12 })
      ],
      totalGatesCleared: 3
    })
  );

  assert.doesNotMatch(html, /data-fappy-waiting-bird/);
  assert.match(html, /data-fappy-finish-flag/);
  assert.match(html, /Leg 2 of 2/);
  assert.match(html, /Flying: Morgan/);
  assert.match(html, /3 of 6 gates/);
  assert.match(html, /come down on the far cliff/);

  const firstLegHtml = render(createView());

  assert.match(firstLegHtml, /data-fappy-waiting-bird/);
  assert.match(firstLegHtml, /land next to Morgan/);
  assert.doesNotMatch(firstLegHtml, /data-fappy-finish-flag/);
});

test("does send a crashed bird back to its perch with the crash count showing", () => {
  const html = render(
    createView({
      startedAtMs: T0,
      legs: [
        createLeg({ attempt: 2, checkpointGate: 1, crashes: 2, lastRun: { endTick: 120, gatesCleared: 1, outcome: "crashed" } }),
        createLeg({ legIndex: 1, player: MORGAN, seed: 12 })
      ],
      totalGatesCleared: 1
    })
  );

  assert.match(html, /Back on the perch at gate 1/);
  // The leg chips are the only place the crash count is said now that the
  // deck's leg card is gone.
  assert.match(html, /data-fappy-crashes="2"/);
  assert.match(html, /2×/);
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
        createLeg({ legIndex: 1, player: MORGAN, seed: 12, status: "cleared", crashes: 1 })
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
  const html = render(createView({ legs: [createLeg({ player: null }), createLeg({ legIndex: 1, player: null })] }));

  assert.match(html, /Flying: the house hen/);
  assert.match(html, /data-character-body="round"/);
});

// Step 1: the chrome row's leg strip is faces now, not dashes. Who was up
// next used to live only in an italic hint pill nobody looked at.
test("does put a face on every leg of the relay and tag the one up next", () => {
  const html = render(createView(), "play", "http://127.0.0.1:3000");

  assert.match(html, /data-fappy-lineup="tablet"/);
  assert.equal((html.match(/data-fappy-lineup-chip="/g) ?? []).length, 2);
  assert.match(html, /data-fappy-lineup-chip="0" data-fappy-lineup-state="flying"/);
  assert.match(html, /data-fappy-lineup-chip="1" data-fappy-lineup-state="next"/);
  // Alex's generated head, addressed against the server origin exactly the way
  // the corridor's bird addresses it; Morgan has none, so initials.
  assert.match(html, /content-assets\/avatars\/alex\.png/);
  assert.match(html, /data-fappy-head="photo"/);
  assert.match(html, /data-fappy-head="initials"/);
  assert.match(html, /data-fappy-lineup-player="Morgan"/);
  // The dashes are gone with the component that drew them.
  assert.doesNotMatch(html, /min-w-\[2\.2rem\]/);
});

// Step 3: who is up after the handoff, on the hint and on the callout.
test("does name the player after the next one while a leg is in hand", () => {
  const threeLegs = [
    createLeg(),
    createLeg({ legIndex: 1, player: MORGAN, seed: 12 }),
    createLeg({ legIndex: 2, player: DAN, seed: 13 })
  ];

  assert.match(
    render(createView({ legsPerTurn: 3, legs: threeLegs })),
    /land next to Morgan\. Then Dan B\./
  );
  assert.match(
    render(createView({ phase: "flying", legsPerTurn: 3, legs: threeLegs, startedAtMs: T0 })),
    /land next to Morgan and hand it over\. Then Dan B\./
  );
});

test("does say nothing about an on-deck player when there is nobody after", () => {
  const html = render(createView());

  assert.match(html, /land next to Morgan\./);
  assert.doesNotMatch(html, /Then /);
});

// Step 4: the arena says nothing on its own while a leg waits to be tapped,
// so the tablet uses the whole of it to answer "whose is this?".
test("does poster the flyer's name over the arena while the leg is waiting on a tap", () => {
  const html = render(createView());

  assert.match(html, /data-fappy-leg-poster="start"/);
  assert.match(html, /Tap to fly/);
  // It can never cost the player their first flap.
  assert.match(html, /class="pointer-events-none[^"]*"[^>]*data-fappy-leg-poster/);

  const respawn = render(
    createView({
      startedAtMs: T0,
      legs: [
        createLeg({ attempt: 1, checkpointGate: 1, crashes: 1 }),
        createLeg({ legIndex: 1, player: MORGAN, seed: 12 })
      ]
    })
  );

  assert.match(respawn, /data-fappy-leg-poster="respawn"/);
  assert.match(respawn, /Tap to go again/);

  // Gone while the bird is in the air.
  assert.doesNotMatch(render(createView({ phase: "flying", startedAtMs: T0 })), /data-fappy-leg-poster/);
});

// Step 5: for most of a leg the bird being aimed at is off the right edge.
test("does peek the waiting player over the bezel while their bird is off screen", () => {
  const html = render(createView());

  assert.match(html, /data-fappy-waiter-peek/);
  assert.match(html, /waiting at the cliff/);

  // The last leg has nobody waiting, so there is nobody to peek at either.
  assert.doesNotMatch(
    render(
      createView({
        legIndex: 1,
        startedAtMs: T0,
        legs: [createLeg({ status: "cleared" }), createLeg({ legIndex: 1, player: MORGAN, seed: 12 })]
      })
    ),
    /data-fappy-waiter-peek/
  );
});
