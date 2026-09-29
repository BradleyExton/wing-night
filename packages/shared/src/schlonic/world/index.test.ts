import assert from "node:assert/strict";
import test from "node:test";

import {
  SCHLONIC_FINALE_CHUNKS,
  SCHLONIC_WORLD,
  isSchlonicInPit,
  isSchlonicOverPit,
  resolveSchlonicFinaleX,
  resolveSchlonicGroundSlope,
  resolveSchlonicGroundY,
  resolveSchlonicWingTotal,
  resolveSchlonicTickCap,
  SCHLONIC_RIDE_ONS,
  resolveSchlonicCourse,
  resolveSchlonicLegFromX,
  resolveSchlonicZone
} from "./index.js";

const zoneOf = (seed: number, chunks = 12) => resolveSchlonicZone({ seed, chunks });

test("draws the same zone twice from the same seed", () => {
  assert.deepEqual(zoneOf(99), zoneOf(99));
});

test("draws a different zone from a different seed", () => {
  assert.notDeepEqual(zoneOf(1).heights, zoneOf(2).heights);
});

test("keeps the ground inside the box however the chunks stack up", () => {
  for (let seed = 0; seed < 40; seed += 1) {
    for (const height of zoneOf(seed, 30).heights) {
      assert.ok(
        height >= SCHLONIC_WORLD.groundMinY && height <= SCHLONIC_WORLD.groundMaxY,
        `seed ${seed} put the ground at ${height}`
      );
    }
  }
});

test("opens with two level chunks and closes on one, so the zone is readable off the line", () => {
  const zone = zoneOf(5, 12);
  const level = SCHLONIC_WORLD.chunkWidth * 2;

  for (let x = 0; x <= level; x += 5) {
    assert.equal(resolveSchlonicGroundY(zone, x), SCHLONIC_WORLD.groundBaseY);
    assert.equal(isSchlonicOverPit(zone, x), false);
  }

  assert.equal(resolveSchlonicGroundSlope(zone, zone.goalX - 20), 0);
});

test("deals every team the same mix of hard kit rather than rolling each slot", () => {
  for (let seed = 0; seed < 25; seed += 1) {
    const zone = zoneOf(seed, 22);
    const kinds = new Set(zone.props.map((prop) => prop.kind));

    assert.ok(zone.pits.length >= 1, `seed ${seed} laid no pit`);
    assert.ok(kinds.has("hazard"), `seed ${seed} laid no crowd`);
    assert.ok(kinds.has("kicker"), `seed ${seed} laid no kicker`);
    assert.ok(kinds.has("rail"), `seed ${seed} laid no furniture`);
  }
});

test("deals the whole crowd and every piece of furniture over the round's streets", () => {
  const crowd = new Set<string>();
  const furniture = new Set<string>();

  for (let seed = 0; seed < 12; seed += 1) {
    for (const prop of zoneOf(seed, 22).props) {
      if (prop.kind === "hazard") {
        assert.ok(prop.hazard !== undefined, `seed ${seed} laid a nobody`);
        crowd.add(prop.hazard);
      }

      if (prop.kind === "rail") {
        assert.ok(prop.rideOn !== undefined, `seed ${seed} laid furniture with no shape`);
        furniture.add(prop.rideOn);
      }
    }
  }

  assert.deepEqual([...crowd].sort(), ["goose", "punk", "roadie", "sleeper", "stagger", "tent"]);
  assert.deepEqual([...furniture].sort(), ["bench", "car", "ledge", "rail"]);
});

test("stands every piece of furniture at its own height over level ground, one of the crowd at its end, and its wings worth two along its top", () => {
  const { runnerRadius, wingRadius, highLineWingScale, highLineWorth } = SCHLONIC_WORLD;

  for (let seed = 0; seed < 25; seed += 1) {
    const zone = zoneOf(seed, 22);
    const rails = zone.props.filter((prop) => prop.kind === "rail");

    assert.ok(rails.length >= 1, `seed ${seed} laid no furniture`);

    for (const rail of rails) {
      assert.ok(rail.toX !== undefined && rail.rideOn !== undefined, `seed ${seed} laid furniture with no end`);

      const spec = SCHLONIC_RIDE_ONS[rail.rideOn];
      const length = rail.toX - rail.x;
      const ground = resolveSchlonicGroundY(zone, rail.x);

      assert.equal(length, spec.length);
      assert.equal(resolveSchlonicGroundY(zone, rail.toX), ground, "the furniture stands over level ground");
      assert.equal(rail.y, ground - spec.above);
      assert.ok(
        zone.props.some((prop) => prop.kind === "hazard" && prop.x === rail.toX && prop.y === ground),
        `seed ${seed} put nobody at the end of its ${rail.rideOn}`
      );

      // Everything hung over the top; the floor line under its near end is not the top's.
      const strung = zone.props.filter(
        (prop) => prop.kind === "wing" && prop.x >= rail.x && prop.x <= (rail.toX ?? 0) && prop.y < rail.y
      );

      assert.equal(strung.length, spec.wings, `seed ${seed} strung ${strung.length} wings along its ${rail.rideOn}`);
      // Spread along the whole of it, not bunched at one end.
      assert.ok(strung.some((wing) => wing.x < rail.x + length / 3), `seed ${seed} left the near end bare`);
      assert.ok(strung.some((wing) => wing.x > (rail.toX ?? 0) - length / 2), `seed ${seed} left the far end bare`);

      for (const wing of strung) {
        assert.equal(wing.worth, highLineWorth);
        // Just over the top, where a grinding bird's body passes…
        assert.equal(wing.y, rail.y - runnerRadius - wingRadius);
        // …and, on the handrail, out of reach of one on the floor under it.
        if (rail.rideOn === "rail") {
          assert.ok(ground - runnerRadius - wing.y > runnerRadius + wingRadius * highLineWingScale);
        }
      }
    }
  }
});

test("carries an end only on a rail", () => {
  const zone = zoneOf(3, 22);

  assert.ok(zone.props.every((prop) => (prop.kind === "rail") === (prop.toX !== undefined)));
});

test("hangs enough wings that a clean run is worth chasing", () => {
  assert.ok(resolveSchlonicWingTotal(zoneOf(3, 22)) > 80);
});

test("hangs the high line at double worth and the floor at one", () => {
  const zone = zoneOf(3, 22);
  const wings = zone.props.filter((prop) => prop.kind === "wing");
  const high = wings.filter((prop) => prop.worth === SCHLONIC_WORLD.highLineWorth);
  const floor = wings.filter((prop) => prop.worth === undefined);

  assert.ok(high.length >= 10, `only ${high.length} on the high line`);
  assert.ok(floor.length > high.length, "the floor should still carry most of the wings");
  // Worth is what the total counts, so a perfect run is more than a wing a wing.
  assert.equal(resolveSchlonicWingTotal(zone), floor.length + high.length * SCHLONIC_WORLD.highLineWorth);
  // Nothing but a wing is worth anything.
  assert.ok(zone.props.every((prop) => prop.kind === "wing" || prop.worth === undefined));
});

test("ends every zone on a kicker over a hole before the post", () => {
  for (let seed = 0; seed < 25; seed += 1) {
    const zone = zoneOf(seed, 12);
    const finaleX = resolveSchlonicFinaleX(zone);
    const lastPit = zone.pits[zone.pits.length - 1];
    const finaleSpring = zone.props.find((prop) => prop.kind === "kicker" && prop.x >= finaleX);

    assert.equal(finaleX, zone.goalX - SCHLONIC_FINALE_CHUNKS * SCHLONIC_WORLD.chunkWidth);
    assert.ok(finaleSpring !== undefined, `seed ${seed} has no finale kicker`);
    assert.ok(lastPit !== undefined && lastPit.fromX > finaleSpring.x, `seed ${seed} has no hole after it`);
    assert.equal(lastPit.toX - lastPit.fromX, SCHLONIC_WORLD.finalePitWidth);
    assert.ok(lastPit.toX < zone.goalX, `seed ${seed} put the hole past the post`);
    // The biggest arc in the zone hangs in the spring's flight.
    const arc = zone.props.filter((prop) => prop.kind === "wing" && prop.x > finaleSpring.x && prop.x < lastPit.toX);

    assert.ok(arc.some((prop) => prop.worth === SCHLONIC_WORLD.highLineWorth), `seed ${seed} hangs no high line over the finale`);
  }
});

test("keeps every wing inside the box and off the floor", () => {
  const zone = zoneOf(11, 24);

  for (const prop of zone.props) {
    assert.ok(prop.y >= 0 && prop.y <= SCHLONIC_WORLD.height, `prop at y ${prop.y}`);
  }
});

test("reads the ground straight between two samples", () => {
  const zone = zoneOf(4, 12);
  const step = SCHLONIC_WORLD.sampleStep;
  const from = zone.heights[8] ?? 0;
  const to = zone.heights[9] ?? 0;

  assert.equal(resolveSchlonicGroundY(zone, 8 * step), from);
  assert.equal(resolveSchlonicGroundY(zone, 8.5 * step), (from + to) / 2);
  assert.equal(resolveSchlonicGroundSlope(zone, 8 * step + 1), (to - from) / step);
});

test("holds nothing up over a pit, and calls the runner in once it drops below the lip", () => {
  const zone = zoneOf(1, 22);
  const pit = zone.pits[0];

  assert.ok(pit !== undefined);
  assert.equal(resolveSchlonicGroundY(zone, pit.fromX + 4), SCHLONIC_WORLD.pitFloorY);
  // Sailing over the hole is not falling into it.
  assert.equal(isSchlonicInPit(zone, pit.fromX + 4, pit.lipY - 20), false);
  assert.equal(isSchlonicInPit(zone, pit.fromX + 4, pit.lipY + 10), true);
  // The ground either side is solid.
  assert.equal(isSchlonicInPit(zone, pit.fromX - 2, pit.lipY + 10), false);
});

test("lays a course of one leg as the zone it always was", () => {
  assert.deepEqual(resolveSchlonicZone({ seed: 7, chunks: 12, legs: 1, leg: 0 }), zoneOf(7));
  assert.deepEqual(resolveSchlonicCourse({ seed: 7, chunks: 12 }), zoneOf(7));
});

test("lays a relay course end to end, and every leg of it as a zone with its own run-up, finale and post", () => {
  const chunks = 8;
  const legs = 3;
  const course = resolveSchlonicCourse({ seed: 21, chunks, legs });
  const legWidth = chunks * SCHLONIC_WORLD.chunkWidth;

  assert.equal(course.goalX, legs * legWidth);

  for (let leg = 0; leg < legs; leg += 1) {
    const zone = resolveSchlonicZone({ seed: 21, chunks, legs, leg });
    const fromX = resolveSchlonicLegFromX({ seed: 21, chunks, legs, leg });

    assert.equal(fromX, leg * legWidth);
    assert.equal(zone.goalX, legWidth);
    // Its ground is the course's own stretch, plus the next leg's run-up past the post.
    assert.equal(zone.heights.length, zoneOf(21, chunks).heights.length);
    assert.deepEqual(
      zone.heights,
      course.heights.slice(leg * chunks * 6, leg * chunks * 6 + chunks * 6 + 7)
    );
    // Level off the line, and a finale over a hole before the post — on every leg, not just
    // the last, because a handoff is worth a loud last ten seconds too.
    assert.equal(resolveSchlonicGroundSlope(zone, 30), 0);
    assert.equal(resolveSchlonicGroundSlope(zone, 90), 0);
    assert.ok(zone.props.some((prop) => prop.kind === "kicker" && prop.x >= resolveSchlonicFinaleX(zone)));
    assert.ok(zone.pits.some((pit) => pit.toX > resolveSchlonicFinaleX(zone) && pit.toX < zone.goalX));
    // Every prop and hole is the course's, moved back by the leg's start.
    for (const prop of zone.props) {
      const onCourse = course.props.find((entry) => entry.x === prop.x + fromX && entry.kind === prop.kind && entry.y === prop.y);

      assert.ok(onCourse !== undefined, `leg ${leg} has a prop the course does not: ${JSON.stringify(prop)}`);
      assert.ok(prop.x >= 0 && prop.x < zone.goalX);
    }
    assert.deepEqual(zone.props.map((prop) => prop.index), zone.props.map((_prop, index) => index));
    for (const pit of zone.pits) {
      assert.ok(course.pits.some((entry) => entry.fromX === pit.fromX + fromX && entry.toX === pit.toX + fromX));
      assert.ok(pit.fromX >= 0 && pit.toX < zone.goalX);
    }
  }

  // The legs between them carry every hole the course has.
  const legPits = [0, 1, 2].reduce((total, leg) => total + resolveSchlonicZone({ seed: 21, chunks, legs, leg }).pits.length, 0);

  assert.equal(legPits, course.pits.length);
});

test("clamps a leg to the course and treats a missing leg count as one", () => {
  assert.deepEqual(resolveSchlonicZone({ seed: 5, chunks: 8, legs: 2, leg: 9 }), resolveSchlonicZone({ seed: 5, chunks: 8, legs: 2, leg: 1 }));
  assert.deepEqual(resolveSchlonicZone({ seed: 5, chunks: 8, leg: 3 }), zoneOf(5, 8));
});

test("caps a run well past the time the post can possibly take to arrive", () => {
  const zone = zoneOf(2, 22);

  assert.ok(resolveSchlonicTickCap(zone) > zone.goalX / SCHLONIC_WORLD.topSpeed);
});
