import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { JoustShooterView } from "@wingnight/shared";
import { JOUST_STANDARD_SHOOTER_PROFILE, resolveJoustShooterProfile } from "@wingnight/shared";

import { Loadout } from "./index.js";

const STANDARD: JoustShooterView = {
  id: "standard",
  name: "The Standard",
  blurb: "The house shot.",
  color: { fill: "#f97316", dark: "#b8410a", light: "#fdba74" },
  usesLeft: null,
  profile: JOUST_STANDARD_SHOOTER_PROFILE
};

const LOG: JoustShooterView = {
  id: "log",
  name: "The Log",
  blurb: "Big, slow, heavy.",
  color: { fill: "#8b5a2b", dark: "#4a2c12", light: "#c48b55" },
  usesLeft: 1,
  profile: resolveJoustShooterProfile({ shaftRadius: 3.4, headRadius: 4.8, linkSpacing: 3.8 })
};

const render = (
  shooters: JoustShooterView[],
  selectedShooterId = "standard",
  canPick = true,
  onPick: (shooterId: string) => void = (): void => {}
): string => {
  return renderToStaticMarkup(
    <Loadout
      shooters={shooters}
      selectedShooterId={selectedShooterId}
      canPick={canPick}
      onPick={onPick}
    />
  );
};

const buttonFor = (html: string, kindId: string): string => {
  const buttons = html.match(/<button[^>]*>[\s\S]*?<\/button>/g) ?? [];
  const button = buttons.find((entry) => entry.includes(`data-joust-loadout-kind="${kindId}"`));

  assert.ok(button !== undefined, `expected a button for ${kindId}`);
  return button;
};

const isDisabled = (button: string): boolean => /<button[^>]*\sdisabled=""/.test(button);

test("does render nothing when the loadout holds one kind", () => {
  assert.equal(render([STANDARD]), "");
  assert.equal(render([]), "");
});

test("does draw every kind as its own silhouette in its own inks", () => {
  const html = render([STANDARD, LOG]);

  assert.match(html, /data-joust-loadout/);
  assert.match(html, /data-joust-loadout-icon="standard"/);
  assert.match(html, /data-joust-loadout-icon="log"/);
  assert.match(html, /fill="#8b5a2b"/, "the Log wears the content's brown");
  assert.match(html, /The Log/);
});

test("does mark the loaded kind and leave the others unmarked", () => {
  const html = render([STANDARD, LOG], "log");

  assert.match(buttonFor(html, "log"), /aria-pressed="true"/);
  assert.match(buttonFor(html, "log"), /data-joust-loadout-selected="true"/);
  assert.match(buttonFor(html, "standard"), /aria-pressed="false"/);
});

test("does count a rationed kind's pulls and call an unlimited one unlimited", () => {
  const html = render([STANDARD, LOG]);

  assert.match(buttonFor(html, "log"), /1 left/);
  assert.match(buttonFor(html, "standard"), /any time/);
});

test("does disable a spent kind and say so", () => {
  const html = render([STANDARD, { ...LOG, usesLeft: 0 }]);
  const log = buttonFor(html, "log");

  assert.equal(isDisabled(log), true);
  assert.match(log, /data-joust-loadout-spent="true"/);
  assert.match(log, /spent/);
  assert.equal(isDisabled(buttonFor(html, "standard")), false);
});

test("does disable every kind when the tablet may not pick", () => {
  const html = render([STANDARD, LOG], "standard", false);

  assert.equal(isDisabled(buttonFor(html, "standard")), true);
  assert.equal(isDisabled(buttonFor(html, "log")), true);
});

test("does keep the row itself off the pointer and hand it to the buttons", () => {
  const html = render([STANDARD, LOG]);
  const row = html.match(/<div[^>]*data-joust-loadout[^>]*>/)?.[0] ?? "";

  assert.match(row, /pointer-events-none/);
  assert.match(buttonFor(html, "log"), /pointer-events-auto/);
});
