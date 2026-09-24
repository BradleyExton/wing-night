import { expect, test, type Page } from "@playwright/test";
import { devSandboxPath } from "./sandbox";

// Mirrors SONG_GUESS_AUDIO_ROUTE_PATH in packages/shared. Re-declared rather
// than imported because nothing under tests/e2e depends on the workspace
// packages — this suite drives the built app over HTTP and stays black-box.
const SONG_GUESS_AUDIO_ROUTE_PATH = "/song-audio";

// The first song of team-alpha's seeded slice in the package dev manifest.
const FIRST_SONG_TITLE = "Smells Like Teen Spirit";
const FIRST_SONG_ARTIST = "Nirvana";
const SECOND_SONG_TITLE = "Billie Jean";

const collectSocketRequests = (page: Page): string[] => {
  const socketRequests: string[] = [];

  page.on("request", (request) => {
    if (request.url().includes("/socket.io")) {
      socketRequests.push(request.url());
    }
  });

  return socketRequests;
};

test("song guess sandbox plays, pauses, replays once, reveals and scores live", async ({
  page
}) => {
  const socketRequests = collectSocketRequests(page);

  await page.goto(devSandboxPath("song-guess"));

  await expect(
    page.getByRole("heading", { name: "Minigame Dev Sandbox" })
  ).toBeVisible();

  // The host holds the answer from the moment the song loads...
  await expect(page.getByText(FIRST_SONG_TITLE)).toHaveCount(1);
  await expect(page.getByText("Song 1 of 4")).toHaveCount(2);

  // ...and the display says only that something is coming.
  await expect(page.getByText("Listen closely…")).toBeVisible();

  const playButton = page.getByRole("button", { name: "Play clip" });
  const pauseButton = page.getByRole("button", { name: "Pause" });
  const replayButton = page.getByRole("button", { name: /Replay$/ });
  const revealButton = page.getByRole("button", { name: "Reveal answer" });

  await expect(pauseButton).toBeDisabled();
  await expect(replayButton).toBeDisabled();
  await expect(revealButton).toBeDisabled();

  await playButton.click();

  await expect(pauseButton).toBeEnabled();
  await expect(playButton).toBeDisabled();

  await pauseButton.click();

  // The display switches the room from listening to answering.
  await expect(page.getByText("Lock in your answers")).toBeVisible();
  await expect(page.getByText("Listen closely…")).toHaveCount(0);
  await expect(revealButton).toBeEnabled();

  // Exactly one replay per song: spending it takes the control away.
  await expect(replayButton).toBeEnabled();
  await replayButton.click();
  await pauseButton.click();
  await expect(page.getByRole("button", { name: /Replay used/ })).toBeDisabled();

  // Nothing so far has put the answer on the display — it is still the host's
  // single copy.
  await expect(page.getByText(FIRST_SONG_TITLE)).toHaveCount(1);
  await expect(page.getByText(FIRST_SONG_ARTIST)).toHaveCount(1);

  await revealButton.click();

  // Opening the ruling does not put the answer up either: the display says a
  // ruling is coming, and the answer is still the host's single copy.
  await expect(page.getByText("And the ruling is…")).toBeVisible();
  await expect(page.getByText(FIRST_SONG_TITLE)).toHaveCount(1);
  await expect(page.getByText(FIRST_SONG_ARTIST)).toHaveCount(1);

  // A point each for the title and the original artist. One half ruled is
  // still not a reveal.
  await page.getByRole("button", { name: "Mark Title correct" }).click();
  await expect(page.getByText("+1 pending")).toBeVisible();
  await expect(page.getByText(FIRST_SONG_TITLE)).toHaveCount(1);

  await page.getByRole("button", { name: "Mark Artist incorrect" }).click();
  await expect(page.getByText("+1 pending")).toBeVisible();

  // The second mark is the reveal-and-react beat: now both surfaces carry
  // the answer, with each ruling as a hit or a miss and the song's points.
  const revealCard = page.locator("[data-song-guess-reveal]");

  await expect(revealCard).toBeVisible();
  await expect(page.getByText(FIRST_SONG_TITLE)).toHaveCount(2);
  await expect(page.getByText(FIRST_SONG_ARTIST)).toHaveCount(2);
  await expect(page.locator('[data-song-guess-verdict="hit"]')).toHaveCount(1);
  await expect(page.locator('[data-song-guess-verdict="miss"]')).toHaveCount(1);
  await expect(page.getByText("+1 point this song")).toBeVisible();
  await expect(page.getByText("On the TV")).toBeVisible();

  // A ruling can still change, and the card follows it.
  await page.getByRole("button", { name: "Mark Artist correct" }).click();
  await expect(page.getByText("+2 pending")).toBeVisible();
  await expect(page.locator('[data-song-guess-verdict="hit"]')).toHaveCount(2);
  await expect(page.getByText("+2 points this song")).toBeVisible();

  // Advancing restores the replay allowance and moves both previews on. The
  // display may finish its reveal window first (the next test pins that), so
  // the assertions below wait for the card to clear rather than expect it.
  await page.getByRole("button", { name: "Next song" }).click();

  await expect(revealCard).toHaveCount(0);
  await expect(page.getByText("Song 2 of 4")).toHaveCount(2);
  await expect(page.getByText(SECOND_SONG_TITLE)).toHaveCount(1);
  await expect(replayButton).toBeDisabled();
  await expect(page.getByText("Listen closely…")).toBeVisible();

  expect(socketRequests).toHaveLength(0);
});

// The held beat: the host's "Next song" lands on the server at once (the
// tablet is on song 2 immediately), but the TV keeps the card up for the
// reveal window before it follows — no hard cut off the answer. The marks and
// the advance are tapped back to back so the window is still open when the
// hold is checked.
test("the display holds the reveal card after the host moves on", async ({
  page
}) => {
  await page.goto(devSandboxPath("song-guess"));

  await page.getByRole("button", { name: "Play clip" }).click();
  await page.getByRole("button", { name: "Pause" }).click();
  await page.getByRole("button", { name: "Reveal answer" }).click();
  await page.getByRole("button", { name: "Mark Title correct" }).click();
  await page.getByRole("button", { name: "Mark Artist correct" }).click();
  await page.getByRole("button", { name: "Next song" }).click();

  const heldCard = page.locator("[data-song-guess-reveal-held]");

  // Host has moved on, the TV has not — yet.
  await expect(heldCard).toBeVisible();
  await expect(heldCard).toContainText(FIRST_SONG_TITLE);
  await expect(page.getByText(SECOND_SONG_TITLE)).toHaveCount(1);
  await expect(page.getByText("Song 2 of 4")).toHaveCount(1);

  // Then the window runs out and the display follows.
  await expect(heldCard).toHaveCount(0);
  await expect(page.locator("[data-song-guess-reveal]")).toHaveCount(0);
  await expect(page.getByText("Song 2 of 4")).toHaveCount(2);
  await expect(page.getByText("Listen closely…")).toBeVisible();
});

// The failure mode no unit test can see: there is no dev proxy in this repo, so
// a root-relative src resolves against the Vite origin and 404s on the TV.
// Deliberately port-agnostic — it compares the clip origin against the page's
// OWN origin rather than hardcoding 3100/5273.
test("display clip src is an absolute url on the server origin", async ({ page }) => {
  await page.goto(devSandboxPath("song-guess"));

  const clipAudio = page.locator("audio[data-song-guess-audio]");

  await expect(clipAudio).toHaveCount(1);
  await expect(clipAudio).toHaveAttribute("src", /.+/);

  const src = await clipAudio.getAttribute("src");

  expect(src).not.toBeNull();

  const clipUrl = new URL(src as string);
  const pageOrigin = new URL(page.url()).origin;

  expect(clipUrl.origin).not.toBe(pageOrigin);
  expect(clipUrl.pathname.startsWith(`${SONG_GUESS_AUDIO_ROUTE_PATH}/`)).toBe(true);
});

test("the sandbox reset button restores a fresh set", async ({ page }) => {
  await page.goto(devSandboxPath("song-guess"));

  await page.getByRole("button", { name: "Play clip" }).click();
  await page.getByRole("button", { name: "Pause" }).click();
  await page.getByRole("button", { name: "Reveal answer" }).click();
  await page.getByRole("button", { name: "Mark Title correct" }).click();

  await expect(page.getByText("+1 pending")).toBeVisible();

  await page.getByRole("button", { name: "Reset", exact: true }).click();

  await expect(page.getByText("Song 1 of 4")).toHaveCount(2);
  await expect(page.getByText("Listen closely…")).toBeVisible();
  await expect(page.getByText("+1 pending")).toHaveCount(0);
});
