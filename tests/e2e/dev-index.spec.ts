import { expect, test, type Page } from "@playwright/test";

const collectSocketRequests = (page: Page): string[] => {
  const socketRequests: string[] = [];

  page.on("request", (request) => {
    if (request.url().includes("/socket.io")) {
      socketRequests.push(request.url());
    }
  });

  return socketRequests;
};

// The whole point of the launcher: reach any sandbox without knowing a slug.
test("walks from the screen picker into a sandbox and switches games", async ({
  page
}) => {
  const socketRequests = collectSocketRequests(page);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Pick Your Screen" })).toBeVisible();

  await page.getByRole("link", { name: "Dev tools" }).click();

  await expect(page).toHaveURL(/\/dev$/);
  await expect(
    page.getByRole("heading", { name: "Minigame Testing" })
  ).toBeVisible();

  // The launcher is the only place the display name and the slug appear
  // together — that pairing is what saves the lookup.
  const joustLink = page.getByRole("link", { name: /Slingshlong/ });
  await expect(joustLink).toHaveAttribute("href", "/dev/minigame/joust");
  await joustLink.click();

  await expect(page).toHaveURL(/\/dev\/minigame\/joust$/);
  await expect(
    page.getByRole("heading", { name: "Minigame Dev Sandbox" })
  ).toBeVisible();

  // The switcher navigates to the sibling sandbox, which re-seeds the runtime
  // from that game's dev fixture.
  await page.getByLabel("Minigame").selectOption("trivia");

  await expect(page).toHaveURL(/\/dev\/minigame\/trivia$/);
  await expect(
    page.getByText("What country is widely credited as the origin of hot sauce?")
  ).toHaveCount(2);

  // Back out to the launcher the same way.
  await page.getByRole("link", { name: "All sandboxes" }).click();
  await expect(page).toHaveURL(/\/dev$/);

  expect(socketRequests).toHaveLength(0);
});

test("links every dev lab and every minigame sandbox", async ({ page }) => {
  await page.goto("/dev");

  for (const slug of [
    "trivia",
    "geo",
    "song-guess",
    "joust",
    "drawing",
    "emoji-charades"
  ]) {
    await expect(page.locator(`a[href="/dev/minigame/${slug}"]`)).toBeVisible();
  }

  for (const labName of ["anamorph", "contraption", "contraption-ui"]) {
    await expect(page.locator(`a[href="/dev/lab/${labName}"]`)).toBeVisible();
  }
});
