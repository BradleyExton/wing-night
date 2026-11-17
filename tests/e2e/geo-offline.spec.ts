import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { ensureSetupPhase } from "./hostShell";

// GEO at a party with no route to the map tiles: every device's requests to the tile server fail.
// The tablet and the TV still draw the chart's dark ground and graticule and say why it is bare; a
// tap on the tablet's bare chart still drops the team's pin; and the note goes the moment tiles load
// again.

const TILE_PATTERN = /tile\.openstreetmap\.org/;

// A 1x1 transparent PNG: what a tile server that came back serves, as far as Leaflet can tell.
const TILE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

const openContexts: BrowserContext[] = [];

const openOfflineDevice = async (browser: Browser, options: Parameters<Browser["newContext"]>[0]): Promise<Page> => {
  const context = await browser.newContext(options);

  openContexts.push(context);
  await context.route(TILE_PATTERN, (route) => route.abort("internetdisconnected"));

  return context.newPage();
};

test.afterEach(async () => {
  await Promise.all(openContexts.splice(0).map((context) => context.close()));
});

test("does take the tablet's tap on the bare graticule when no map tile can load", async ({ browser }) => {
  test.setTimeout(120_000);

  const hostPage = await openOfflineDevice(browser, { viewport: { width: 1280, height: 800 } });
  const displayPage = await openOfflineDevice(browser, { viewport: { width: 1920, height: 1080 } });

  await hostPage.goto("/host");
  await ensureSetupPhase(hostPage);
  await displayPage.goto("/display");

  await hostPage.getByRole("link", { name: "Quick Play a mini-game" }).click();
  await hostPage.getByRole("button", { name: "Everyone" }).click();
  await hostPage.getByRole("button", { name: "Queue Geo" }).click();
  await hostPage.getByRole("button", { name: "Start Quick Play" }).click();
  await expect(hostPage.getByRole("button", { name: "Start Mini-Game" })).toBeVisible({ timeout: 15_000 });
  await hostPage.getByRole("button", { name: "Start Mini-Game" }).click();

  // Both screens say why their chart is bare.
  await expect(hostPage.locator("[data-geo-map-offline]")).toBeVisible({ timeout: 15_000 });
  await expect(displayPage.locator("[data-geo-map-offline]")).toBeVisible({ timeout: 15_000 });

  // The bare chart is the chart's own dark ground, not Leaflet's grey.
  const chart = hostPage.locator(".leaflet-container").first();

  expect(await chart.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(14, 20, 25)");

  // The tablet's tap lands with no tiles: the lock opens on it.
  const lock = hostPage.getByRole("button", { name: "Lock it in" });

  await expect(lock).toBeDisabled();
  await chart.click({ position: { x: 700, y: 400 } });
  await expect(lock).toBeEnabled();

  // The tile server comes back: on the same chart, the next tile that lands takes the note away.
  const hostContext = hostPage.context();

  await hostContext.unroute(TILE_PATTERN);
  await hostContext.route(TILE_PATTERN, (route) => route.fulfill({ contentType: "image/png", body: TILE_PNG }));
  await hostPage.getByRole("button", { name: "Barrie" }).click();
  await expect(hostPage.locator("[data-geo-map-offline]")).toHaveCount(0, { timeout: 15_000 });

  await lock.click();
  await expect(lock).toHaveCount(0);

  await ensureSetupPhase(hostPage);
});
