import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import test from "node:test";
import type { AddressInfo } from "node:net";

import {
  CONTENT_ASSET_ROUTE_PATH,
  LOBBY_AUDIO_ROUTE_PATH,
  SONG_GUESS_AUDIO_ROUTE_PATH,
  TEAM_AUDIO_ROUTE_PATH
} from "@wingnight/shared";

import {
  createContentRoot,
  writeContentFile
} from "../contentLoader/testHarness.js";
import { createApp } from "./index.js";

const closeServer = async (server: Server): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
};

// `contentRootDir` is optional so every pre-existing caller stays unchanged.
const withApp = async (
  handle: (baseUrl: string) => Promise<void>,
  contentRootDir?: string
): Promise<void> => {
  const server = createApp(
    contentRootDir === undefined ? {} : { contentRootDir }
  ).listen(0, "127.0.0.1");

  try {
    await once(server, "listening");

    const { port } = server.address() as AddressInfo;

    await handle(`http://127.0.0.1:${port}`);
  } finally {
    await closeServer(server);
  }
};

test("does let a display on another origin read its media when it asks with CORS", async () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "sample/teams/audio/blaze.mp3", "sample-bytes");
  writeContentFile(contentRoot, "local/audio/lobby/opener.mp3", "lobby-bytes");

  await withApp(async (baseUrl) => {
    const anthem = await fetch(`${baseUrl}${TEAM_AUDIO_ROUTE_PATH}/blaze.mp3`);
    const lobby = await fetch(`${baseUrl}${LOBBY_AUDIO_ROUTE_PATH}/opener.mp3`);
    const health = await fetch(`${baseUrl}/health`);

    assert.equal(anthem.headers.get("access-control-allow-origin"), "*");
    assert.equal(lobby.headers.get("access-control-allow-origin"), "*");
    assert.equal(health.headers.get("access-control-allow-origin"), null);
  }, contentRoot);
});

test("serves a team anthem from the sample content root", async () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "sample/teams/audio/blaze.mp3", "sample-bytes");

  await withApp(async (baseUrl) => {
    const response = await fetch(`${baseUrl}${TEAM_AUDIO_ROUTE_PATH}/blaze.mp3`);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "audio/mpeg");
  }, contentRoot);
});

// The reason the route is mounted TWICE, local first. Without the ordering this
// is the case that goes red — nothing else here would notice.
test("prefers the local anthem when the same filename exists under sample", async () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "sample/teams/audio/blaze.mp3", "sample-bytes");
  writeContentFile(contentRoot, "local/teams/audio/blaze.mp3", "local-bytes");

  await withApp(async (baseUrl) => {
    const response = await fetch(`${baseUrl}${TEAM_AUDIO_ROUTE_PATH}/blaze.mp3`);

    assert.equal(await response.text(), "local-bytes");
  }, contentRoot);
});

// The local directory is absent entirely here — the common case on a fresh
// clone, since content/local is gitignored.
test("falls through to a 404 when the anthem file is missing", async () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "sample/teams/audio/blaze.mp3", "sample-bytes");

  await withApp(async (baseUrl) => {
    const response = await fetch(`${baseUrl}${TEAM_AUDIO_ROUTE_PATH}/missing.mp3`);

    assert.equal(response.status, 404);
  }, contentRoot);
});

test("keeps /health mounted alongside the team-audio route", async () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "sample/teams/audio/blaze.mp3", "sample-bytes");

  await withApp(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);

    assert.equal(response.status, 200);
  }, contentRoot);
});

const SONG_AUDIO_PATH = "sample/minigames/song-guess/audio/creep.mp3";

test("serves a song guess clip from the sample content root", async () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, SONG_AUDIO_PATH, "sample-bytes");

  await withApp(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}${SONG_GUESS_AUDIO_ROUTE_PATH}/creep.mp3`
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "audio/mpeg");
  }, contentRoot);
});

// The event-night case: the pack ships as JSON with no audio, and the host
// drops their own MP3s into content/local.
test("prefers the local song clip when the same filename exists under sample", async () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, SONG_AUDIO_PATH, "sample-bytes");
  writeContentFile(
    contentRoot,
    "local/minigames/song-guess/audio/creep.mp3",
    "local-bytes"
  );

  await withApp(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}${SONG_GUESS_AUDIO_ROUTE_PATH}/creep.mp3`
    );

    assert.equal(await response.text(), "local-bytes");
  }, contentRoot);
});

// The default state of a fresh clone: the pack lists songs, no audio exists.
test("falls through to a 404 when the host has not supplied the clip", async () => {
  const contentRoot = createContentRoot();

  await withApp(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}${SONG_GUESS_AUDIO_ROUTE_PATH}/creep.mp3`
    );

    assert.equal(response.status, 404);
  }, contentRoot);
});

test("keeps the song-audio and team-audio routes independent", async () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, SONG_AUDIO_PATH, "song-bytes");
  writeContentFile(contentRoot, "sample/teams/audio/creep.mp3", "anthem-bytes");

  await withApp(async (baseUrl) => {
    const songResponse = await fetch(
      `${baseUrl}${SONG_GUESS_AUDIO_ROUTE_PATH}/creep.mp3`
    );
    const anthemResponse = await fetch(
      `${baseUrl}${TEAM_AUDIO_ROUTE_PATH}/creep.mp3`
    );

    assert.equal(await songResponse.text(), "song-bytes");
    assert.equal(await anthemResponse.text(), "anthem-bytes");
  }, contentRoot);
});

// The pack's images — generated heads and party photos — are served by the
// server, not by Vite: the display is always a different origin, so a
// client-served root-relative URL 404s on the TV.
test("serves a pack image from the local content layer", async () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "local/assets/avatars/rob.png", "head-bytes");

  await withApp(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}${CONTENT_ASSET_ROUTE_PATH}/avatars/rob.png`
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.equal(await response.text(), "head-bytes");
  }, contentRoot);
});

test("falls back to the sample layer when the pack has no image of that name", async () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "sample/assets/geo/eiffel.svg", "sample-bytes");

  await withApp(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}${CONTENT_ASSET_ROUTE_PATH}/geo/eiffel.svg`
    );

    assert.equal(response.status, 200);
    assert.equal(await response.text(), "sample-bytes");
  }, contentRoot);
});

// Same local-wins rule the loaders follow, so a pack that replaces a photo
// replaces the one the room actually sees.
test("prefers the local image when both layers carry that name", async () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "local/assets/geo/cottage.jpg", "local-bytes");
  writeContentFile(contentRoot, "sample/assets/geo/cottage.jpg", "sample-bytes");

  await withApp(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}${CONTENT_ASSET_ROUTE_PATH}/geo/cottage.jpg`
    );

    assert.equal(await response.text(), "local-bytes");
  }, contentRoot);
});

test("responds 404 when no layer carries the requested image", async () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "local/assets/avatars/rob.png", "head-bytes");

  await withApp(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}${CONTENT_ASSET_ROUTE_PATH}/avatars/absent.png`
    );

    assert.equal(response.status, 404);
  }, contentRoot);
});
