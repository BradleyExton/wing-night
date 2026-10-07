import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { PhoneTurn } from "../resolvePhoneTurn";
import { ContestantTurnCard } from "./index";

const render = (turn: Exclude<PhoneTurn, { role: "play" }>, contestantName: string | null = "Alex"): string =>
  renderToStaticMarkup(
    <ContestantTurnCard
      turn={turn}
      player={{ id: "player-2", name: "Caitlin" }}
      teamTheme={null}
      contestantName={contestantName}
      serverOrigin={null}
    />
  );

test("does tell the next teammate they are next and who is on when the next leg is theirs", () => {
  const html = render({ role: "next", deviceMode: "phones", contestantPlayerId: "player-1" });

  assert.match(html, /data-contestant-phone="next"/);
  assert.match(html, /You&#x27;re next/);
  assert.match(html, /After Alex/);
  assert.match(html, /Watch Alex on the TV/);
});

test("does say the tablet comes to them when the turn is on the tablet", () => {
  assert.match(
    render({ role: "next", deviceMode: "tablet", contestantPlayerId: "player-1" }),
    /The tablet comes to you after Alex/
  );
});

test("does send a teammate to the TV when they are neither on nor next", () => {
  const html = render({ role: "watch", contestantPlayerId: "player-1" });

  assert.match(html, /data-contestant-phone="watch"/);
  assert.match(html, /Watch the TV/);
});

test("does tell the contestant to grab the tablet when the tablet holds their leg", () => {
  const html = render({ role: "tablet" });

  assert.match(html, /data-contestant-phone="tablet"/);
  assert.match(html, /Grab the tablet/);
});

test("does tell the team what to pick up when the briefing is up", () => {
  assert.match(render({ role: "briefing", deviceMode: "phones" }), /Grab your phone/);
  assert.match(render({ role: "briefing", deviceMode: "tablet" }), /Grab the tablet/);
});

test("does never draw the game when the card is up", () => {
  assert.doesNotMatch(render({ role: "watch", contestantPlayerId: null }), /data-contestant-game|data-phone-rotate/);
});
