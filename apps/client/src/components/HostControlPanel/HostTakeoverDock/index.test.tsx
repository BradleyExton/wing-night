import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { HostTakeoverDock } from "./index";

const noop = (): void => undefined;

// The tablet is in the players' hands during MINIGAME_PLAY, so the dock opens
// collapsed: one unlabelled circle, and nothing a stray thumb can advance.
test("does show only the collapsed toggle when the dock has not been opened", () => {
  const html = renderToStaticMarkup(
    <HostTakeoverDock
      primaryActionLabel="End Team Turn"
      primaryActionDisabled={false}
      onPrimaryAction={noop}
      showOverridesAction
      overridesNeedAttention={false}
      onOpenOverrides={noop}
    />
  );

  assert.match(html, /aria-label="Open host controls"/);
  assert.match(html, /aria-expanded="false"/);
  assert.doesNotMatch(html, /End Team Turn/);
  assert.doesNotMatch(html, /Overrides/);
});

// A turn that needs review has to reach the host without the dock being open,
// or the escape hatch is invisible until someone goes looking for it.
test("does mark the collapsed toggle when overrides need attention", () => {
  const html = renderToStaticMarkup(
    <HostTakeoverDock
      primaryActionLabel="End Team Turn"
      primaryActionDisabled={false}
      onPrimaryAction={noop}
      showOverridesAction
      overridesNeedAttention
      onOpenOverrides={noop}
    />
  );

  assert.match(html, /bg-heat/);
});

test("does leave the collapsed toggle unmarked when nothing needs review", () => {
  const html = renderToStaticMarkup(
    <HostTakeoverDock
      primaryActionLabel="End Team Turn"
      primaryActionDisabled={false}
      onPrimaryAction={noop}
      showOverridesAction={false}
      overridesNeedAttention={false}
      onOpenOverrides={noop}
    />
  );

  assert.doesNotMatch(html, /bg-heat/);
});
