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
