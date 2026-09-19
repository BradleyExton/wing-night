import { expect, test, type Page } from "@playwright/test";
import { devSandboxPath } from "./sandbox";

const collectSocketRequests = (page: Page): string[] => {
  const socketRequests: string[] = [];

  page.on("request", (request) => {
    if (request.url().includes("/socket.io")) {
      socketRequests.push(request.url());
    }
  });

  return socketRequests;
};

// The sandbox runs the offline path (live generation off in the dev
// manifest), which is the path a party falls back to with no key or no
// signal — so this is the flow that has to work regardless of the model.
test("recreate sandbox writes a prompt, grades it against the sealed checklist and scores it", async ({
  page
}) => {
  const socketRequests = collectSocketRequests(page);

  await page.goto(devSandboxPath("recreate"));

  await expect(page.getByRole("heading", { name: "Minigame Dev Sandbox" })).toBeVisible();
  await expect(page.getByText("Target 1 of 2")).toBeVisible();

  // Both previews hang the first target; neither shows its ingredients yet.
  await expect(page.getByAltText("Cottage Weekend")).toHaveCount(2);
  await expect(page.getByText("Ingredients sealed until the prompt is in")).toBeVisible();
  const writingContent = await page.content();
  expect(writingContent.includes("Outer space")).toBe(false);
  expect(writingContent.includes("A floating pizza")).toBe(false);

  const sendButton = page.getByRole("button", { name: "Send to the forger" });
  await expect(sendButton).toBeDisabled();

  await page
    .getByLabel("Describe the target in one prompt")
    .fill("Everyone in outer space in spacesuits with a pizza floating by");
  await expect(sendButton).toBeEnabled();
  await sendButton.click();

  // Submitting opens judging: the prompt is on the TV, the rubric is unsealed
  // on both sides, and the offline attempt says so.
  await expect(
    page.getByText("Everyone in outer space in spacesuits with a pizza floating by")
  ).toHaveCount(2);
  await expect(page.getByText("Judged by ear tonight")).toBeVisible();
  await expect(page.getByRole("button", { name: "Outer space" })).toBeVisible();
  await expect(page.locator("[data-recreate-ingredient]")).toHaveCount(4);
  await expect(page.locator("[data-recreate-ingredient='checked']")).toHaveCount(0);
  // The authored prompt stays sealed until the score is locked.
  expect((await page.content()).includes("The real prompt")).toBe(false);

  await page.getByRole("button", { name: "Outer space" }).click();
  await page.getByRole("button", { name: "Spacesuits" }).click();
  await page.getByRole("button", { name: "A floating pizza" }).click();
  await expect(page.locator("[data-recreate-ingredient='checked']")).toHaveCount(3);
  await expect(page.getByText("+3 pts on the table")).toBeVisible();

  // One tick back off, then lock: two points, and the real prompt revealed.
  await page.getByRole("button", { name: "Spacesuits" }).click();
  await page.getByRole("button", { name: "Lock in the score" }).click();

  await expect(page.getByText("+2", { exact: true })).toHaveCount(2);
  await expect(page.getByText("The real prompt", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/The whole group floating in outer space in silver spacesuits/)
  ).toHaveCount(2);

  // The second target of the turn starts blank and sealed again.
  await page.getByRole("button", { name: "Next target" }).click();
  await expect(page.getByText("Target 2 of 2")).toBeVisible();
  await expect(page.getByAltText("Late-Night Diner")).toHaveCount(2);
  await expect(page.getByText("Ingredients sealed until the prompt is in")).toBeVisible();
  await expect(page.getByLabel("Describe the target in one prompt")).toHaveValue("");

  // Reset restores the freshly initialized state.
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByText("Target 1 of 2")).toBeVisible();

  expect(socketRequests).toHaveLength(0);
});

test("recreate sandbox lets the team rewrite before anything is scored", async ({ page }) => {
  await page.goto(devSandboxPath("recreate"));

  await page.getByLabel("Describe the target in one prompt").fill("first try");
  await page.getByRole("button", { name: "Send to the forger" }).click();
  await page.getByRole("button", { name: "Outer space" }).click();

  await page.getByRole("button", { name: "Let them rewrite" }).click();

  // Back to writing with the checklist sealed and the draft kept for editing.
  await expect(page.getByText("Ingredients sealed until the prompt is in")).toBeVisible();
  await expect(page.getByRole("button", { name: "Outer space" })).toHaveCount(0);
  await expect(page.getByLabel("Describe the target in one prompt")).toHaveValue("first try");
});
