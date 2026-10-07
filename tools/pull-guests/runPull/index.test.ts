import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import test from "node:test";

import type { AdminGuestExport } from "../../../packages/shared/src/guestPortal/export/index.ts";
import { runPull, type PullOptions } from "./index.ts";

const TOKEN = "test-admin-token";
const NOW = new Date("2026-10-07T12:00:00.000Z");
const ROB_HEAD = Uint8Array.of(137, 80, 78, 71, 1, 2, 3);
const KIM_HEAD = Uint8Array.of(137, 80, 78, 71, 4, 5, 6, 7);
const sha256 = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");

type FakePortal = {
  guests: AdminGuestExport[];
  heads: Map<string, Uint8Array<ArrayBuffer>>;
  requests: { url: string; authorization: string | null }[];
  failingHeads: Set<string>;
  redirectTo: string | null;
  fetch: typeof fetch;
};

const createFakePortal = (heads: Record<string, Uint8Array<ArrayBuffer>>, names: Record<string, string>): FakePortal => {
  const portal: FakePortal = {
    guests: Object.entries(names).map(([guestId, displayName]) => {
      const bytes = heads[guestId];

      return {
        guestId,
        displayName,
        head: bytes === undefined ? null : { sha256: sha256(bytes), contentType: "image/png", bytes: bytes.byteLength }
      };
    }),
    heads: new Map(Object.entries(heads)),
    requests: [],
    failingHeads: new Set(),
    redirectTo: null,
    fetch: async (input, init) => {
      const url = new URL(String(input));
      const authorization = new Headers(init?.headers).get("Authorization");

      portal.requests.push({ url: url.href, authorization });

      if (authorization !== `Bearer ${TOKEN}`) {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }

      if (portal.redirectTo !== null) {
        return new Response(null, { status: 302, headers: { Location: portal.redirectTo } });
      }

      if (url.pathname === "/api/admin/export") {
        return Response.json(portal.guests);
      }

      const head = /^\/api\/admin\/guests\/([^/]+)\/avatar$/.exec(url.pathname);
      const bytes = head === null ? undefined : portal.heads.get(decodeURIComponent(head[1] as string));

      if (portal.failingHeads.has(head?.[1] ?? "")) {
        // A careless server echoing the request back: the token must still never surface.
        return new Response(`boom ${authorization}`, { status: 500 });
      }

      return bytes === undefined ? Response.json({ error: "not_found" }, { status: 404 }) : new Response(bytes);
    }
  };

  return portal;
};

const createPack = (files: Record<string, string>): string => {
  const rootDir = mkdtempSync(join(tmpdir(), "wn-pull-"));

  for (const [file, contents] of Object.entries(files)) {
    mkdirSync(join(rootDir, file, ".."), { recursive: true });
    writeFileSync(join(rootDir, file), contents);
  }

  return rootDir;
};

// Every directory and file under the pack, with each file's hash: equal snapshots, untouched pack.
const snapshotPack = (rootDir: string): Record<string, string> => {
  const entries: Record<string, string> = {};
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);

      if (statSync(path).isDirectory()) {
        entries[`${relative(rootDir, path)}/`] = "dir";
        walk(path);
      } else {
        entries[relative(rootDir, path)] = sha256(readFileSync(path));
      }
    }
  };

  walk(rootDir);

  return entries;
};

const readJson = (rootDir: string, file: string): unknown => JSON.parse(readFileSync(join(rootDir, file), "utf8"));

const ROSTER = `${JSON.stringify({ players: [{ name: "Rob", team: "Metal", avatarSrc: "avatars/rob.png" }, { name: "Alex" }] }, null, 2)}\n`;
const MANIFEST = `${JSON.stringify({ generated: { rob: { file: "rob.png", model: "m", at: "then" } } }, null, 2)}\n`;

const options = (rootDir: string, portal: FakePortal, overrides: Partial<PullOptions> = {}): PullOptions => ({
  contentRootDir: rootDir,
  origin: "http://127.0.0.1:8787",
  token: TOKEN,
  dryRun: false,
  fetch: portal.fetch,
  now: () => NOW,
  log: () => {},
  ...overrides
});

test("does write the heads, the manifest and the roster and back up the old ones when a pull changes the pack", async () => {
  const rootDir = createPack({ "local/players.json": ROSTER, "local/avatar-sources/manifest.json": MANIFEST });
  const portal = createFakePortal({ g_rob: ROB_HEAD, g_kim: KIM_HEAD }, { g_kim: "Kim", g_rob: "rob" });

  try {
    await runPull(options(rootDir, portal));

    const robFile = `rob-${sha256(ROB_HEAD).slice(0, 8)}.png`;
    const kimFile = `kim-${sha256(KIM_HEAD).slice(0, 8)}.png`;

    assert.deepEqual(readJson(rootDir, "local/players.json"), {
      players: [
        { name: "Rob", team: "Metal", avatarSrc: `avatars/${robFile}` },
        { name: "Alex" },
        { name: "Kim", avatarSrc: `avatars/${kimFile}` }
      ]
    });
    assert.deepEqual(readJson(rootDir, "local/avatar-sources/manifest.json"), {
      generated: {
        rob: { file: robFile, source: "online", at: NOW.toISOString(), sha256: sha256(ROB_HEAD), guestId: "g_rob" },
        kim: { file: kimFile, source: "online", at: NOW.toISOString(), sha256: sha256(KIM_HEAD), guestId: "g_kim" }
      },
      onlineGuests: { g_kim: "kim", g_rob: "rob" }
    });
    assert.deepEqual([...readFileSync(join(rootDir, "local/assets/avatars", robFile))], [...ROB_HEAD]);
    assert.equal(readFileSync(join(rootDir, "local/players.json.2026-10-07T12-00-00-000Z.bak"), "utf8"), ROSTER);
    assert.equal(
      readFileSync(join(rootDir, "local/avatar-sources/manifest.json.2026-10-07T12-00-00-000Z.bak"), "utf8"),
      MANIFEST
    );
    assert.ok(portal.requests.every((request) => request.authorization === `Bearer ${TOKEN}`));
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("does write nothing at all when the run is a dry run", async () => {
  const rootDir = createPack({ "local/players.json": ROSTER, "local/avatar-sources/manifest.json": MANIFEST });
  const portal = createFakePortal({ g_rob: ROB_HEAD }, { g_rob: "Rob", g_kim: "Kim" });
  const lines: string[] = [];

  try {
    const before = snapshotPack(rootDir);
    const plan = await runPull(options(rootDir, portal, { dryRun: true, log: (line) => lines.push(line) }));

    assert.deepEqual(snapshotPack(rootDir), before);
    assert.deepEqual(plan.addedPlayers, ["Kim"]);
    assert.ok(lines.includes("  + Kim"));
    assert.ok(lines.includes(`  local/assets/avatars/rob-${sha256(ROB_HEAD).slice(0, 8)}.png (7 bytes)`));
    assert.equal(lines.at(-1), "Dry run: nothing written.");
    assert.equal(portal.requests.length, 1, "a dry run fetches the export and no head");
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("does write nothing, not even a directory, when a dry run meets a pack with no roster yet", async () => {
  const rootDir = createPack({});
  const portal = createFakePortal({ g_rob: ROB_HEAD }, { g_rob: "Rob" });

  try {
    await runPull(options(rootDir, portal, { dryRun: true }));

    assert.deepEqual(snapshotPack(rootDir), {});
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("does abort with nothing written when a head's bytes do not match its hash", async () => {
  const rootDir = createPack({ "local/players.json": ROSTER, "local/avatar-sources/manifest.json": MANIFEST });
  const portal = createFakePortal({ g_kim: KIM_HEAD, g_rob: ROB_HEAD }, { g_kim: "Kim", g_rob: "Rob" });

  portal.heads.set("g_rob", Uint8Array.of(0, 0, 0));

  try {
    const before = snapshotPack(rootDir);

    await assert.rejects(runPull(options(rootDir, portal)), /Rob's head did not match its hash/);
    assert.deepEqual(snapshotPack(rootDir), before);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("does abort with nothing written when guests collide on a slug", async () => {
  const rootDir = createPack({ "local/players.json": ROSTER });
  const portal = createFakePortal({ g_rob: ROB_HEAD }, { g_rob: "Rob", g_rob2: "ROB" });

  try {
    const before = snapshotPack(rootDir);

    await assert.rejects(runPull(options(rootDir, portal)), /Pull refused, nothing written/);
    assert.deepEqual(snapshotPack(rootDir), before);
    assert.equal(portal.requests.length, 1, "no head was fetched");
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("does write nothing and back nothing up when the pack already has every guest and head", async () => {
  const rootDir = createPack({ "local/players.json": ROSTER });
  const portal = createFakePortal({ g_rob: ROB_HEAD }, { g_rob: "Rob" });

  try {
    await runPull(options(rootDir, portal));

    const settled = snapshotPack(rootDir);

    await runPull(options(rootDir, portal, { now: () => new Date("2026-10-08T00:00:00.000Z") }));

    assert.deepEqual(snapshotPack(rootDir), settled);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("does refuse the origin before sending the token when it is plain http to another machine", async () => {
  const rootDir = createPack({});
  const portal = createFakePortal({}, {});

  try {
    await assert.rejects(runPull(options(rootDir, portal, { origin: "http://wingnight.tv" })), /must be https/);
    assert.equal(portal.requests.length, 0);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("does name the token when the portal refuses it", async () => {
  const rootDir = createPack({});
  const portal = createFakePortal({}, {});

  try {
    await assert.rejects(
      runPull(options(rootDir, portal, { token: "wrong" })),
      /answered 403 .*WINGNIGHT_ADMIN_API_TOKEN/
    );
    assert.deepEqual(snapshotPack(rootDir), {});
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("does keep unknown fields on the roster and the manifest and no guest id in players.json when a pull rewrites them", async () => {
  const rootDir = createPack({
    "local/players.json": JSON.stringify({
      $schema: "x",
      note: { keep: true },
      players: [{ name: "Rob", team: "Metal", nickname: "R", extra: [1, 2] }, { name: "Alex", avatarSrc: "avatars/alex.png", foo: null }]
    }),
    "local/avatar-sources/manifest.json": JSON.stringify({ version: 2, generated: { alex: { file: "alex.png", model: "m", at: "t" } } })
  });
  const portal = createFakePortal({ g_rob: ROB_HEAD, g_zoe: KIM_HEAD }, { g_rob: "rob", g_zoe: "Zoë 🔥" });

  try {
    await runPull(options(rootDir, portal));

    const players = readJson(rootDir, "local/players.json") as { $schema: string; note: unknown; players: unknown[] };
    const manifest = readJson(rootDir, "local/avatar-sources/manifest.json") as { version: number; generated: Record<string, unknown> };

    assert.equal(players.$schema, "x");
    assert.deepEqual(players.note, { keep: true });
    assert.deepEqual(players.players, [
      { name: "Rob", team: "Metal", nickname: "R", extra: [1, 2], avatarSrc: `avatars/rob-${sha256(ROB_HEAD).slice(0, 8)}.png` },
      { name: "Alex", avatarSrc: "avatars/alex.png", foo: null },
      { name: "Zoë 🔥", avatarSrc: `avatars/zoe-${sha256(KIM_HEAD).slice(0, 8)}.png` }
    ]);
    assert.doesNotMatch(readFileSync(join(rootDir, "local/players.json"), "utf8"), /g_rob|g_zoe/);
    assert.equal(manifest.version, 2);
    assert.deepEqual(manifest.generated.alex, { file: "alex.png", model: "m", at: "t" });
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("does keep the token out of every log line and error when a head download fails", async () => {
  const rootDir = createPack({ "local/players.json": ROSTER });
  const portal = createFakePortal({ g_rob: ROB_HEAD }, { g_rob: "Rob" });
  const lines: string[] = [];

  portal.failingHeads.add("g_rob");

  try {
    const error = await runPull(options(rootDir, portal, { log: (line) => lines.push(line) })).catch((caught: unknown) => caught);

    assert.ok(error instanceof Error);
    assert.match(error.message, /answered 500/);
    assert.doesNotMatch(`${error.message}\n${lines.join("\n")}`, new RegExp(TOKEN));
    assert.deepEqual(Object.keys(snapshotPack(rootDir)), ["local/", "local/players.json"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("does name the backups and say a rerun repairs it when a write fails part way", async () => {
  const rootDir = createPack({ "local/players.json": ROSTER, "local/avatar-sources/manifest.json": MANIFEST });
  const portal = createFakePortal({ g_rob: ROB_HEAD }, { g_rob: "Rob" });
  const squatter = join(rootDir, `local/players.json.${process.pid}.tmp`);

  // A directory where the roster's temp file goes: the head and the manifest land, the roster cannot.
  mkdirSync(squatter);

  try {
    await assert.rejects(runPull(options(rootDir, portal)), (error: Error) => {
      assert.match(error.message, /^Writing .*players\.json failed/);
      assert.match(error.message, /HALF-WRITTEN: 2 of 3 files landed/);
      assert.match(error.message, /Backups: .*players\.json\.2026-10-07T12-00-00-000Z\.bak, .*manifest\.json\.2026-10-07T12-00-00-000Z\.bak\./);
      assert.match(error.message, /run pnpm pack:pull again/);
      return true;
    });

    rmSync(squatter, { recursive: true });
    await runPull(options(rootDir, portal, { now: () => new Date("2026-10-07T13:00:00.000Z") }));

    assert.deepEqual((readJson(rootDir, "local/players.json") as { players: unknown[] }).players[0], {
      name: "Rob",
      team: "Metal",
      avatarSrc: `avatars/rob-${sha256(ROB_HEAD).slice(0, 8)}.png`
    });
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("does keep one player when a pulled guest is renamed on the portal before the next pull", async () => {
  const rootDir = createPack({ "local/players.json": ROSTER });

  try {
    await runPull(options(rootDir, createFakePortal({ g_rob: ROB_HEAD }, { g_rob: "Rob" })));

    const lines: string[] = [];

    await runPull(
      options(rootDir, createFakePortal({ g_rob: KIM_HEAD }, { g_rob: "Robert" }), {
        now: () => new Date("2026-10-08T00:00:00.000Z"),
        log: (line) => lines.push(line)
      })
    );

    assert.deepEqual((readJson(rootDir, "local/players.json") as { players: unknown[] }).players, [
      { name: "Rob", team: "Metal", avatarSrc: `avatars/rob-${sha256(KIM_HEAD).slice(0, 8)}.png` },
      { name: "Alex" }
    ]);
    assert.ok(lines.includes('Note: portal name is now "Robert"; player keeps "Rob".'));
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("does refuse to follow a redirect and name where it pointed when the portal sends one", async () => {
  const rootDir = createPack({});
  const portal = createFakePortal({}, {});

  portal.redirectTo = "https://elsewhere.example/steal";

  try {
    await assert.rejects(
      runPull(options(rootDir, portal)),
      /redirected \(302 to https:\/\/elsewhere\.example\/steal\); the pull refuses redirects/
    );
    assert.equal(portal.requests.length, 1);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});
