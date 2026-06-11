import { expect, test } from "@playwright/test";

test("dev minigame sandbox renders host/display previews without socket connection", async ({
  page
}) => {
  const socketRequests: string[] = [];

  page.on("request", (request) => {
    if (request.url().includes("/socket.io")) {
      socketRequests.push(request.url());
    }
  });

  await page.goto("/dev/minigame/trivia");

  await expect(
    page.getByRole("heading", { name: "Minigame Dev Sandbox" })
  ).toBeVisible();
  await expect(page.getByText("Host Preview", { exact: true })).toBeVisible();
  await expect(page.getByText("Display Preview", { exact: true })).toBeVisible();

  await page.getByLabel("Prompt Question").fill("Custom sandbox trivia prompt?");

  await expect(page.getByText("Custom sandbox trivia prompt?").first()).toBeVisible();
  await expect(socketRequests).toHaveLength(0);
});

test("dev minigame sandbox renders GEO scenarios with answer-safe display preview", async ({
  page
}) => {
  await page.goto("/dev/minigame/geo");

  await expect(
    page.getByRole("heading", { name: "Minigame Dev Sandbox" })
  ).toBeVisible();
  await expect(page.getByText("Host Preview", { exact: true })).toBeVisible();
  await expect(page.getByText("Display Preview", { exact: true })).toBeVisible();

  // Default scenario is guessing: prompt card and submit affordance render.
  await expect(page.getByText("Eiffel Tower").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit Guess" })).toBeVisible();

  // The display preview must not include answer coordinates while guessing.
  const pageContent = await page.content();
  expect(pageContent.includes("answerLat")).toBe(false);

  // Switching to the submitted scenario shows the reveal stats.
  await page.getByLabel("Scenario").selectOption("play-submitted");

  await expect(page.getByText("45.7 km").first()).toBeVisible();
  await expect(page.getByText("+1 point").first()).toBeVisible();
});
