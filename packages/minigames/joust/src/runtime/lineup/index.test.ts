import assert from "node:assert/strict";
import test from "node:test";

import type { JoustPlayerFigure } from "@wingnight/shared";

import { resolveBenchOrder } from "./index.js";

const figure = (name: string): JoustPlayerFigure => ({
  playerId: name.toLowerCase(),
  name,
  avatarSrc: null,
  teamId: "team-alpha",
  genre: null
});

const TEAM = [figure("Alex"), figure("Caitlin"), figure("Dan")];

const slots = (places: ReturnType<typeof resolveBenchOrder>): Record<string, number> =>
  Object.fromEntries(places.map((place) => [place.figure.name, place.slot]));

// Who has walked off, nearest the post first.
const doneNames = (places: ReturnType<typeof resolveBenchOrder>): string[] =>
  places
    .filter((place) => place.isDone)
    .sort((a, b) => a.slot - b.slot)
    .map((place) => place.figure.name);

test("does stand the team in turn order behind the post on the first shot", () => {
  const places = resolveBenchOrder({
    teammates: TEAM,
    activeShooterPlayerId: "alex",
    shotIndex: 0,
    shotsPerTurn: 3
  });

  assert.deepEqual(slots(places), { Alex: 0, Caitlin: 1, Dan: 2 });
  assert.deepEqual(doneNames(places), []);
});

test("does step the line up a spot and walk the last shooter off to the far end on the next shot", () => {
  const places = resolveBenchOrder({
    teammates: TEAM,
    activeShooterPlayerId: "caitlin",
    shotIndex: 1,
    shotsPerTurn: 3
  });

  assert.deepEqual(slots(places), { Caitlin: 0, Dan: 1, Alex: 3 });
  assert.deepEqual(doneNames(places), ["Alex"]);
});

test("does leave a player who has walked off where they are when the next one walks off", () => {
  const places = resolveBenchOrder({
    teammates: TEAM,
    activeShooterPlayerId: "dan",
    shotIndex: 2,
    shotsPerTurn: 3
  });

  assert.deepEqual(slots(places), { Dan: 0, Alex: 3, Caitlin: 2 });
  assert.deepEqual(doneNames(places), ["Caitlin", "Alex"]);
});

test("does keep a player in the line when they have shot but will shoot again", () => {
  const places = resolveBenchOrder({
    teammates: TEAM,
    activeShooterPlayerId: "caitlin",
    shotIndex: 1,
    shotsPerTurn: 6
  });

  assert.deepEqual(slots(places), { Caitlin: 0, Dan: 1, Alex: 2 });
  assert.deepEqual(doneNames(places), []);
});

test("does walk a second-round shooter off only after their last shot", () => {
  const places = resolveBenchOrder({
    teammates: TEAM,
    activeShooterPlayerId: "caitlin",
    shotIndex: 4,
    shotsPerTurn: 6
  });

  assert.deepEqual(slots(places), { Caitlin: 0, Dan: 1, Alex: 3 });
  assert.deepEqual(doneNames(places), ["Alex"]);
});

test("does walk the last shooter off into the gap when the turn is over", () => {
  const places = resolveBenchOrder({
    teammates: TEAM,
    activeShooterPlayerId: null,
    shotIndex: 2,
    shotsPerTurn: 3
  });

  assert.deepEqual(slots(places), { Dan: 1, Caitlin: 2, Alex: 3 });
  assert.deepEqual(doneNames(places), ["Dan", "Caitlin", "Alex"]);
});

test("does keep everybody in their place when the rack is cleared before they shot", () => {
  const places = resolveBenchOrder({
    teammates: TEAM,
    activeShooterPlayerId: null,
    shotIndex: 0,
    shotsPerTurn: 3
  });

  assert.deepEqual(slots(places), { Caitlin: 1, Dan: 2, Alex: 3 });
  assert.deepEqual(doneNames(places), ["Caitlin", "Dan", "Alex"]);
});

test("does give an empty team no bench", () => {
  assert.deepEqual(
    resolveBenchOrder({ teammates: [], activeShooterPlayerId: null, shotIndex: 0, shotsPerTurn: 0 }),
    []
  );
});
