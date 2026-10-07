import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { ensureSetupPhase } from "./hostShell";

// Answers on the phones end to end: ONE team per turn, but every seated phone on that team answers
// the question in hand at once, and the host locks and reveals on the tablet. GEO: two phones on
// the team that is up each drop a pin on their own chart, the TV counts them in (and never says
// where), the host locks the photo, and the TV plots both pins by name. TRIVIA: two phones each
// tap a choice, the host locks, and the TV shows the spread.
//
// Headless Chromium has no network, so the OSM tiles never arrive: the chart's dark ground and
// graticule are what the phones tap, which is the offline party's degrade path too.
//
// As in player-phone-join.spec.ts, the stack runs on loopback, so the TV's `/lan-addresses` is
// answered with 127.0.0.1 and the QR's URL is one the phone contexts can open.

const openContexts: BrowserContext[] = [];

const PHONE_UPRIGHT = { width: 390, height: 844 };

const openDevice = async (browser: Browser, options: Parameters<Browser["newContext"]>[0]): Promise<Page> => {
  const context = await browser.newContext(options);

  openContexts.push(context);

  return context.newPage();
};

test.afterEach(async () => {
  await Promise.all(openContexts.splice(0).map((context) => context.close()));
});

const openRoom = async (browser: Browser): Promise<{ hostPage: Page; displayPage: Page; joinUrl: string }> => {
  const hostPage = await openDevice(browser, { viewport: { width: 1280, height: 800 } });
  const displayPage = await openDevice(browser, { viewport: { width: 1920, height: 1080 } });

  await displayPage.route("**/lan-addresses", (route) => route.fulfill({ json: { addresses: ["127.0.0.1"] } }));
  // A reset rotates the join token, so the room is settled before the TV reads one.
  await hostPage.goto("/host");
  await ensureSetupPhase(hostPage);
  await displayPage.goto("/display");

  const joinCard = displayPage.locator("[data-player-join-url]");

  await expect(joinCard).toBeVisible();

  return { hostPage, displayPage, joinUrl: (await joinCard.getAttribute("data-player-join-url")) ?? "" };
};

// Quick Play one game; its first team's briefing is up when this returns.
const startQuickPlay = async (hostPage: Page, gameName: string): Promise<void> => {
  await hostPage.getByRole("link", { name: "Quick Play a mini-game" }).click();
  await hostPage.getByRole("button", { name: "Everyone" }).click();
  await hostPage.getByRole("button", { name: `Queue ${gameName}` }).click();
  await hostPage.getByRole("button", { name: "Start Quick Play" }).click();
  await expect(hostPage.getByRole("button", { name: "Start Mini-Game" })).toBeVisible({ timeout: 15_000 });
};

// The briefing's team as the TV draws it.
const readBriefedTeam = async (displayPage: Page): Promise<string[]> => {
  const members = displayPage.locator("[data-team-briefing] [data-lineup-member]");

  await expect(members.first()).toBeVisible();

  return members.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-lineup-member") ?? "")
  );
};

const seatPhone = async (browser: Browser, joinUrl: string, playerId: string): Promise<{ page: Page; name: string }> => {
  const page = await openDevice(browser, { viewport: PHONE_UPRIGHT, isMobile: true, hasTouch: true });

  await page.goto(joinUrl);

  const face = page.locator(`[data-face-player-id='${playerId}']`);
  const name = ((await face.locator("span").last().textContent()) ?? "").trim();

  await face.click();
  await expect(page.locator(`[data-player-self='${playerId}']`)).toBeAttached();

  return { page, name };
};

test("does plot both phones' pins by name on the TV when two playing-team phones pin and the host locks the photo", async ({
  browser
}) => {
  test.setTimeout(120_000);

  const { hostPage, displayPage, joinUrl } = await openRoom(browser);

  await startQuickPlay(hostPage, "Geo");

  const [firstId = "", secondId = ""] = await readBriefedTeam(displayPage);
  const first = await seatPhone(browser, joinUrl, firstId);
  const second = await seatPhone(browser, joinUrl, secondId);

  await hostPage.getByRole("button", { name: "Start Mini-Game" }).click();

  // Each phone gets its own chart, and taps it. Whether or not the tiles arrive, the tap lands on the
  // chart (geo-offline.spec.ts blocks them and taps the bare graticule).
  for (const [phone, position] of [
    [first.page, { x: 110, y: 150 }],
    [second.page, { x: 210, y: 190 }]
  ] as const) {
    const card = phone.locator("[data-phone-answer='GEO'][data-phone-answer-status='open']");

    await expect(card).toBeVisible();

    const chart = card.locator(".leaflet-container");

    await expect(chart).toBeVisible();
    await chart.click({ position });
    await expect(phone.locator("[data-phone-answer='GEO'][data-phone-answer-pinned='true']")).toBeVisible();
  }

  // The TV counts them in and says nothing of where or whose.
  const tally = displayPage.locator("[data-geo-phone-tally='2/2']");

  await expect(tally).toBeVisible();
  await expect(tally).toContainText("2 of 2 pins in");
  await expect(displayPage.locator(".geo-pin-label")).toHaveCount(0);
  await expect(hostPage.getByText("2 of 2 phones pinned")).toBeVisible();

  // Where the first phone's chart was, for a late tap once the photo is locked.
  const chartBox = await first.page.locator("[data-phone-answer='GEO'] .leaflet-container").boundingBox();

  expect(chartBox).not.toBeNull();

  // The host locks the photo with no pin of the tablet's own: the phones' pins are the guesses.
  await hostPage.getByRole("button", { name: "Lock it in" }).click();

  const labels = displayPage.locator(".geo-pin-label");

  await expect(labels).toHaveCount(2);
  await expect(labels.filter({ hasText: first.name })).toHaveCount(1);
  await expect(labels.filter({ hasText: second.name })).toHaveCount(1);
  await expect(displayPage.locator("[data-result-plaque]")).toBeVisible();

  // Each phone is locked and told how its own pin measured.
  for (const phone of [first.page, second.page]) {
    await expect(phone.locator("[data-phone-answer='GEO'][data-phone-answer-status='locked']")).toBeVisible();
  }

  // A late tap where the first phone's chart was: the locked card has no chart to take it, and the
  // TV's reveal does not move. (A late pin that does reach the server is refused — the runtime and
  // socket tests pin that.)
  const plaqueBefore = await displayPage.locator("[data-result-plaque]").innerText();

  await first.page.mouse.click((chartBox?.x ?? 0) + 90, (chartBox?.y ?? 0) + 120);
  await first.page.waitForTimeout(500);

  await expect(first.page.locator("[data-phone-answer='GEO'] .leaflet-container")).toHaveCount(0);
  await expect(first.page.locator("[data-phone-answer='GEO'][data-phone-answer-status='locked']")).toBeVisible();
  await expect(labels).toHaveCount(2);
  expect(await displayPage.locator("[data-result-plaque]").innerText()).toBe(plaqueBefore);

  // Reset Game restores the pack's night for the specs that follow.
  await ensureSetupPhase(hostPage);
});

test("does show the spread on the TV when two playing-team phones choose and the host locks the question", async ({
  browser
}) => {
  test.setTimeout(120_000);

  const { hostPage, displayPage, joinUrl } = await openRoom(browser);

  await startQuickPlay(hostPage, "Trivia");

  const [firstId = "", secondId = ""] = await readBriefedTeam(displayPage);
  const first = await seatPhone(browser, joinUrl, firstId);
  const second = await seatPhone(browser, joinUrl, secondId);

  await hostPage.getByRole("button", { name: "Start Mini-Game" }).click();

  // The pack's first question for the first team has choices: the TV lists them, unmarked.
  await expect(displayPage.locator("[data-trivia-choices]")).toBeVisible();

  // Each phone taps a different choice; the TV counts them in without saying which.
  for (const [phone, option] of [
    [first.page, 0],
    [second.page, 1]
  ] as const) {
    const card = phone.locator("[data-phone-answer='TRIVIA'][data-phone-answer-status='open']");

    await expect(card).toBeVisible();
    await card.locator(`[data-phone-answer-option='${option}']`).click();
    await expect(phone.locator(`[data-phone-answer='TRIVIA'][data-phone-answer-choice='${option}']`)).toBeVisible();
  }

  await expect(displayPage.locator("[data-trivia-phone-tally='2/2']")).toBeVisible();
  await expect(displayPage.locator("[data-trivia-spread]")).toHaveCount(0);

  await hostPage.getByRole("button", { name: /Lock answers · 2 of 2 in/ }).click();

  // The spread: one phone on each of the first two choices, and exactly one bar marked the answer.
  await expect(displayPage.locator("[data-trivia-spread-choice='0'][data-trivia-spread-count='1']")).toBeVisible();
  await expect(displayPage.locator("[data-trivia-spread-choice='1'][data-trivia-spread-count='1']")).toBeVisible();
  await expect(displayPage.locator("[data-trivia-spread-answer='true']")).toHaveCount(1);
  await expect(displayPage.locator("[data-trivia-result] [data-result-plaque]")).toBeVisible();

  // Each phone is locked and told whether its own pick was the answer.
  for (const phone of [first.page, second.page]) {
    await expect(phone.locator("[data-phone-answer='TRIVIA'][data-phone-answer-status='locked']")).toBeVisible();
  }

  // Reset Game restores the pack's night for the specs that follow.
  await ensureSetupPhase(hostPage);
});
