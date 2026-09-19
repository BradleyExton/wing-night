import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { appErrorBoundaryCopy } from "../copy";
import { CrashNotice } from "./index";

const renderNotice = ({
  surface,
  isRecoveryReloadScheduled
}: {
  surface: "DISPLAY" | "CONTROL";
  isRecoveryReloadScheduled: boolean;
}): string => {
  return renderToStaticMarkup(
    <CrashNotice
      surface={surface}
      isRecoveryReloadScheduled={isRecoveryReloadScheduled}
      onReload={(): void => {}}
    />
  );
};

// The thing the room actually sees instead of a white screen.
test("does name the crash and promise the reload when one is coming", () => {
  const html = renderNotice({ surface: "DISPLAY", isRecoveryReloadScheduled: true });

  assert.ok(html.includes(appErrorBoundaryCopy.DISPLAY.title));
  assert.ok(html.includes(appErrorBoundaryCopy.DISPLAY.recoveringDescription));
  assert.ok(!html.includes(appErrorBoundaryCopy.DISPLAY.manualDescription));
});

// A notice that promises a reload and then does not is worse than one that asks
// for help, so the copy follows what was actually scheduled.
test("does ask for a manual refresh when no reload was scheduled", () => {
  const html = renderNotice({ surface: "DISPLAY", isRecoveryReloadScheduled: false });

  assert.ok(html.includes(appErrorBoundaryCopy.DISPLAY.manualDescription));
  assert.ok(!html.includes(appErrorBoundaryCopy.DISPLAY.recoveringDescription));
});

test("does speak to the host rather than the room when the tablet crashed", () => {
  const html = renderNotice({ surface: "CONTROL", isRecoveryReloadScheduled: true });

  assert.ok(html.includes(appErrorBoundaryCopy.CONTROL.title));
  assert.ok(html.includes(appErrorBoundaryCopy.CONTROL.reloadButtonLabel));
  assert.ok(!html.includes(appErrorBoundaryCopy.DISPLAY.title));
});

// Read from a sofa versus at arm's length: the TV's headline is set in a larger
// clamp than the tablet's, and both stay within the app's own sheet.
test("does set the display headline larger than the host tablet's", () => {
  const displayHtml = renderNotice({
    surface: "DISPLAY",
    isRecoveryReloadScheduled: true
  });
  const controlHtml = renderNotice({
    surface: "CONTROL",
    isRecoveryReloadScheduled: true
  });

  assert.match(displayHtml, /clamp\(3rem,6vw,5\.5rem\)/);
  assert.match(controlHtml, /clamp\(2\.1rem,4\.5vw,3\.6rem\)/);
});

// The one control on the screen has to be reachable by touch on the tablet.
test("does offer a tappable reload control", () => {
  const html = renderNotice({ surface: "CONTROL", isRecoveryReloadScheduled: false });

  assert.match(html, /<button[^>]*type="button"/);
  assert.match(html, /min-h-11/);
});
