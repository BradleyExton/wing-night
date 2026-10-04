import assert from "node:assert/strict";
import test from "node:test";

import { createTestPortal } from "../testing/harness/index.ts";
import { hashToken, mintToken } from "../tokens/index.ts";
import { buildSeedAdminSql, parseSeedAdminArgs } from "./index.ts";

test("does read the name, address and target when the flags are complete", () => {
  assert.deepEqual(parseSeedAdminArgs(["--name", " Brad ", "--email", "Brad@Example.com", "--local"]), {
    displayName: "Brad",
    email: "brad@example.com",
    target: "local",
    origin: "http://localhost:5173"
  });
  assert.equal(
    (parseSeedAdminArgs(["--name", "Brad", "--email", "b@x.co", "--remote"]) as { origin: string }).origin,
    "https://wingnight.tv"
  );
});

test("does refuse the flags when the target is missing, doubled, or the address is not one", () => {
  assert.ok("error" in parseSeedAdminArgs(["--name", "Brad", "--email", "b@x.co"]));
  assert.ok("error" in parseSeedAdminArgs(["--name", "Brad", "--email", "b@x.co", "--local", "--remote"]));
  assert.ok("error" in parseSeedAdminArgs(["--name", "Brad", "--email", "nope", "--local"]));
});

test("does keep the same admin and mint a fresh link when the same address is seeded twice", async () => {
  const portal = createTestPortal();
  const seed = async (displayName: string, guestId: string) => {
    const token = mintToken(portal.deps.random);

    portal.db.raw.exec(
      buildSeedAdminSql({ guestId, displayName, email: "brad@example.com", tokenHash: await hashToken(token), now: 1 })
    );

    return token;
  };
  const firstToken = await seed("O'Brad", "g_first");
  const secondToken = await seed("Brad", "g_second");
  const guests = portal.db.raw.prepare("SELECT guest_id, display_name, is_admin, invited_at FROM guests").all();

  assert.deepEqual(guests.map((row) => ({ ...row })), [
    { guest_id: "g_first", display_name: "Brad", is_admin: 1, invited_at: 1 }
  ]);
  assert.equal((await portal.request("POST", `/s/${firstToken}`)).status, 400);
  assert.equal((await portal.request("POST", `/s/${secondToken}`)).status, 303);
});
