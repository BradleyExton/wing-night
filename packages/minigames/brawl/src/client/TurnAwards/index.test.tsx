import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { BrawlPlayerFigure } from "@wingnight/shared";

import { TurnAwards } from "./index.js";

const figure = (playerId: string, name: string): BrawlPlayerFigure => ({ playerId, name, avatarSrc: null, teamId: "team-alpha", genre: null, outfit: null });

test("does name each award's holder with her head and the number it was won on", () => {
  const html = renderToStaticMarkup(
    <TurnAwards
      awards={[
        { kind: "geese", winners: [figure("p2", "Caitlin")], value: 14 },
        { kind: "revives", winners: [figure("p3", "Dan"), figure("p1", "Alex")], value: 1 },
        { kind: "carried", winners: [figure("p3", "Dan")], value: 3 }
      ]}
      activeTurnTeamId="team-alpha"
      serverOrigin={null}
      tone="wall"
    />
  );

  assert.match(html, /data-brawl-awards="3"/);
  assert.match(html, /data-brawl-award="geese".*Most geese.*Caitlin.*14 down/s);
  assert.match(html, /data-brawl-award="revives".*Dan.*Alex.*1 friend up/s);
  assert.match(html, /data-brawl-award="carried".*Most often carried.*Dan.*3 times/s);
  assert.equal((html.match(/data-brawl-head=/g) ?? []).length, 4);
});

test("does draw nothing for a turn with nobody to name", () => {
  assert.equal(renderToStaticMarkup(<TurnAwards awards={[]} activeTurnTeamId={null} serverOrigin={null} tone="tablet" />), "");
});
