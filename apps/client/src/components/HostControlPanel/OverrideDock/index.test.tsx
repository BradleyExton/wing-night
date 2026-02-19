import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { OverrideDock } from "./index";

test("renders closed trigger state", () => {
  const html = renderToStaticMarkup(
    <OverrideDock
      isOpen={false}
      showBadge={false}
      onOpen={() => undefined}
      onClose={() => undefined}
      panelId="host-overrides-panel"
    >
      <section />
    </OverrideDock>
  );

  assert.match(html, /Overrides/);
  assert.match(html, /aria-expanded="false"/);
  assert.doesNotMatch(html, /id="host-overrides-panel"/);
  assert.doesNotMatch(html, /Needs Review/);
});

test("renders open panel state with badge text", () => {
  const html = renderToStaticMarkup(
    <OverrideDock
      isOpen={true}
      showBadge={true}
      onOpen={() => undefined}
      onClose={() => undefined}
      panelId="host-overrides-panel"
    >
      <section />
    </OverrideDock>
  );

  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /Overrides/);
  assert.match(html, /Needs Review/);
  assert.match(html, /manual controls for turn order, scoring, and escape-hatch actions/i);
  assert.match(html, /Close/);
});
