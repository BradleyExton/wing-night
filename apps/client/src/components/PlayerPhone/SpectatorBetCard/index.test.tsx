import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { PhoneBet } from "../resolvePhoneBet";
import { SpectatorBetCard } from "./index";

const render = (bet: PhoneBet): string =>
  renderToStaticMarkup(<SpectatorBetCard bet={bet} teamName="Spice Girls" onPick={() => undefined} />);

test("does offer exactly two choices on the line when the window is open", () => {
  const html = render({ stage: "open", teamId: "team-1", line: 7.5, pick: null });

  assert.match(html, /data-spectator-bet="open"/);
  assert.match(html, />7\.5</);
  assert.equal(html.match(/data-spectator-bet-choice=/g)?.length, 2);
  assert.match(html, /Side bet · Spice Girls/);
  assert.doesNotMatch(html, /aria-pressed="true"/);
});

test("does light the phone's own pick when it has placed one", () => {
  const html = render({ stage: "open", teamId: "team-1", line: 7.5, pick: "under" });

  assert.match(html, /aria-pressed="true"[^>]*data-spectator-bet-choice="under"/);
  assert.match(html, /You&#x27;ve got them under/);
});

test("does lock the bet and point at the TV when play has started", () => {
  const html = render({ stage: "locked", teamId: "team-1", line: 7.5, pick: "over" });

  assert.match(html, /Bet locked/);
  assert.match(html, /Over 7\.5\./);
  assert.match(html, /Watch the TV/);
  assert.doesNotMatch(html, /data-spectator-bet-choice/);
});

test("does say bets are closed when the watcher never placed one", () => {
  assert.match(render({ stage: "locked", teamId: "team-1", line: 7.5, pick: null }), /Bets closed/);
});

test("does tell a watcher they called it when the turn settled their way", () => {
  const html = render({ stage: "settled", teamId: "team-1", line: 7.5, pick: "under", turnPoints: 5, outcome: "under" });

  assert.match(html, /data-spectator-bet-result="won"/);
  assert.match(html, /Called it/);
  assert.match(html, /They scored 5 on a 7\.5 line/);
});

test("does tell a watcher it was not their night when the turn went the other way", () => {
  const html = render({ stage: "settled", teamId: "team-1", line: 7.5, pick: "over", turnPoints: 5, outcome: "under" });

  assert.match(html, /data-spectator-bet-result="lost"/);
  assert.match(html, /Not this time/);
});
