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

// The first sample level, and its shipped solution: two right-hand slopes at
// (3,6) and (5,7). Cell labels are 1-based on screen.
const SOLUTION_CELLS = ["Cell 4, 7", "Cell 6, 8"] as const;

test("contraption sandbox builds on the tablet, mirrors the plan to the TV, runs and scores", async ({
  page
}) => {
  const socketRequests = collectSocketRequests(page);

  await page.goto("/dev/minigame/contraption");

  await expect(
    page.getByRole("heading", { name: "Minigame Dev Sandbox" })
  ).toBeVisible();

  // Both previews carry the level; the display says the team is still building.
  await expect(page.getByText("Over the Shoulder")).toHaveCount(2);
  await expect(page.getByText("Attempt 1 of 2")).toHaveCount(2);
  await expect(page.getByText("0 / 2 pieces")).toHaveCount(2);
  await expect(page.getByText("Building…")).toBeVisible();

  const goButton = page.getByRole("button", { name: /^GO/ });
  const clearButton = page.getByRole("button", { name: "Clear field" });

  await expect(goButton).toBeEnabled();
  await expect(clearButton).toBeDisabled();

  // Slope right is the default piece; laying it in two cells spends the budget
  // and the display's copy of the field grows the same two segments.
  await page.getByRole("button", { name: SOLUTION_CELLS[0], exact: true }).click();
  await page.getByRole("button", { name: SOLUTION_CELLS[1], exact: true }).click();

  await expect(page.getByText("2 / 2 pieces")).toHaveCount(2);
  await expect(page.locator('[data-contraption-piece="slope-right"]')).toHaveCount(4);

  // Budget spent: a third cell is refused by the reducer.
  await page.getByRole("button", { name: "Cell 1, 1", exact: true }).click();
  await expect(page.getByText("2 / 2 pieces")).toHaveCount(2);

  // Tapping a placed cell with the same kind takes it back; re-placing it restores it.
  await page.getByRole("button", { name: SOLUTION_CELLS[1], exact: true }).click();
  await expect(page.getByText("1 / 2 pieces")).toHaveCount(2);
  await page.getByRole("button", { name: SOLUTION_CELLS[1], exact: true }).click();
  await expect(page.getByText("2 / 2 pieces")).toHaveCount(2);

  await goButton.click();

  // The server-side sim graded the shipped solution: landed plus the mid-air bonus.
  await expect(page.getByText("IN THE BUCKET", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("+7 pending")).toBeVisible();
  await expect(page.getByText("Best so far: 7")).toBeVisible();

  // The TV replays the track and lands on the verdict without any client prediction.
  await expect(page.locator("[data-contraption-verdict='landed']")).toBeVisible({
    timeout: 10_000
  });
  await expect(page.getByText("Building…")).toHaveCount(0);

  // Second go: the pieces stay put for a rebuild.
  await page.getByRole("button", { name: "Next attempt" }).click();
  await expect(page.getByText("Attempt 2 of 2")).toHaveCount(2);
  await expect(page.getByText("2 / 2 pieces")).toHaveCount(2);
  await expect(goButton).toBeEnabled();

  // Clearing the field and running again misses — but the best run still counts.
  await clearButton.click();
  await expect(page.getByText("0 / 2 pieces")).toHaveCount(2);
  await goButton.click();

  await expect(page.getByText("Missed", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("+7 pending")).toBeVisible();
  await expect(page.getByRole("button", { name: "Finish turn" })).toBeVisible();

  expect(socketRequests).toHaveLength(0);
});

test("the sandbox reset button restores a fresh field", async ({ page }) => {
  await page.goto("/dev/minigame/contraption");

  await page.getByRole("button", { name: SOLUTION_CELLS[0], exact: true }).click();
  await expect(page.getByText("1 / 2 pieces")).toHaveCount(2);

  await page.getByRole("button", { name: "Reset", exact: true }).click();

  await expect(page.getByText("0 / 2 pieces")).toHaveCount(2);
  await expect(page.getByText("Attempt 1 of 2")).toHaveCount(2);
});
