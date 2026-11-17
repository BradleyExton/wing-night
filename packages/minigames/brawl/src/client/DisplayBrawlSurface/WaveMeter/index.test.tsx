import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { BrawlWaveMeter, BrawlWavePip } from "../../waveMeter/index.js";
import { WaveMeter } from "./index.js";

const pip = (spawnIndex: number, overrides: Partial<BrawlWavePip> = {}): BrawlWavePip => ({ spawnIndex, kind: "goose", side: 1, state: "waiting", ...overrides });
const meter = (overrides: Partial<BrawlWaveMeter> = {}): BrawlWaveMeter => ({
  waveIndex: 0,
  waveCount: 2,
  pips: [pip(0, { side: -1, state: "down" }), pip(1, { state: "in" }), pip(2, { kind: "raccoon" })],
  clear: false,
  ...overrides
});

test("does count the wave in hand: its number, a pip a goon in its state, and how many are down", () => {
  const html = renderToStaticMarkup(<WaveMeter meter={meter()} hidden={false} />);

  assert.match(html, /data-brawl-wave="0"/);
  assert.match(html, /Wave 1 of 2/);
  assert.match(html, /data-brawl-wave-size="3"/);
  assert.match(html, /data-brawl-wave-down="1"/);
  assert.match(html, /data-brawl-wave-pip="0"[^>]*data-state="down"/);
  assert.match(html, /data-brawl-wave-pip="1"[^>]*data-state="in"/);
  assert.match(html, /data-brawl-wave-pip="2"[^>]*data-brawl-goon-kind="raccoon"[^>]*data-state="waiting"/);
});

test("does group the pips by the edge each goon steps in from, with a marker at that end", () => {
  const html = renderToStaticMarkup(<WaveMeter meter={meter()} hidden={false} />);
  const left = html.indexOf('data-brawl-wave-side-group="left"');
  const label = html.indexOf("Wave 1 of 2");
  const right = html.indexOf('data-brawl-wave-side-group="right"');

  assert.ok(left >= 0 && left < label && label < right, "left pips, the label, right pips");
  assert.match(html, /data-brawl-wave-side-marker="left"[^>]*>◀/);
  assert.match(html, /data-brawl-wave-side-marker="right"[^>]*>▶/);
  assert.match(html, /data-brawl-wave-pip="0"[^>]*data-brawl-wave-side="left"/);
});

test("does leave out a side nobody steps in from", () => {
  const html = renderToStaticMarkup(<WaveMeter meter={meter({ pips: [pip(0), pip(1)] })} hidden={false} />);

  assert.doesNotMatch(html, /data-brawl-wave-side-group="left"/);
});

test("does say GO once the wave is clear, fold away for a beat, and draw a big wave small", () => {
  assert.match(renderToStaticMarkup(<WaveMeter meter={meter({ clear: true })} hidden={false} />), /data-brawl-wave-clear="true"/);
  assert.match(renderToStaticMarkup(<WaveMeter meter={meter()} hidden />), /data-hidden="true"/);
  assert.match(renderToStaticMarkup(<WaveMeter meter={meter()} hidden={false} />), /data-dense="false"/);
  assert.match(
    renderToStaticMarkup(<WaveMeter meter={meter({ pips: Array.from({ length: 17 }, (_unused, index) => pip(index)) })} hidden={false} />),
    /data-dense="true"/
  );
});
