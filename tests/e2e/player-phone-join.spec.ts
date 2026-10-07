import { expect, test, type Page } from "@playwright/test";

import { ensureSetupPhase } from "./hostShell";

// A guest's phone joining over the party Wi-Fi, end to end across the three
// surfaces: the TV draws the join QR, the phone opens the URL it encodes and
// taps a face, the tablet sees the claim and frees it, and the phone hears its
// face is gone. Then the phone that sleeps and wakes — a reload — is the same
// player again without a re-pick.
//
// The whole stack runs on loopback here, and a CI box may have no Wi-Fi
// address at all, so the TV's `/lan-addresses` is answered with 127.0.0.1:
// the QR then encodes a URL this phone context can open. Everything after the
// address — the path, and the join token only the laptop's display is handed —
// is the TV's own.

const PHONE_VIEWPORT = { width: 390, height: 844 };

const readJoinUrl = async (displayPage: Page): Promise<string> => {
  const joinCard = displayPage.locator("[data-player-join-url]");

  await expect(joinCard).toBeVisible();

  const joinUrl = await joinCard.getAttribute("data-player-join-url");

  expect(joinUrl).toMatch(/\/play\?t=[A-Za-z0-9_-]{16,}$/);

  return joinUrl ?? "";
};

test("does seat a phone from the TV's QR, show the claim on the tablet and free it", async ({
  browser
}) => {
  const hostContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const displayContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const phoneContext = await browser.newContext({ viewport: PHONE_VIEWPORT });
  const hostPage = await hostContext.newPage();
  const displayPage = await displayContext.newPage();
  const phonePage = await phoneContext.newPage();

  await displayPage.route("**/lan-addresses", (route) =>
    route.fulfill({ json: { addresses: ["127.0.0.1"] } })
  );

  // A reset rotates the join token, so the room is settled before the TV
  // reads one.
  await hostPage.goto("/host");
  await ensureSetupPhase(hostPage);
  await displayPage.goto("/display");

  const joinUrl = await readJoinUrl(displayPage);

  // The phone scans: the token is kept and taken back out of the address bar.
  await phonePage.goto(joinUrl);
  await expect(phonePage.locator("[data-player-seat-status='picking']")).toBeVisible();
  await expect(phonePage).toHaveURL(/\/play$/);

  const freeFace = phonePage.locator("[data-face-taken='false']").first();
  const playerId = (await freeFace.getAttribute("data-face-player-id")) ?? "";

  expect(playerId).not.toBe("");
  await freeFace.click();

  const idleCard = phonePage.locator(`[data-player-idle='${playerId}']`);
  // `data-player-self` is set only by the server's `player:self`, never by the
  // phone's own storage: it is the proof the server seated this socket.
  const confirmedSeat = phonePage.locator(`[data-player-self='${playerId}']`);
  await expect(idleCard).toBeVisible();
  await expect(confirmedSeat).toBeVisible();

  // The TV counts the phone in; the tablet badges the face as connected.
  await expect(displayPage.locator("[data-player-join-count='1']")).toBeVisible();
  const hostRow = hostPage.locator(`[data-setup-player-id='${playerId}']`);
  await expect(hostRow.locator("[data-player-claim='connected']")).toBeVisible();

  // The phone sleeps and wakes: same face, no picker in between, and the
  // server — not just the phone's storage — says so on the new socket.
  await phonePage.reload();
  await expect(idleCard).toBeVisible();
  await expect(confirmedSeat).toBeVisible();
  await expect(phonePage.locator("[data-face-player-id]")).toHaveCount(0);
  await expect(hostRow.locator("[data-player-claim='connected']")).toBeVisible();

  // The host frees the face from the tablet; the phone hears it is gone.
  await hostRow.getByRole("button", { name: /^Free / }).click();
  await expect(phonePage.locator("[data-player-claim-gone='released_by_host']")).toBeVisible();
  await expect(hostRow.locator("[data-player-claim]")).toHaveCount(0);
  await expect(displayPage.locator("[data-player-join-count='0']")).toBeVisible();

  // Back to the picker, where the freed face is free again.
  await phonePage.getByRole("button", { name: "Pick your face" }).click();
  const freedFace = phonePage.locator(`[data-face-player-id='${playerId}']`);
  await expect(freedFace).toHaveAttribute("data-face-taken", "false");

  // The phone lets go itself: "This isn't me" asks once more before it does.
  await freedFace.click();
  await expect(confirmedSeat).toBeVisible();
  await phonePage.getByRole("button", { name: "This isn't me" }).click();
  await expect(idleCard).toBeVisible();
  await phonePage.getByRole("button", { name: "Yes, let go" }).click();
  await expect(phonePage.locator("[data-player-seat-status='picking']")).toBeVisible();
  await expect(hostRow.locator("[data-player-claim]")).toHaveCount(0);

  await hostContext.close();
  await displayContext.close();
  await phoneContext.close();
});

test("does send a phone with no join token to the TV instead of seating it", async ({ browser }) => {
  const phoneContext = await browser.newContext({ viewport: PHONE_VIEWPORT });
  const phonePage = await phoneContext.newPage();

  await phonePage.goto("/play");
  await expect(phonePage.locator("[data-player-scan-tv]")).toBeVisible();
  await expect(phonePage.locator("[data-player-seat-status='locked']")).toBeVisible();

  await phoneContext.close();
});
