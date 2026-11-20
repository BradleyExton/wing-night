import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { BrawlPlayerFigure } from "@wingnight/shared";

import { CREW_SLOT_COLOURS } from "../../CrewScene/palette.js";
import { ReadyBeat } from "./index.js";

const figure = (playerId: string, name: string): BrawlPlayerFigure => ({ playerId, name, avatarSrc: null, teamId: "team-alpha", genre: null, outfit: null });
const roster = [figure("p1", "Alex"), figure("p2", "Caitlin"), figure("p3", "Dan")];

const render = (slotByPlayerId: Record<string, number>, isFirstBlock = true, onPhones = true): string =>
  renderToStaticMarkup(<ReadyBeat roster={roster} slotByPlayerId={slotByPlayerId} onPhones={onPhones} tabletPlayerName="Caitlin" isFirstBlock={isFirstBlock} />);

test("does ask the team to step out while nobody has", () => {
  const html = render({});

  assert.match(html, /data-brawl-ready="phones" data-brawl-ready-out="0"/);
  assert.match(html, /Step out on your phone/);
  assert.equal((html.match(/data-out="false"/g) ?? []).length, 3);
});

test("does mark who is out in her slot's colour and name who is not", () => {
  const html = render({ p2: 0, p1: 1 });

  assert.match(html, /2 of 3 on the street/);
  assert.match(html, new RegExp(`data-brawl-ready-player="p2" data-out="true".*?fill="${CREW_SLOT_COLOURS[0]}"`, "s"));
  assert.match(html, new RegExp(`data-brawl-ready-player="p1" data-out="true".*?fill="${CREW_SLOT_COLOURS[1]}"`, "s"));
  assert.match(html, /data-brawl-ready-player="p3" data-out="false"/);
  assert.match(html, /Host starts the fight/);
});

test("does hand the start to the host once everybody is out, and to the first thumb on a later block", () => {
  assert.match(render({ p1: 0, p2: 1, p3: 2 }), /over to the host/);
  assert.match(render({ p1: 0, p2: 1, p3: 2 }, false), /First thumb starts it/);
});

test("does name whose block it is on a turn with no phones", () => {
  const html = render({}, true, false);

  assert.match(html, /data-brawl-ready="tablet"/);
  assert.match(html, /Caitlin&#x27;s block/);
});
