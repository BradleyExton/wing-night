import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { resolveBrawlBlock } from "@wingnight/shared";

import { WaveMeter } from "./index.js";

const pipClassOf = (html: string, kind: string): string => {
  return html.match(new RegExp(`<span class="([^"]*)" data-brawl-wave-pip="\\d+" data-brawl-goon-kind="${kind}"`))?.[1] ?? "";
};

test("does draw a swan's and a helmet goose's pip as heavy as a raccoon's, because each is worth two", () => {
  const html = renderToStaticMarkup(<WaveMeter block={resolveBrawlBlock({ seed: 20261001, blocks: 3, block: 2 })} hidden={false} />);
  const raccoon = pipClassOf(html, "raccoon");

  assert.notEqual(raccoon, "");
  assert.equal(pipClassOf(html, "swan"), raccoon);
  assert.equal(pipClassOf(html, "helmet"), raccoon);
  assert.notEqual(pipClassOf(html, "goose"), raccoon);
  assert.notEqual(pipClassOf(html, "boss"), raccoon);
});
