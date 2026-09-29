#!/usr/bin/env node
// Captures the teaser's link-preview picture (og:image) into the night pack:
//   pnpm teaser:dev            (in another terminal)
//   pnpm teaser:card [url]     (defaults to the dev server's /card)
//
// The picture is the lobby with the cast dancing, so it is the pack's — the friends' faces — and
// never the repo's. It lands at <pack>/local/assets/teaser/share-card.png, where
// tools/build-teaser picks it up for the next build. Re-run it when the roster changes.
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "@playwright/test";

import { resolveContentRootDir } from "../../apps/server/src/contentLoader/contentLoaderUtils/index.ts";

const url = process.argv[2] ?? "http://127.0.0.1:5676/card";
const outputDir = join(resolveContentRootDir(), "local/assets/teaser");
const outputPath = join(outputDir, "share-card.png");
// Long enough for the first pair to walk on (PARADE_ENTER_MS) and settle into the dance.
const SETTLE_MS = 5000;

mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch();

try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

  await page.goto(url);
  await page.waitForSelector("[data-teaser-share-card] [data-cast-parade]");
  await page.waitForTimeout(SETTLE_MS);
  await page.locator("[data-teaser-share-card]").screenshot({ path: outputPath });
  console.log(`share card: ${outputPath}`);
} finally {
  await browser.close();
}
