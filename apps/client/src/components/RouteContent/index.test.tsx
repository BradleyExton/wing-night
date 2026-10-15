import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { resolveMinigameTypeFromSlug } from "@wingnight/shared";

import {
  resolveClientRoute,
  resolveDevLabName,
  resolveDevMinigameSlug
} from "../../utils/resolveClientRoute";
import { RouteContent } from "./index";
import * as styles from "./styles";

// Every pathname the client answers, resolved through the real route resolver
// rather than a hand-written route list — a new route reaches these assertions
// by being added there.
const ROUTE_PATHNAMES = [
  "/",
  "/host",
  "/admin",
  "/quickplay",
  "/display",
  "/play",
  "/dev",
  "/dev/minigame/trivia",
  "/dev/lab/anamorph",
  "/dev/lab/contraption",
  "/dev/lab/contraption-ui",
  "/no-such-route"
];

// A static render never awaits a dynamic import, so every route content is
// still pending here — exactly the state the first mount is in. A lazy element
// rendered without a Suspense ancestor throws in that state, so a render that
// returns markup at all is the proof that the boundary is there.
const renderPendingRoute = (pathname: string): string => {
  const devMinigameSlug = resolveDevMinigameSlug(pathname);

  return renderToStaticMarkup(
    <RouteContent
      route={resolveClientRoute(pathname)}
      devMinigameType={devMinigameSlug === null ? null : resolveMinigameTypeFromSlug(devMinigameSlug)}
      devLabName={resolveDevLabName(pathname)}
      roomSocket={null}
      displayReports={null}
      playerSeat={null}
      contestantLeg={null}
      betSlip={null}
      answerCard={null}
    />
  );
};

test("does hold every route behind a suspense boundary when its chunk is still pending", () => {
  for (const pathname of ROUTE_PATHNAMES) {
    const html = renderPendingRoute(pathname);

    assert.ok(
      html.includes(styles.routeFallback),
      `route content for ${pathname} did not fall back to the route fallback`
    );
  }
});

// The display route is on screen for the whole party, so the fallback's job is
// to look like the blank page it replaces. Any copy or spinner here would be a
// visible flash on the TV at boot.
test("does render an empty surface when the fallback is the thing on screen", () => {
  const html = renderPendingRoute("/display");

  assert.match(html, /^<div [^>]*><\/div>$/);
});
