import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { QrCode } from "./index.js";

test("does draw a square symbol labelled with its URL when given a value", () => {
  const url = "http://192.168.1.23:5173/host?hostToken=abc";
  const html = renderToStaticMarkup(<QrCode value={url} />);
  const viewBox = /viewBox="0 0 (\d+) (\d+)"/.exec(html);

  assert.ok(viewBox, "expected a viewBox");
  assert.equal(viewBox[1], viewBox[2]);
  assert.ok(Number(viewBox[1]) >= 21, "a QR symbol is at least 21 modules wide");
  assert.ok(html.includes(`aria-label="${url.replace("&", "&amp;")}"`));
  assert.match(html, /fill="currentColor"/);
});

test("does draw different symbols when the values differ", () => {
  const first = renderToStaticMarkup(<QrCode value="http://10.0.0.1:5173/host?hostToken=a" />);
  const second = renderToStaticMarkup(<QrCode value="http://10.0.0.1:5173/host?hostToken=b" />);

  assert.notEqual(first, second);
});

test("does widen the symbol by the quiet zone on every side when one is asked for", () => {
  const url = "http://192.168.1.23:5173/play?t=abcdefghijklmnopqrstuv";
  const sizeOf = (html: string): number => Number(/viewBox="0 0 (\d+)/.exec(html)?.[1]);
  const bare = sizeOf(renderToStaticMarkup(<QrCode value={url} />));
  const zoned = sizeOf(renderToStaticMarkup(<QrCode value={url} quietZone={4} />));

  assert.equal(zoned, bare + 8);
});
