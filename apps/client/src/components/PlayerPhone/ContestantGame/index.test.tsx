import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ContestantGame } from "./index";

const render = (previousPlayerName: string | null, legIndex: number): string =>
  renderToStaticMarkup(
    <ContestantGame
      hostView={null}
      playerName="Caitlin"
      legIndex={legIndex}
      previousPlayerName={previousPlayerName}
      activeTeamName="Spice Girls"
      teamNameByTeamId={new Map()}
      serverOrigin={null}
      onDispatchAction={() => undefined}
    />
  );

test("does open on the handoff hold naming who is through when a teammate hands the leg over", () => {
  const html = render("Alex", 1);

  assert.match(html, /data-contestant-game="waiting"/);
  assert.match(html, /data-contestant-leg="1"/);
  assert.match(html, /data-contestant-handoff/);
  assert.match(html, /Alex is through/);
  assert.match(html, /Your leg/);
  // The hold never takes a tap from the game under it.
  assert.match(html, /pointer-events-none/);
});

test("does open on the hold saying the player is first when the leg is the turn's first", () => {
  assert.match(render(null, 0), /You&#x27;re first/);
});

test("does keep the rotate card over the game when the phone is held upright", () => {
  assert.match(render(null, 0), /data-phone-rotate/);
});
