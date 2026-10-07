import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { PlayerJoinCard } from "./index";

const JOIN_URL = "http://192.168.1.23:5173/play?t=tok-1";

test("does draw the join QR for the phones with the URL it encodes", () => {
  const html = renderToStaticMarkup(
    <PlayerJoinCard joinUrl={JOIN_URL} claimedCount={3} playerCount={12} />
  );

  assert.match(html, /data-player-join-url="http:\/\/192\.168\.1\.23:5173\/play\?t=tok-1"/);
  assert.match(html, /<svg[^>]*role="img"/);
  assert.match(html, /Scan, then tap your face/);
  assert.match(html, /3 of 12 in/);
});

test("does leave the count off when the roster is empty", () => {
  const html = renderToStaticMarkup(<PlayerJoinCard joinUrl={JOIN_URL} claimedCount={0} playerCount={0} />);

  assert.doesNotMatch(html, /data-player-join-count/);
});
