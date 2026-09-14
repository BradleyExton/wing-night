import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import test from "node:test";
import type { AddressInfo } from "node:net";

import { TEAM_AUDIO_ROUTE_PATH } from "@wingnight/shared";

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
