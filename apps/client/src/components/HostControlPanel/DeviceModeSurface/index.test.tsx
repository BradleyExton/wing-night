import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { DeviceModeSurface } from "./index";

test("does light each round's choice when it offers tablet or phones per arcade round", () => {
  const html = renderToStaticMarkup(
    <DeviceModeSurface
      rounds={[
        { round: 1, minigame: "SCHLONIC", deviceMode: "tablet" },
        { round: 3, minigame: "FAPPY", deviceMode: "phones" }
      ]}
      lockedDeviceMode={null}
      onSetRoundDeviceMode={() => undefined}
    />
  );

  assert.match(html, /data-device-mode-round="1" data-device-mode="tablet"/);
  assert.match(html, /data-device-mode-round="3" data-device-mode="phones"/);
  assert.match(html, /aria-pressed="true" aria-label="Round 3 on phones"/);
  assert.match(html, /R3 · Fappy Bird/);
});

test("does say a change lands from the next team when the briefing already locked the turn", () => {
  const html = renderToStaticMarkup(
    <DeviceModeSurface
      rounds={[{ round: 2, minigame: "FAPPY", deviceMode: "phones" }]}
      lockedDeviceMode="tablet"
      onSetRoundDeviceMode={() => undefined}
    />
  );

  assert.match(html, /This team&#x27;s turn: on the tablet\. Phones from the next team\./);
});

test("does render nothing when no arcade round can be set from here", () => {
  assert.equal(
    renderToStaticMarkup(<DeviceModeSurface rounds={[]} lockedDeviceMode={null} />),
    ""
  );
});
