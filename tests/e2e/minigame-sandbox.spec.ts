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

test("trivia sandbox plays a live turn against the real runtime without sockets", async ({
  page
}) => {
  const socketRequests = collectSocketRequests(page);

  await page.goto("/dev/minigame/trivia");

  await expect(
    page.getByRole("heading", { name: "Minigame Dev Sandbox" })
  ).toBeVisible();
  await expect(page.getByText("Host Preview", { exact: true })).toBeVisible();
  await expect(page.getByText("Display Preview", { exact: true })).toBeVisible();

  // The first sample prompt is projected live into both previews.
  await expect(
    page.getByText("What country is widely credited as the origin of hot sauce?")
  ).toHaveCount(2);
  await expect(page.getByText("3 questions left")).toBeVisible();

  // Recording a correct attempt advances the real reducer to the next prompt.
  await page.getByRole("button", { name: "Correct", exact: true }).click();

  await expect(
    page.getByText("What compound gives chili peppers their heat?")
  ).toHaveCount(2);
  await expect(page.getByText("2 questions left")).toBeVisible();

  expect(socketRequests).toHaveLength(0);
});

test("geo sandbox plays guess, submit, reveal, and next prompt live", async ({
  page
}) => {
  const socketRequests = collectSocketRequests(page);

  await page.goto("/dev/minigame/geo");

  await expect(
    page.getByRole("heading", { name: "Minigame Dev Sandbox" })
  ).toBeVisible();

  // Both previews render the first prompt from the live fixture content.
  await expect(page.getByText("Eiffel Tower")).toHaveCount(2);

  const submitButton = page.getByRole("button", { name: "Submit Guess" });
  await expect(submitButton).toBeDisabled();

  // The display preview must not include answer coordinates while guessing.
  const guessingContent = await page.content();
  expect(guessingContent.includes("answerLat")).toBe(false);
  expect(guessingContent.includes("48.85837")).toBe(false);

  // Tapping the host map places a guess, arming the submit button.
  await page.locator(".leaflet-container").click();
  await expect(submitButton).toBeEnabled();

  await submitButton.click();

  // The host result card and the display reveal stats update live.
  await expect(page.getByText(/km away|m away/)).toBeVisible();
  await expect(page.getByText("Distance", { exact: true })).toHaveCount(2);
  await expect(page.getByText(/\+\d+ points?/).first()).toBeVisible();

  // Advancing moves both previews to the second prompt.
  await page.getByRole("button", { name: "Next Prompt" }).click();
  await expect(page.getByText("Statue of Liberty")).toHaveCount(2);

  // Reset restores the scenario's starting state.
  await page.getByRole("button", { name: "Reset Scenario" }).click();
  await expect(page.getByText("Eiffel Tower")).toHaveCount(2);
  await expect(submitButton).toBeDisabled();

  expect(socketRequests).toHaveLength(0);
});
