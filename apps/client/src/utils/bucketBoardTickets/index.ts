export type BoardTicket = {
  id: string;
  title: string;
  status: string;
  kind?: string;
  priority?: string;
  deps?: string[];
};

export type BoardBucketKey =
  | "inProgress"
  | "readyPickable"
  | "waitingOnDeps"
  | "inReview"
  | "blocked"
  | "funnel";

export type BoardCard = {
  ticket: BoardTicket;
  // Set on the one ticket the CLI's own selector picked, so the board stars the
  // same ticket `work next` would hand you rather than re-ranking client-side.
  isNext: boolean;
  // Populated for waitingOnDeps only: the un-done deps holding the ticket back.
  blockingDeps: string[];
};

export type BoardBuckets = Record<BoardBucketKey, BoardCard[]>;

// `done` and `superseded` are the NAMED excluded set — the board is a glance at
// live work, and finished tickets would swamp it.
const EXCLUDED_STATUSES = ["done", "superseded"];

// Every remaining schema status, mapped to exactly one bucket. `ready` is absent
// on purpose: it is the one status that splits two ways, on whether its deps are
// satisfied, so it cannot be a static entry here.
const BUCKET_BY_STATUS: Record<string, BoardBucketKey> = {
  "in-progress": "inProgress",
  "in-review": "inReview",
  blocked: "blocked",
  idea: "funnel",
  "needs-research": "funnel",
  "needs-planning": "funnel"
};

const emptyBuckets = (): BoardBuckets => {
  return {
    inProgress: [],
    readyPickable: [],
    waitingOnDeps: [],
    inReview: [],
    blocked: [],
    funnel: []
  };
};

// NOTE: `work index --json` does not emit `blocked_by`, only `deps`. So a ticket
// that is `ready` with a non-empty `blocked_by` renders here as pickable even
// though the selector skips it. Accepted: the richer seam isn't worth chasing,
// and dep-satisfaction — the common case — is re-derived correctly below.
const resolveBlockingDeps = (ticket: BoardTicket, doneIds: Set<string>): string[] => {
  return (ticket.deps ?? []).filter((dep) => !doneIds.has(dep));
};

const resolveBucketKey = (ticket: BoardTicket, blockingDeps: string[]): BoardBucketKey => {
  if (ticket.status === "ready") {
    return blockingDeps.length > 0 ? "waitingOnDeps" : "readyPickable";
  }

  // An unrecognised status lands in the funnel rather than vanishing: a status
  // the schema grew and this module has not learned yet should still be VISIBLE
  // on the board. The colocated test pins the schema enum independently, so a
  // status quietly arriving here fails that test rather than passing unnoticed.
  return BUCKET_BY_STATUS[ticket.status] ?? "funnel";
};

export const bucketBoardTickets = (
  tickets: BoardTicket[],
  nextTicketId: string | null
): BoardBuckets => {
  const buckets = emptyBuckets();
  const doneIds = new Set(
    tickets.filter((ticket) => ticket.status === "done").map((ticket) => ticket.id)
  );

  for (const ticket of tickets) {
    if (EXCLUDED_STATUSES.includes(ticket.status)) {
      continue;
    }

    const blockingDeps = resolveBlockingDeps(ticket, doneIds);

    buckets[resolveBucketKey(ticket, blockingDeps)].push({
      ticket,
      isNext: ticket.id === nextTicketId,
      blockingDeps
    });
  }

  return buckets;
};
