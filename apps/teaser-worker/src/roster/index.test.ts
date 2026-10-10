import assert from "node:assert/strict";
import test from "node:test";

import { ROSTER_PATH, parseRoster, readRoster } from "./index.ts";

const ORIGIN = "https://wingnight.tv";

// Assets that answer the roster path with whatever the test hands them, and count the reads.
const createAssets = (answer: () => Response) => {
  const assets = {
    reads: 0,
    fetch: async (request: Request): Promise<Response> => {
      assert.equal(new URL(request.url).pathname, ROSTER_PATH);
      assets.reads += 1;

      return answer();
    }
  };

  return assets;
};

const createDeps = (answer: () => Response) => {
  const errors: string[] = [];

  return { assets: createAssets(answer), logError: (message: string) => errors.push(message), errors };
};

const jsonResponse = (body: unknown): Response => new Response(JSON.stringify(body), { status: 200 });

const ROSTER = {
  players: [{ id: "player-1", name: "Rob" }],
  teams: [
    { id: "team-1", name: "Iron Hens", playerIds: ["player-1"], totalScore: 0, genre: "Metal", color: "teamB" },
    { id: "team-2", name: "Mirror Balls", playerIds: [], totalScore: 0, genre: "Disco", color: "not-a-token" },
    { id: "team-3", name: "Barn Burners", playerIds: [], totalScore: 0 }
  ]
};

test("does keep every team in file order, with its genre and only a token colour, when the roster parses", () => {
  assert.deepEqual(parseRoster(ROSTER), {
    teams: [
      { id: "team-1", name: "Iron Hens", genre: "Metal", color: "teamB" },
      { id: "team-2", name: "Mirror Balls", genre: "Disco" },
      { id: "team-3", name: "Barn Burners" }
    ]
  });
});

test("does keep a team nobody is seated on when the roster parses", () => {
  const parsed = parseRoster({ players: [], teams: [{ id: "team-1", name: "New Team", playerIds: [], totalScore: 0 }] });

  assert.deepEqual(parsed?.teams.map((team) => team.name), ["New Team"]);
});

test("does refuse the roster when it is not the shape tools/build-teaser writes", () => {
  const malformed: unknown[] = [
    null,
    "a string",
    [],
    { players: [] },
    { teams: "nope" },
    { teams: [{ id: "team-1" }] },
    { teams: [{ id: "team-1", name: "" }] },
    { teams: [{ id: "", name: "Iron Hens" }] },
    { teams: [{ id: "team-1", name: "Iron Hens", genre: 7 }] },
    { teams: [{ id: "team-1", name: "Iron Hens" }, null] }
  ];

  for (const value of malformed) {
    assert.equal(parseRoster(value), null, JSON.stringify(value));
  }
});

test("does read the roster once per assets binding when it is read repeatedly", async () => {
  const deps = createDeps(() => jsonResponse(ROSTER));
  const [first, second] = await Promise.all([readRoster(deps, ORIGIN), readRoster(deps, ORIGIN)]);
  const third = await readRoster(deps, ORIGIN);

  assert.deepEqual(first?.teams.map((team) => team.name), ["Iron Hens", "Mirror Balls", "Barn Burners"]);
  assert.equal(second, first);
  assert.equal(third, first);
  assert.equal(deps.assets.reads, 1);
  assert.deepEqual(deps.errors, []);
});

test("does answer null and log the deploy bug when the roster is missing", async () => {
  const deps = createDeps(() => new Response("not found", { status: 404 }));

  assert.equal(await readRoster(deps, ORIGIN), null);
  assert.equal(deps.errors.length, 1);
  assert.match(deps.errors[0] ?? "", /teaser-roster\.json is missing/);
});

test("does answer null and log when the assets hand back the page instead of the roster", async () => {
  const deps = createDeps(() => new Response("<!doctype html><title>teaser</title>", { status: 200 }));

  assert.equal(await readRoster(deps, ORIGIN), null);
  assert.match(deps.errors[0] ?? "", /not JSON/);
});

test("does answer null and log when the roster is malformed", async () => {
  const deps = createDeps(() => jsonResponse({ players: [], teams: [{ name: "Iron Hens" }] }));

  assert.equal(await readRoster(deps, ORIGIN), null);
  assert.match(deps.errors[0] ?? "", /not a roster/);
});

test("does read again, and log again, when an earlier read found no roster", async () => {
  let answer: () => Response = () => new Response("not found", { status: 404 });
  const deps = createDeps(() => answer());

  assert.equal(await readRoster(deps, ORIGIN), null);
  assert.equal(await readRoster(deps, ORIGIN), null);
  assert.equal(deps.errors.length, 2);

  answer = () => jsonResponse(ROSTER);

  assert.equal((await readRoster(deps, ORIGIN))?.teams.length, 3);
  assert.equal(deps.assets.reads, 3);
});

test("does read again when an earlier read threw", async () => {
  let fail = true;
  const deps = createDeps(() => {
    if (fail) {
      throw new Error("assets down");
    }

    return jsonResponse(ROSTER);
  });

  await assert.rejects(readRoster(deps, ORIGIN), /assets down/);
  fail = false;
  assert.equal((await readRoster(deps, ORIGIN))?.teams.length, 3);
});
