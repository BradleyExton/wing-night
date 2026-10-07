import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { ensureSetupPhase } from "./hostShell";

// GEO at a party with no route to the map tiles: every device's requests to the tile server fail.
// The phone, the tablet and the TV still draw the chart's dark ground and graticule and say why it is
// bare; a tap on the bare chart still drops a pin; and the note goes the moment tiles load again.

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

test("does take a phone's and the tablet's tap on the bare graticule when no map tile can load", async ({ browser }) => {
  test.setTimeout(120_000);

  const hostPage = await openOfflineDevice(browser, { viewport: { width: 1280, height: 800 } });
  const displayPage = await openOfflineDevice(browser, { viewport: { width: 1920, height: 1080 } });

  await displayPage.route("**/lan-addresses", (route) => route.fulfill({ json: { addresses: ["127.0.0.1"] } }));
  await hostPage.goto("/host");
  await ensureSetupPhase(hostPage);
  await displayPage.goto("/display");

  const joinCard = displayPage.locator("[data-player-join-url]");

  await expect(joinCard).toBeVisible();

  const joinUrl = (await joinCard.getAttribute("data-player-join-url")) ?? "";

  await hostPage.getByRole("link", { name: "Quick Play a mini-game" }).click();
  await hostPage.getByRole("button", { name: "Everyone" }).click();
  await hostPage.getByRole("button", { name: "Queue Geo" }).click();
  await hostPage.getByRole("button", { name: "Start Quick Play" }).click();
  await expect(hostPage.getByRole("button", { name: "Start Mini-Game" })).toBeVisible({ timeout: 15_000 });

  const members = displayPage.locator("[data-team-briefing] [data-lineup-member]");

  await expect(members.first()).toBeVisible();

  const [firstId = ""] = await members.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-lineup-member") ?? "")
  );
  const phone = await openOfflineDevice(browser, {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });

  await phone.goto(joinUrl);
  await phone.locator(`[data-face-player-id='${firstId}']`).click();
  await expect(phone.locator(`[data-player-self='${firstId}']`)).toBeAttached();

  await hostPage.getByRole("button", { name: "Start Mini-Game" }).click();

  const card = phone.locator("[data-phone-answer='GEO'][data-phone-answer-status='open']");

  await expect(card).toBeVisible();
  // Every device says why its chart is bare.
  await expect(phone.locator("[data-geo-map-offline]")).toBeVisible({ timeout: 15_000 });
  await expect(hostPage.locator("[data-geo-map-offline]")).toBeVisible({ timeout: 15_000 });
  await expect(displayPage.locator("[data-geo-map-offline]")).toBeVisible({ timeout: 15_000 });

  // The bare chart is the chart's own dark ground, not Leaflet's grey.
  const chart = card.locator(".leaflet-container");

  expect(await chart.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(14, 20, 25)");

  // The phone's tap lands with no tiles, and so does the tablet's.
  await chart.click({ position: { x: 150, y: 200 } });
  await expect(phone.locator("[data-phone-answer='GEO'][data-phone-answer-pinned='true']")).toBeVisible();
  await expect(displayPage.locator("[data-geo-phone-tally='1/1']")).toBeVisible();
  await hostPage.locator(".leaflet-container").first().click({ position: { x: 700, y: 400 } });

  // The tile server comes back: on the same chart, the next tile that lands takes the note away.
  const phoneContext = phone.context();

  await phoneContext.unroute(TILE_PATTERN);
  await phoneContext.route(TILE_PATTERN, (route) => route.fulfill({ contentType: "image/png", body: TILE_PNG }));
  await card.getByRole("button", { name: "Barrie" }).click();
  await expect(phone.locator("[data-geo-map-offline]")).toHaveCount(0, { timeout: 15_000 });

  await hostPage.getByRole("button", { name: "Lock it in" }).click();
  await expect(displayPage.locator(".geo-pin-label")).toHaveCount(2);

  await ensureSetupPhase(hostPage);
});
