import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type {
  JoustMinigameHostView,
  JoustMinigameShot,
  JoustPlayerFigure,
  JoustShooterView
} from "@wingnight/shared";
import {
  JOUST_STANDARD_SHOOTER_PROFILE,
  resolveJoustRackSlots,
  resolveJoustRestFrame
} from "@wingnight/shared";

import { HostJoustSurface } from "./index.js";

const TEAM_NAMES = new Map([
  ["team-1", "Team Heat"],
  ["team-2", "Team Chill"]
]);

const PERCHES = [
  { x: 54, y: 78, width: 102 },
  { x: 116, y: 50, width: 34 }
];

const ARENA = {
  id: "arena-1",
  name: "The Lookout",
  perches: PERCHES,
  obstacles: [{ x: 46, y: 66, width: 5, height: 12 }]
};

const LINEUP: JoustPlayerFigure[] = [
  { playerId: "p4", name: "Rosie", avatarSrc: null, teamId: "team-2", genre: "disco" },
  { playerId: "p5", name: "Darren", avatarSrc: null, teamId: "team-2", genre: "disco" },
  { playerId: "p6", name: "Sarah", avatarSrc: null, teamId: "team-2", genre: "disco" }
];

const TEAMMATES: JoustPlayerFigure[] = [
  { playerId: "p1", name: "Alex", avatarSrc: null, teamId: "team-1", genre: "metal" },
  { playerId: "p2", name: "Caitlin", avatarSrc: null, teamId: "team-1", genre: "metal" }
];

const restFrame = resolveJoustRestFrame(
  {
    pinFeet: resolveJoustRackSlots(PERCHES, LINEUP.length),
    perches: PERCHES,
    obstacles: ARENA.obstacles
  },
  { x: -0.8, y: 0.5 }
);

const STANDARD_SHOOTER: JoustShooterView = {
  id: "standard",
  name: "The Standard",
  blurb: "The house shot.",
  color: { fill: "#f97316", dark: "#b8410a", light: "#fdba74" },
  usesLeft: null,
  profile: JOUST_STANDARD_SHOOTER_PROFILE
};

const oneDown: JoustMinigameShot = {
  shotNumber: 1,
  toppledPlayerIds: ["p4"],
  collapsedPerchIndices: [],
  isRackCleared: false,
  points: 1,
  aim: { x: -0.8, y: 0.5 },
  shooterId: "standard",
  pinPlayerIds: ["p4", "p5", "p6"],
  rubblePerchIndices: [],
  run: {
    keyframeHz: 24,
    keyframes: [[...restFrame], [...restFrame]],
    topples: [{ pinIndex: 0, frameIndex: 1 }],
    collapses: []
  }
};

const hostView = (overrides: Partial<JoustMinigameHostView> = {}): JoustMinigameHostView => ({
  minigame: "JOUST",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: { "team-1": 3, "team-2": 1 },
  phase: "aiming",
  arena: ARENA,
  lineup: LINEUP,
  teammates: TEAMMATES,
  downPlayerIds: [],
  collapsedPerchIndices: [],
  previousShotGhost: null,
  activeShooterPlayerId: "p1",
  shotsPerTurn: 3,
  shotIndex: 0,
  aim: { x: 0, y: 0 },
  shots: [],
  lastShot: null,
  shooters: [STANDARD_SHOOTER],
  selectedShooterId: "standard",
  ...overrides
});

// The shell's chrome, as markers: this surface never draws either one, it
// forwards both into the Canvas's slots. JOUST has `timerKey: null`, so the
// real `clock` is always empty here — the marker is what proves the slot
// would carry it if it were not.
const rail = <span data-slot="rail" />;
const clock = <span data-slot="clock" />;

const renderSurface = (
  view: JoustMinigameHostView | null,
  phase: "intro" | "play" = "play",
  canDispatchAction = true
): string => {
  return renderToStaticMarkup(
    <HostJoustSurface
      phase={phase}
      minigameType="JOUST"
      minigameHostView={view}
      activeTeamName="Team Heat"
      teamNameByTeamId={TEAM_NAMES}
      rail={phase === "play" ? rail : null}
      clock={phase === "play" ? clock : null}
      canDispatchAction={canDispatchAction}
      onDispatchAction={(): void => {}}
      serverOrigin={null}
    />
  );
};

const buttonFor = (html: string, label: string): string | null => {
  const buttons = html.match(/<button[^>]*>[\s\S]*?<\/button>/g) ?? [];

  return buttons.find((button) => button.includes(label)) ?? null;
};

// Matches the ATTRIBUTE, not the word: every control carries
// `disabled:opacity-40` in its class list, so a substring check on "disabled"
// reports every button as disabled and quietly passes the whole suite.
const isDisabled = (html: string, label: string): boolean => {
  const button = buttonFor(html, label);

  assert.notEqual(button, null, `expected a "${label}" button`);
  return /<button[^>]*\sdisabled=""/.test(button ?? "");
};

test("renders the lane scene, the shot counter and the rack while aiming", () => {
  const html = renderSurface(hostView());

  assert.match(html, /data-joust-scene/);
  assert.match(html, /data-joust-aim-arena/);
  assert.match(html, /Shot 1 of 3/);
  assert.match(html, /The Lookout/);
  assert.match(html, /Drag back on the lane/);
  assert.match(html, /3 of 3 still standing/);
  assert.match(html, /Alex is up/, "the deck names whose go it is");
});

test("counts a felled player out of the standing line", () => {
  assert.match(renderSurface(hostView({ downPlayerIds: ["p4"] })), /2 of 3 still standing/);
});

test("draws every cactus in the lane", () => {
  const html = renderSurface(
    hostView({
      arena: {
        ...ARENA,
        obstacles: [ARENA.obstacles[0] ?? { x: 0, y: 0, width: 1, height: 1 }, { x: 30, y: 60, width: 5, height: 18 }]
      }
    })
  );
  const cactusCount = (html.match(/stroke-dasharray="1.2 1.6"/g) ?? []).length;

  assert.equal(cactusCount, 2);
});

test("holds next shot until a shot has resolved", () => {
  assert.equal(isDisabled(renderSurface(hostView()), "Next shot"), true);
  assert.equal(
    isDisabled(renderSurface(hostView({ phase: "resolved", lastShot: oneDown })), "Next shot"),
    false
  );
});

test("names who went over and the points once a shot resolves", () => {
  const html = renderSurface(hostView({ phase: "resolved", lastShot: oneDown, shots: [oneDown] }));

  assert.match(html, /data-joust-result/);
  assert.match(html, /One down/);
  assert.match(html, /Rosie/);
  assert.match(html, /\+1/);
  assert.match(html, /Watch the TV/);
});

test("calls a tower coming down timber", () => {
  const timber: JoustMinigameShot = {
    ...oneDown,
    toppledPlayerIds: ["p6"],
    collapsedPerchIndices: [1],
    points: 2,
    run: { ...oneDown.run, collapses: [{ perchIndex: 1, frameIndex: 1 }] }
  };
  const html = renderSurface(hostView({ phase: "resolved", lastShot: timber, shots: [timber] }));

  assert.match(html, /Timber!/);
  assert.match(html, /\+2/);
});

test("draws the last shot's ghost on the tablet while the next teammate aims", () => {
  const html = renderSurface(
    hostView({
      shotIndex: 1,
      previousShotGhost: {
        shotNumber: 1,
        aim: { x: -0.8, y: 0.5 },
        shooterId: "standard",
        path: [
          { x: 40, y: 46 },
          { x: 80, y: 30 }
        ]
      }
    })
  );

  assert.match(html, /data-joust-ghost/);
});

test("lays a fallen tower out as rubble on the tablet too", () => {
  assert.match(renderSurface(hostView({ collapsedPerchIndices: [1] })), /data-joust-rubble/);
});

test("calls a miss a whiff", () => {
  const miss: JoustMinigameShot = {
    ...oneDown,
    toppledPlayerIds: [],
    points: 0,
    run: { ...oneDown.run, topples: [] }
  };
  const html = renderSurface(hostView({ phase: "resolved", lastShot: miss, shots: [miss] }));

  assert.match(html, /Whiff/);
});

test("says the rack is clear once nobody is left standing", () => {
  const html = renderSurface(
    hostView({ phase: "done", downPlayerIds: ["p4", "p5", "p6"], lastShot: oneDown })
  );

  assert.match(html, /Rack cleared — nobody left standing/);
});

test("offers the skip escape hatch only while aiming", () => {
  assert.equal(isDisabled(renderSurface(hostView()), "Skip shot"), false);
  assert.equal(
    isDisabled(renderSurface(hostView({ phase: "resolved", lastShot: oneDown })), "Skip shot"),
    true
  );
});

test("keeps the reset escape hatch available in every phase", () => {
  for (const phase of ["aiming", "resolved", "done"] as const) {
    assert.equal(isDisabled(renderSurface(hostView({ phase, lastShot: oneDown })), "Reset turn"), false);
  }
});

test("tells the host the turn is over instead of offering another shot", () => {
  const html = renderSurface(hostView({ phase: "done", shotIndex: 2, lastShot: oneDown }));

  assert.match(html, /Turn over/);
  assert.equal(buttonFor(html, "Next shot"), null);
});

test("shows a chip per shot with the banked points filled in", () => {
  const html = renderSurface(hostView({ shots: [oneDown], shotIndex: 1 }));

  assert.match(html, /This turn/);
  assert.equal((html.match(/>—</g) ?? []).length, 2);
});

test("lists every team's running total, not just the active one", () => {
  const html = renderSurface(hostView());

  assert.match(html, /Team Heat/);
  assert.match(html, /Team Chill/);
  assert.match(html, /3 pts/);
  assert.match(html, /1 pt</);
});

test("disables every control when the host cannot act", () => {
  const html = renderSurface(hostView({ phase: "resolved", lastShot: oneDown }), "play", false);

  assert.equal(isDisabled(html, "Next shot"), true);
  assert.equal(isDisabled(html, "Reset turn"), true);
  assert.match(html, /Waiting for the host to open the round|Watch the TV/);
});

test("explains the round instead of showing controls during the intro", () => {
  const html = renderSurface(hostView(), "intro");

  assert.match(html, /every player on the team gets one pull/i);
  assert.equal(buttonFor(html, "Next shot"), null);
});

test("points the host at the content pack when no lane is loaded", () => {
  assert.match(renderSurface(hostView({ arena: null })), /joust.json/);
});

// ---------------------------------------------------------------------------
// The Canvas migration (docs/takeover-layout-api.md §5). JOUST is the first
// game the layout was NOT derived from, so these assert placement rather than
// copy: which slot each piece of the deleted 330px deck landed in.
// ---------------------------------------------------------------------------

test("does forward the shell's rail and clock into the canvas chrome row when playing", () => {
  const html = renderSurface(hostView());

  assert.match(html, /<div class="mr-auto min-w-0"><span data-slot="rail"><\/span><\/div>/);
  assert.match(html, /data-slot="clock"/);
  // The rail is the shell's `<header>`; the game adds no landmark of its own,
  // and the `<aside>` the 330px deck used to be is gone with it.
  assert.doesNotMatch(html, /<(?:header|nav|main|section|aside|footer)\b/);
});

// §4: the rail already says whose turn it is. The local team chip and the
// `resolveActiveTeamName` helper copy-pasted into all nine host surfaces went
// together. The name survives exactly once, in the running totals, where it
// is a row of a table rather than a chip about the turn.
test("does not repeat the active team name that the rail already carries", () => {
  const html = renderSurface(hostView());

  assert.equal(html.match(/Team Heat/g)?.length, 1);
  assert.doesNotMatch(html, /At the band:/);
  assert.doesNotMatch(html, /shadow-\[0_0_8px_#f97316\]/);
});

// §6: the clock is a slot in the chrome row now, so the 12rem of rail width
// this game reserved for a chip it has never drawn (`timerKey: null`) goes.
test("does put the turn's counts in the counter slot and reserve no rail width", () => {
  const html = renderSurface(hostView({ shots: [oneDown], shotIndex: 1 }));

  assert.match(html, /Shot 2 of 3/);
  assert.match(html, /3 of 3 still standing/);
  assert.match(html, /\+3 pending/);
  assert.match(html, /This turn/);
  assert.doesNotMatch(html, /pr-\[clamp\(9rem/);
});

// §4: the rail row is read-only. A control beside the clock is where a host
// will not look for it, and on a Canvas it sits under the row's
// `pointer-events-none`.
test("does put no tap target in the read-only chrome row", () => {
  const html = renderSurface(hostView({ shots: [oneDown], shotIndex: 1 }));
  const chromeRow = html.match(/<div class="pointer-events-none absolute left-[\s\S]*?z-20[^"]*">([\s\S]*?)<\/div><div class="pointer-events-none absolute bottom-/);

  assert.notEqual(chromeRow, null, "expected to find the chrome row");
  assert.doesNotMatch(chromeRow?.[1] ?? "", /<button|<a |<input/);
});

// §5/§6: the dock owns the bottom-right corner and the layout owns its
// 4.5rem. Nothing in this file types a reserve any more — there were two.
test("does hand the dock gutter to the layout rather than typing its own", () => {
  const html = renderSurface(hostView({ phase: "resolved", lastShot: oneDown, shots: [oneDown] }));

  // The result plaque and the totals sit inside the readout slot, whose own
  // class carries the offset: anchoring on that class is what makes this bite
  // if the numbers ever move back into the game's styles.
  assert.match(html, /bottom-\[4\.5rem\][^"]*"><div class="[^"]*" data-joust-result/);
  assert.match(html, /max-w-\[calc\(100%-4\.5rem\)\]/);
  assert.doesNotMatch(html, /pr-\[clamp\(9rem/);
});

// §7: the game's stacking is confined to its body and the dock's band is
// reserved. JOUST never wrote 1100 and must not start.
test("does write no z-index of the corner dock's band and no isolate of its own", () => {
  const html = renderSurface(hostView());

  assert.doesNotMatch(html, /z-\[1100\]/);
  // The two the layout writes: the root and the body slot.
  assert.equal(html.match(/isolate/g)?.length, 2);
});

// §5: everything that ends a beat floats bottom-left, with the hint that
// explains it — never in the body, which on a Canvas would put it under the
// dock. The two escape hatches come with it (AGENTS.md §11).
test("does float the beat-enders and the hint in the actions slot", () => {
  const html = renderSurface(hostView());
  const actions =
    html.match(/<div class="pointer-events-none absolute bottom-[^"]*left-[^"]*">([\s\S]*?)$/)?.[1] ??
    "";

  assert.match(actions, /Next shot/);
  assert.match(actions, /Skip shot/);
  assert.match(actions, /Reset turn/);
  assert.match(actions, /Drag back on the lane/);
});

// The lane and whose go are the scene's own identity, so they ride in the
// body rather than in a slot — and take no pointer, because every pixel of
// the frame under them is the drag surface that fires the shot.
test("does name the lane and the shooter over the scene without eating a pull", () => {
  const html = renderSurface(hostView());

  assert.match(html, /pointer-events-none[^"]*"><p class="[^"]*">Lane: The Lookout/);
  assert.match(html, /Alex is up/);
});

// The intro beat is a deck panel, not a takeover: no rail, no clock, no lane.
test("does render a plain briefing panel on the intro beat", () => {
  const html = renderSurface(hostView(), "intro");

  assert.doesNotMatch(html, /data-slot="rail"/);
  assert.doesNotMatch(html, /isolate/);
  assert.doesNotMatch(html, /data-joust-scene/);
});

// An empty bank keeps the takeover — dropping it would take the rail off the
// tablet on the one beat that is already a fault.
test("does keep the takeover when no lane is loaded", () => {
  const html = renderSurface(hostView({ arena: null }));

  assert.match(html, /data-slot="rail"/);
  assert.doesNotMatch(html, /data-joust-aim-arena/);
});

// ---- The loadout -------------------------------------------------------------------------------

const LOG_SHOOTER: JoustShooterView = {
  id: "log",
  name: "The Log",
  blurb: "Big, slow, heavy.",
  color: { fill: "#8b5a2b", dark: "#4a2c12", light: "#c48b55" },
  usesLeft: 1,
  profile: { ...JOUST_STANDARD_SHOOTER_PROFILE, shaftRadius: 3.4, headRadius: 4.8, linkSpacing: 3.8 }
};

test("does hide the loadout when the pack carries one kind", () => {
  assert.doesNotMatch(renderSurface(hostView()), /data-joust-loadout/);
});

test("does show the loadout inside the arena frame and ring the loaded kind", () => {
  const html = renderSurface(
    hostView({ shooters: [STANDARD_SHOOTER, LOG_SHOOTER], selectedShooterId: "log" })
  );

  assert.match(html, /data-joust-loadout/);
  assert.match(html, /data-joust-loadout-kind="log"[^>]*data-joust-loadout-selected="true"/);
  // The row lives in the arena frame, after the aim surface, not in a layout slot.
  assert.ok(html.indexOf("data-joust-aim-arena") < html.indexOf("data-joust-loadout"));
});

test("does draw the loaded kind on the band in its own inks and name it on the group", () => {
  const html = renderSurface(
    hostView({ shooters: [STANDARD_SHOOTER, LOG_SHOOTER], selectedShooterId: "log" })
  );

  assert.match(html, /data-joust-shooter-kind="log"/);
  assert.match(html, /<path d="[^"]*" fill="#8b5a2b" stroke="#4a2c12"[^>]*data-joust-shooter-body/);
});

test("does lock the loadout once the shot has flown", () => {
  const html = renderSurface(
    hostView({
      phase: "resolved",
      lastShot: oneDown,
      shooters: [STANDARD_SHOOTER, LOG_SHOOTER]
    })
  );
  const buttons = html.match(/<button[^>]*data-joust-loadout-kind[^>]*>/g) ?? [];

  assert.equal(buttons.length, 2);
  for (const button of buttons) {
    assert.match(button, /\sdisabled=""/);
  }
});
