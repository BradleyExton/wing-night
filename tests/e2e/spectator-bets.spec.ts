import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { ensureSetupPhase } from "./hostShell";

// The watchers' side bet end to end across the three surfaces: a guest's phone off the team that
// is up calls UNDER during the briefing, the TV counts the bet in (and never says which way), the
// turn plays — TRIVIA, scored by the host's own verdicts so the score is deterministic — and the
// turn's results settle the bet on the TV, naming the phone's player as the one who called it.
//
// As in player-phone-join.spec.ts, the stack runs on loopback, so the TV's `/lan-addresses` is
// answered with 127.0.0.1 and the QR's URL is one the phone context can open.

const openContexts: BrowserContext[] = [];

const openDevice = async (
  browser: Browser,
  options: Parameters<Browser["newContext"]>[0]
): Promise<Page> => {
  const context = await browser.newContext(options);

  openContexts.push(context);

  return context.newPage();
};

test.afterEach(async () => {
  await Promise.all(openContexts.splice(0).map((context) => context.close()));
});

test("does settle a watcher's phone bet on the TV and name its player when the turn's results are up", async ({
  browser
}) => {
  test.setTimeout(90_000);

  const hostPage = await openDevice(browser, { viewport: { width: 1280, height: 800 } });
  const displayPage = await openDevice(browser, { viewport: { width: 1920, height: 1080 } });
  const phonePage = await openDevice(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  await displayPage.route("**/lan-addresses", (route) => route.fulfill({ json: { addresses: ["127.0.0.1"] } }));
  // A reset rotates the join token, so the room is settled before the TV reads one.
  await hostPage.goto("/host");
  await ensureSetupPhase(hostPage);
  await displayPage.goto("/display");

  const joinCard = displayPage.locator("[data-player-join-url]");

  await expect(joinCard).toBeVisible();

  const joinUrl = (await joinCard.getAttribute("data-player-join-url")) ?? "";

  // Quick Play one TRIVIA turn per team: the window is the briefing alone (there are no wings).
  await hostPage.getByRole("link", { name: "Quick Play a mini-game" }).click();
  await hostPage.getByRole("button", { name: "Everyone" }).click();
  await hostPage.getByRole("button", { name: "Queue Trivia" }).click();
  await hostPage.getByRole("button", { name: "Start Quick Play" }).click();
  await expect(hostPage.getByRole("button", { name: "Start Mini-Game" })).toBeVisible({ timeout: 15_000 });

  // A guest whose face is NOT on the briefed team picks it up on their phone.
  const briefedMembers = displayPage.locator("[data-team-briefing] [data-lineup-member]");

  await expect(briefedMembers.first()).toBeVisible();

  const briefedIds = new Set(
    await briefedMembers.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-lineup-member") ?? "")
    )
  );

  await phonePage.goto(joinUrl);

  const faces = phonePage.locator("[data-face-player-id]");

  await expect(faces.first()).toBeVisible();

  const faceIds = await faces.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-face-player-id") ?? "")
  );
  const watcherId = faceIds.find((id) => id !== "" && !briefedIds.has(id)) ?? "";
  const watcherFace = phonePage.locator(`[data-face-player-id='${watcherId}']`);
  const watcherName = ((await watcherFace.locator("span").last().textContent()) ?? "").trim();

  expect(watcherId).not.toBe("");
  await watcherFace.click();
  await expect(phonePage.locator(`[data-player-self='${watcherId}']`)).toBeAttached();

  // The bet card: the line and two buttons. The phone calls UNDER, and the TV counts it in.
  const betCard = phonePage.locator("[data-spectator-bet='open']");

  await expect(betCard).toBeVisible();
  await expect(displayPage.locator("[data-spectator-bet-readout='0']")).toBeVisible();
  await phonePage.locator("[data-spectator-bet-choice='under']").click();
  await expect(phonePage.locator("[data-spectator-bet='open'][data-spectator-bet-pick='under']")).toBeVisible();
  await expect(displayPage.locator("[data-spectator-bet-readout='1']")).toBeVisible();
  // A count, never who: the TV's readout names nobody.
  await expect(displayPage.locator("[data-spectator-bet-readout='1']")).toContainText("1 bet in");
  await expect(displayPage.locator("[data-spectator-bet-readout='1']")).not.toContainText(watcherName);
  await expect(hostPage.locator("[data-host-spectator-bets='1']")).toBeVisible();

  // Play starts: the bet locks, and the TV says nothing about bets while the turn runs.
  await hostPage.getByRole("button", { name: "Start Mini-Game" }).click();
  await expect(phonePage.locator("[data-spectator-bet='locked'][data-spectator-bet-pick='under']")).toBeVisible();
  await expect(displayPage.locator("[data-spectator-bet-readout]")).toHaveCount(0);

  // One correct answer, on a final-round line of 10.5: well UNDER.
  await hostPage.getByRole("button", { name: /Correct/ }).click();
  await hostPage.getByRole("button", { name: "Open host controls" }).click();
  await hostPage.getByRole("button", { name: "End Team Turn" }).click();

  const settlement = displayPage.locator("[data-spectator-bet-settlement='under']");

  await expect(settlement).toBeVisible();
  await expect(settlement).toContainText("10.5");
  await expect(displayPage.locator("[data-spectator-bet-callers]")).toContainText(watcherName);
  await expect(phonePage.locator("[data-spectator-bet='settled'][data-spectator-bet-result='won']")).toBeVisible();

  // Reset Game restores the pack's night for the specs that follow.
  await ensureSetupPhase(hostPage);
});
