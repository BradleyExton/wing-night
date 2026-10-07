import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { PlayerJoinCodeRow } from "./index";

test("does offer the host a new join code and say phones already in keep their faces", () => {
  const html = renderToStaticMarkup(<PlayerJoinCodeRow disabled={false} onRotate={(): void => undefined} />);

  assert.match(html, /New join code/);
  assert.match(html, /keep their faces/);
  assert.doesNotMatch(html, /disabled=""/);
});

test("does disable the new join code when the tablet holds no host handler", () => {
  const html = renderToStaticMarkup(<PlayerJoinCodeRow disabled onRotate={(): void => undefined} />);

  assert.match(html, /disabled=""/);
});
