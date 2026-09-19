import { expect, test, type Page } from "@playwright/test";

// The two failures a split client can have that an unsplit one could not: a
// route chunk that never arrives, and a minigame renderer chunk that does not.
// Both are realistic on house Wi-Fi, and both used to end with the room staring
// at nothing — a white #root for the route, a blank stage for the renderer.
//
// Requests are aborted rather than stubbed so the browser sees exactly what a
// dropped LAN or a 404 from a rebuilt server looks like.

const DISPLAY_ROUTE_CHUNK_PATTERN = "**/components/DisplayBoard/**";
const TRIVIA_RENDERER_CHUNK_PATTERN = "**/minigames/trivia/src/client/**";

const collectFailedRequests = (page: Page): string[] => {
  const failedRequests: string[] = [];

  page.on("requestfailed", (request) => {
    failedRequests.push(request.url());
  });

  return failedRequests;
};

test("display shows a crash notice instead of a white screen when its route chunk never arrives", async ({
  page
}) => {
  const failedRequests = collectFailedRequests(page);

  await page.route(DISPLAY_ROUTE_CHUNK_PATTERN, async (route) => {
    await route.abort("failed");
  });

  await page.goto("/display");

  // The room is told what happened, in the app's own clothes.
  await expect(page.getByText("The display dropped out.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reload the Display" })
  ).toBeVisible();

  // The actual regression: React unmounting the root leaves #root empty.
  const rootChildCount = await page.evaluate(
    () => document.getElementById("root")?.childElementCount ?? 0
  );
  expect(rootChildCount).toBeGreaterThan(0);

  expect(failedRequests.length).toBeGreaterThan(0);
});

test("minigame sandbox says the renderer failed instead of waiting on it forever", async ({
  page
}) => {
  let rendererRequestCount = 0;

  await page.route(TRIVIA_RENDERER_CHUNK_PATTERN, async (route) => {
    rendererRequestCount += 1;

    await route.abort("failed");
  });

  await page.goto("/dev/minigame/trivia");

  await expect(
    page.getByRole("heading", { name: "Minigame Dev Sandbox" })
  ).toBeVisible();

  // The stage used to sit on its placeholder for good, because the rejection
  // latched and no later render asked again. Reaching this message at all means
  // the load was attempted three times: the store only reports `unavailable`
  // after MINIGAME_RENDERER_FAILURES_BEFORE_UNAVAILABLE failures, each one
  // scheduled by the one before it.
  await expect(
    page.getByText("The minigame surfaces failed to load. Check the dev server and reload the page.")
  ).toBeVisible({ timeout: 15_000 });

  await expect(
    page.getByText("Loading the minigame surfaces\u2026")
  ).toHaveCount(0);

  // Only the first attempt reaches the network: the browser's module map caches
  // a failed import for the life of the page, so the later attempts resolve
  // against that cached rejection. That is exactly why the surface has to say
  // something rather than wait — the retries alone cannot save this one.
  expect(rendererRequestCount).toBeGreaterThanOrEqual(1);
});
