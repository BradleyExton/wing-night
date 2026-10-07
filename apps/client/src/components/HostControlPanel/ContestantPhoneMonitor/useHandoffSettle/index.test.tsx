import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { useHandoffSettle } from "./index";

const Probe = ({ legIndex }: { legIndex: number | null }): JSX.Element => {
  return <span data-settling={useHandoffSettle(legIndex)} />;
};

test("does hold the leg-scoped hatches when the monitor opens on a leg a teammate just handed over", () => {
  assert.match(renderToStaticMarkup(<Probe legIndex={2} />), /data-settling="true"/);
});

test("does leave the hatches live when the monitor opens on the turn's first leg", () => {
  assert.match(renderToStaticMarkup(<Probe legIndex={0} />), /data-settling="false"/);
  assert.match(renderToStaticMarkup(<Probe legIndex={null} />), /data-settling="false"/);
});
