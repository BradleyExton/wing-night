import assert from "node:assert/strict";
import test from "node:test";

import {
  type BoardBucketKey,
  type BoardTicket,
  bucketBoardTickets
} from "./index";

// Pinned by hand from claude-dev-system `docs/SCHEMA.md` §2 — wing-night has no
// local copy of the status enum to import. Written out independently ON PURPOSE:
// deriving this list from the module's own map or bucket keys would make the
// totality assertion below tautological, and it could never fail.
const SCHEMA_STATUSES = [
  "idea",
  "needs-research",
  "needs-planning",
  "ready",
  "in-progress",
  "in-review",
  "blocked",
  "done",
  "superseded"
];

const ticket = (overrides: Partial<BoardTicket> & { status: string }): BoardTicket => {
  return {
    id: overrides.id ?? "WN-1",
    title: overrides.title ?? "A ticket",
    kind: overrides.kind ?? "feature",
    priority: overrides.priority ?? "medium",
    deps: overrides.deps ?? [],
    status: overrides.status
  };
};

const bucketsHolding = (id: string, buckets: ReturnType<typeof bucketBoardTickets>): string[] => {
  return (Object.keys(buckets) as BoardBucketKey[]).filter((key) =>
    buckets[key].some((card) => card.ticket.id === id)
  );
};

// The totality assertion AC#5 asks for: no schema status may fall through
// silently. Each status lands in exactly one bucket, or is excluded on purpose.
test("routes every schema status to exactly one bucket or the excluded set", () => {
  const excluded = ["done", "superseded"];

  for (const status of SCHEMA_STATUSES) {
    const buckets = bucketBoardTickets([ticket({ id: "WN-1", status })], null);
    const holders = bucketsHolding("WN-1", buckets);

    if (excluded.includes(status)) {
      assert.deepEqual(holders, [], `${status} should be excluded from the board`);
      continue;
    }

    assert.equal(holders.length, 1, `${status} should land in exactly one bucket`);
  }
});

// The mapping itself, status by status. This is what makes the totality test
// above non-tautological: a status silently re-routed to the wrong bucket still
// lands in "exactly one", but fails here.
test("maps each live status to its named bucket", () => {
  const expected: Record<string, BoardBucketKey> = {
    idea: "funnel",
    "needs-research": "funnel",
    "needs-planning": "funnel",
    ready: "readyPickable",
    "in-progress": "inProgress",
    "in-review": "inReview",
    blocked: "blocked"
  };

  for (const [status, bucket] of Object.entries(expected)) {
    const buckets = bucketBoardTickets([ticket({ id: "WN-1", status })], null);

    assert.deepEqual(bucketsHolding("WN-1", buckets), [bucket], `${status} → ${bucket}`);
  }
});

test("excludes done and superseded tickets from every bucket", () => {
  const buckets = bucketBoardTickets(
    [ticket({ id: "WN-1", status: "done" }), ticket({ id: "WN-2", status: "superseded" })],
    null
  );

  assert.deepEqual(bucketsHolding("WN-1", buckets), []);
  assert.deepEqual(bucketsHolding("WN-2", buckets), []);
});

test("sorts a ready ticket into waitingOnDeps when a dep is not done", () => {
  const buckets = bucketBoardTickets(
    [
      ticket({ id: "WN-1", status: "ready", deps: ["WN-9"] }),
      ticket({ id: "WN-9", status: "in-progress" })
    ],
    null
  );

  assert.deepEqual(bucketsHolding("WN-1", buckets), ["waitingOnDeps"]);
});

test("sorts a ready ticket into readyPickable when every dep is done", () => {
  const buckets = bucketBoardTickets(
    [
      ticket({ id: "WN-1", status: "ready", deps: ["WN-9"] }),
      ticket({ id: "WN-9", status: "done" })
    ],
    null
  );

  assert.deepEqual(bucketsHolding("WN-1", buckets), ["readyPickable"]);
});

// The blocker has to be nameable, not just countable — "waiting on WN-9" is the
// whole value of the bucket at a glance.
test("names the un-done deps holding a waiting ticket back", () => {
  const buckets = bucketBoardTickets(
    [
      ticket({ id: "WN-1", status: "ready", deps: ["WN-8", "WN-9"] }),
      ticket({ id: "WN-8", status: "done" }),
      ticket({ id: "WN-9", status: "ready" })
    ],
    null
  );

  assert.deepEqual(buckets.waitingOnDeps[0]?.blockingDeps, ["WN-9"]);
});

// A dep on a ticket the payload never mentions cannot be assumed satisfied.
test("treats a dep missing from the payload as still blocking", () => {
  const buckets = bucketBoardTickets(
    [ticket({ id: "WN-1", status: "ready", deps: ["WN-404"] })],
    null
  );

  assert.deepEqual(bucketsHolding("WN-1", buckets), ["waitingOnDeps"]);
});

test("stars the ticket the selector picked", () => {
  const buckets = bucketBoardTickets(
    [ticket({ id: "WN-1", status: "ready" }), ticket({ id: "WN-2", status: "ready" })],
    "WN-2"
  );

  const starred = buckets.readyPickable.filter((card) => card.isNext).map((card) => card.ticket.id);

  assert.deepEqual(starred, ["WN-2"]);
});

test("stars nothing when the selector picked nothing", () => {
  const buckets = bucketBoardTickets([ticket({ id: "WN-1", status: "ready" })], null);

  assert.equal(buckets.readyPickable[0]?.isNext, false);
});

// An unknown status must stay visible rather than disappear — the board's job is
// to show live work, and a silently dropped ticket is worse than a misfiled one.
test("keeps a status it does not recognise visible in the funnel", () => {
  const buckets = bucketBoardTickets([ticket({ id: "WN-1", status: "parked" })], null);

  assert.deepEqual(bucketsHolding("WN-1", buckets), ["funnel"]);
});

test("returns every bucket even when there are no tickets", () => {
  const buckets = bucketBoardTickets([], null);

  assert.deepEqual(Object.values(buckets), [[], [], [], [], [], []]);
});
