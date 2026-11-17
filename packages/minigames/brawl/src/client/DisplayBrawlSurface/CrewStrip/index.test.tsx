import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { CREW_SLOT_COLOURS } from "../../CrewScene/palette.js";
import { resolveHenFigure } from "../../resolveHenFigure/index.js";
import { CrewStrip, type CrewStripHen } from "./index.js";

const hen = (slot: number, name: string, overrides: Partial<CrewStripHen> = {}): CrewStripHen => ({
  slot,
  figure: resolveHenFigure({
    figure: { playerId: `p${slot}`, name, avatarSrc: null, teamId: "team-alpha", genre: null, outfit: null },
    activeTurnTeamId: "team-alpha",
    serverOrigin: null
  }),
  hearts: 3,
  state: "up",
  clean: true,
  ...overrides
});

const render = (hens: CrewStripHen[]): string => renderToStaticMarkup(<CrewStrip hens={hens} heartsMax={3} />);

test("does draw a chip for each hen on the street, ringed in her slot's colour, and none for a player who sat out", () => {
  const html = render([hen(0, "Alex"), hen(1, "Caitlin")]);

  assert.match(html, /data-brawl-crew-strip="2"/);
  assert.equal((html.match(/data-brawl-crew-chip=/g) ?? []).length, 2);
  assert.match(html, new RegExp(`data-brawl-crew-chip="0".*stroke="${CREW_SLOT_COLOURS[0]}"`, "s"));
  assert.match(html, new RegExp(`data-brawl-crew-chip="1".*stroke="${CREW_SLOT_COLOURS[1]}"`, "s"));
  assert.match(html, />Alex<.*>Caitlin</s);
});

test("does light as many hearts as she has left and dim the rest", () => {
  const html = render([hen(0, "Alex", { hearts: 1 })]);

  assert.match(html, /data-hearts="1"/);
  assert.equal((html.match(/data-lit="true"/g) ?? []).length, 1);
  assert.equal((html.match(/data-lit="false"/g) ?? []).length, 2);
  assert.match(html, /aria-label="1 heart"/);
});

test("does say a downed hen is down and a sat-out hen is asleep, in place of her name", () => {
  const html = render([hen(0, "Alex", { state: "down", hearts: 0 }), hen(1, "Caitlin", { state: "away" })]);

  assert.match(html, /data-brawl-crew-chip="0" data-state="down"/);
  assert.match(html, />Down!</);
  assert.match(html, /data-brawl-crew-chip="1" data-state="away"/);
  assert.match(html, />zzz</);
  assert.doesNotMatch(html, />Alex</);
});

test("does keep her star only while the wave has not touched her and she is up", () => {
  assert.match(render([hen(0, "Alex")]), /data-clean="true"/);
  assert.match(render([hen(0, "Alex", { clean: false })]), /data-clean="false"/);
  assert.match(render([hen(0, "Alex", { state: "down" })]), /data-clean="false"/);
});
