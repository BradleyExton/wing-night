import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { BoardCard } from "../../utils/bucketBoardTickets";
import { devBoardCopy } from "./copy";
import { BucketColumn, DevBoard } from "./index";

// AC#6's actual proof, and the reason the URL resolution and the fetch both sit
// inside an effect. Reaching this file at all means importing the board under
// `tsx --test` — no DOM, no Vite — so a bare `window` or `import.meta.env` read
// at module OR render scope throws right here. Imported DIRECTLY rather than
// through App: `renderToStaticMarkup` cannot resolve `React.lazy`, and the lazy
// boundary lives only in App.tsx.
test("imports the board module without a DOM present", () => {
  assert.equal(typeof DevBoard, "function");
  assert.equal(typeof globalThis.window, "undefined");
});

test("renders at render scope without touching window", () => {
  const html = renderToStaticMarkup(<DevBoard />);

  assert.match(html, new RegExp(devBoardCopy.heading));
});

// The effect has not run in a server render, so the first frame must be the
// loading state rather than a blank page or a crash.
test("renders the loading state when no effect has run", () => {
  const html = renderToStaticMarkup(<DevBoard />);

  assert.match(html, new RegExp(devBoardCopy.loading));
  assert.doesNotMatch(html, new RegExp(devBoardCopy.errorHeading));
});

test("renders no buckets before the payload arrives", () => {
  const html = renderToStaticMarkup(<DevBoard />);

  assert.doesNotMatch(html, new RegExp(devBoardCopy.bucketTitle.readyPickable));
});

const card = (id: string, overrides: Partial<BoardCard> = {}): BoardCard => {
  return {
    ticket: {
      id,
      title: `${id} title`,
      status: "ready",
      kind: "feature",
      priority: "high",
      deps: []
    },
    isNext: false,
    blockingDeps: [],
    ...overrides
  };
};

test("renders a card's id and title in its bucket", () => {
  const html = renderToStaticMarkup(
    <BucketColumn title={devBoardCopy.bucketTitle.readyPickable} cards={[card("WN-42")]} />
  );

  assert.match(html, /WN-42/);
  assert.match(html, /WN-42 title/);
});

test("marks the starred ticket with the next badge", () => {
  const html = renderToStaticMarkup(
    <BucketColumn
      title={devBoardCopy.bucketTitle.readyPickable}
      cards={[card("WN-42", { isNext: true })]}
    />
  );

  assert.match(html, new RegExp(devBoardCopy.nextBadge));
});

test("does not badge a ticket the selector did not pick", () => {
  const html = renderToStaticMarkup(
    <BucketColumn title={devBoardCopy.bucketTitle.readyPickable} cards={[card("WN-42")]} />
  );

  assert.doesNotMatch(html, new RegExp(devBoardCopy.nextBadge));
});

// "Waiting on deps" is only useful if it names what it is waiting on.
test("names the blocking deps on a waiting card", () => {
  const html = renderToStaticMarkup(
    <BucketColumn
      title={devBoardCopy.bucketTitle.waitingOnDeps}
      cards={[card("WN-42", { blockingDeps: ["WN-9"] })]}
    />
  );

  assert.match(html, new RegExp(`${devBoardCopy.waitingOnPrefix} WN-9`));
});

test("renders the empty state for a bucket with no cards", () => {
  const html = renderToStaticMarkup(
    <BucketColumn title={devBoardCopy.bucketTitle.blocked} cards={[]} />
  );

  assert.match(html, new RegExp(devBoardCopy.emptyBucket));
});
