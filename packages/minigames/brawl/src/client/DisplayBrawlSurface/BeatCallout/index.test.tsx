import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { BeatCallout } from "./index.js";

test("does call a cleared block by its street and say where the next one is and who starts it", () => {
  const html = renderToStaticMarkup(<BeatCallout outcome="cleared" setting="dunlop" next="waterfront" nextOnTablet={false} />);

  assert.match(html, /data-brawl-beat-callout="cleared"/);
  assert.match(html, /Dunlop Street/);
  assert.match(html, /Block clear!/);
  assert.match(html, /Next: the waterfront — first thumb starts it/);
});

test("does send the crew to the bay when every hen went down, and ring time at the bell", () => {
  const bay = renderToStaticMarkup(<BeatCallout outcome="wipe" setting="waterfront" next="beach" nextOnTablet={false} />);

  assert.match(bay, /data-brawl-beat-line="wipe"[^>]*>Into the bay!/);
  assert.match(bay, /Everybody down/);
  assert.match(renderToStaticMarkup(<BeatCallout outcome="timeout" setting="beach" next={null} nextOnTablet={false} />), /Time!/);
});

test("does close the street on the last block and name no next one", () => {
  const html = renderToStaticMarkup(<BeatCallout outcome="cleared" setting="beach" next={null} nextOnTablet={false} />);

  assert.match(html, /Last block/);
  assert.match(html, /Street clear!/);
  assert.doesNotMatch(html, /data-brawl-beat-next/);
});

test("does send a tablet's next block to the tablet", () => {
  assert.match(
    renderToStaticMarkup(<BeatCallout outcome="wipe" setting="dunlop" next="waterfront" nextOnTablet />),
    /Next: the waterfront — start it on the tablet/
  );
});
