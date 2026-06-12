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

  const submitButton = page.getByRole("button", { name: "Stamp the Guess" });
  await expect(submitButton).toBeDisabled();

  // The display preview must not include answer coordinates while guessing.
  const guessingContent = await page.content();
  expect(guessingContent.includes("answerLat")).toBe(false);
  expect(guessingContent.includes("48.85837")).toBe(false);

  // Tapping the host map places a guess, arming the submit button.
  await page.locator(".leaflet-container").click();
  await expect(submitButton).toBeEnabled();

  await submitButton.click();

  // The host result stamps and the display reveal stamps update live.
  await expect(page.getByText(/km off course|m off course/)).toHaveCount(2);
  await expect(page.getByText(/^\+\d+$/).first()).toBeVisible();

  // Advancing moves both previews to the second prompt.
  await page.getByRole("button", { name: "Turn the Page" }).click();
  await expect(page.getByText("Statue of Liberty")).toHaveCount(2);

  // Reset restores the freshly initialized state.
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByText("Eiffel Tower")).toHaveCount(2);
  await expect(submitButton).toBeDisabled();

  expect(socketRequests).toHaveLength(0);
});

const DRAWING_DEV_PROMPT_PATTERN =
  /^(Pizza slice|Campfire|Skateboard|Octopus|Rocket ship|Walking the dog)$/;

test("drawing sandbox syncs tablet strokes to the display and reveals on correct", async ({
  page
}) => {
  const socketRequests = collectSocketRequests(page);

  await page.goto("/dev/minigame/drawing");

  await expect(
    page.getByRole("heading", { name: "Minigame Dev Sandbox" })
  ).toBeVisible();
  await expect(page.getByText("Sketch Booth")).toBeVisible();
  await expect(page.getByText("Live Sketch")).toBeVisible();

  // The shuffled current prompt is visible on the host banner only; the
  // display side must never echo it while drawing.
  const promptParagraph = page
    .locator("p")
    .filter({ hasText: DRAWING_DEV_PROMPT_PATTERN })
    .first();
  const promptText = (await promptParagraph.textContent()) ?? "";
  expect(promptText.length).toBeGreaterThan(0);
  await expect(page.getByText(promptText, { exact: true })).toHaveCount(1);

  const undoButton = page.getByRole("button", { name: "Undo" });
  await expect(undoButton).toBeDisabled();

  // Drag a stroke across the host canvas with the pointer.
  const hostCanvas = page.locator("canvas").first();
  const canvasBounds = await hostCanvas.boundingBox();
  expect(canvasBounds).not.toBeNull();

  if (canvasBounds === null) {
    return;
  }

  await page.mouse.move(
    canvasBounds.x + canvasBounds.width * 0.3,
    canvasBounds.y + canvasBounds.height * 0.4
  );
  await page.mouse.down();
  await page.mouse.move(
    canvasBounds.x + canvasBounds.width * 0.7,
    canvasBounds.y + canvasBounds.height * 0.6,
    { steps: 12 }
  );
  await page.mouse.up();

  // The canonical (server-reduced) state now holds the stroke...
  await expect(undoButton).toBeEnabled();

  // ...and the read-only display canvas re-renders it.
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const displayCanvas = document.querySelectorAll("canvas")[1];

        if (!(displayCanvas instanceof HTMLCanvasElement)) {
          return false;
        }

        const context = displayCanvas.getContext("2d");

        if (context === null) {
          return false;
        }

        const pixels = context.getImageData(
          0,
          0,
          displayCanvas.width,
          displayCanvas.height
        ).data;

        for (let index = 3; index < pixels.length; index += 4) {
          if ((pixels[index] ?? 0) > 0) {
            return true;
          }
        }

        return false;
      });
    })
    .toBe(true);

  // Marking correct banks a point and briefly reveals the prompt on the
  // display, then the reveal hides on its own.
  await page.getByRole("button", { name: "Correct" }).click();

  await expect(page.getByText("+1 pending").first()).toBeVisible();
  const revealLabel = page.getByText("The answer was", { exact: true });
  await expect(revealLabel).toBeVisible();
  // The resolved prompt resurfaces inside the reveal plaque only.
  await expect(page.getByText(promptText, { exact: false }).last()).toBeVisible();
  await expect(revealLabel).toBeHidden({ timeout: 4000 });

  // The result action cleared the canvas and advanced to a fresh prompt.
  await expect(undoButton).toBeDisabled();

  expect(socketRequests).toHaveLength(0);
});
