import { expect, test } from "@playwright/test";

// The sandbox's DEFAULT seed: the content pack the server is actually serving,
// fetched over the dev-sandbox manifest route. Every other sandbox spec pins
// itself to the bundled fixture with `?seed=fixture`, so this is the one that
// proves the pack path reaches the previews at all.
//
// The e2e stack seeds its root from `content/sample`, so the roster and teams
// below are that pack's — four teams that the fixture's "Team Alpha" naming
// could never produce by accident.
test("seeds the sandbox from the server's content pack by default", async ({ page }) => {
  await page.goto("/dev/minigame/trivia");

  await expect(page.getByText("Seeded from the live content pack.")).toBeVisible();

  const turnSelect = page.getByLabel("Whose turn");

  await expect(turnSelect.getByRole("option", { name: "Molten Metal" })).toHaveCount(1);
  await expect(turnSelect.getByRole("option", { name: "Disco Inferno" })).toHaveCount(1);
  await expect(turnSelect.getByRole("option", { name: "Team Alpha" })).toHaveCount(0);

  // Not just the controls: the scoring chips are drawn from the runtime's own
  // view, so a pack team named there means the manifest reached `initialize()`.
  await expect(page.locator("p").filter({ hasText: /^Molten Metal$/ })).toHaveCount(1);
});

// The pin is what keeps the other sandbox specs deterministic, so it gets its
// own check rather than being trusted implicitly by the specs that rely on it.
test("pins the sandbox to the bundled fixture when the url asks", async ({ page }) => {
  await page.goto("/dev/minigame/trivia?seed=fixture");

  await expect(
    page.getByText("Seeded from the bundled fixture, as ?seed=fixture asked.")
  ).toBeVisible();

  const turnSelect = page.getByLabel("Whose turn");

  await expect(turnSelect.getByRole("option", { name: "Team Alpha" })).toHaveCount(1);
  await expect(turnSelect.getByRole("option", { name: "Molten Metal" })).toHaveCount(0);
});
