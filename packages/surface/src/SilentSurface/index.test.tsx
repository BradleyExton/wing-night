import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SilentSurface, useIsSilentSurface } from "./index.js";

const Probe = (): JSX.Element => <span data-silent={useIsSilentSurface()} />;

test("does mark every surface under it silent when it wraps a mirror of the TV", () => {
  assert.match(
    renderToStaticMarkup(
      <SilentSurface>
        <div>
          <Probe />
        </div>
      </SilentSurface>
    ),
    /data-silent="true"/
  );
});

test("does leave a surface a speaker when nothing wraps it", () => {
  assert.match(renderToStaticMarkup(<Probe />), /data-silent="false"/);
});
