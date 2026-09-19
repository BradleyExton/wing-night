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

  // Now both surfaces carry it.
  await expect(page.getByText(FIRST_SONG_TITLE)).toHaveCount(2);
  await expect(page.getByText(FIRST_SONG_ARTIST)).toHaveCount(2);

  // A point each for the title and the original artist.
  await page.getByRole("button", { name: "Mark Title correct" }).click();
  await expect(page.getByText("+1 pending")).toBeVisible();

  await page.getByRole("button", { name: "Mark Artist correct" }).click();
  await expect(page.getByText("+2 pending")).toBeVisible();

  // Advancing restores the replay allowance and moves both previews on.
  await page.getByRole("button", { name: "Next song" }).click();

  await expect(page.getByText("Song 2 of 4")).toHaveCount(2);
  await expect(page.getByText(SECOND_SONG_TITLE)).toHaveCount(1);
  await expect(replayButton).toBeDisabled();
  await expect(page.getByText("Listen closely…")).toBeVisible();

  expect(socketRequests).toHaveLength(0);
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
