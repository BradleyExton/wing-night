import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import test from "node:test";
import type { AddressInfo } from "node:net";

import { SFX_TAKES_ROUTE_PATH } from "@wingnight/shared";

import { createContentRoot, writeContentFile } from "../../contentLoader/testHarness.js";
import { createApp } from "../../createApp/index.js";

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

const withApp = async (
  contentRootDir: string,
  handle: (baseUrl: string) => Promise<void>
): Promise<void> => {
  const server = createApp({ contentRootDir }).listen(0, "127.0.0.1");

  try {
    await once(server, "listening");

    const { port } = server.address() as AddressInfo;
    await handle(`http://127.0.0.1:${port}`);
  } finally {
    await closeServer(server);
  }
};

test("does group a game's takes by the cue before the dash when the pack has them", async () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "local/assets/sfx/joust/topple-2.mp3", "b");
  writeContentFile(contentRoot, "local/assets/sfx/joust/topple-1.mp3", "a");
  writeContentFile(contentRoot, "local/assets/sfx/joust/launch.wav", "c");
  writeContentFile(contentRoot, "local/assets/sfx/joust/notes.txt", "not a take");

  await withApp(contentRoot, async (baseUrl) => {
    const response = await fetch(`${baseUrl}${SFX_TAKES_ROUTE_PATH}/joust`);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
    assert.deepEqual(await response.json(), {
      takes: {
        topple: ["/content-assets/sfx/joust/topple-1.mp3", "/content-assets/sfx/joust/topple-2.mp3"],
        launch: ["/content-assets/sfx/joust/launch.wav"]
      }
    });
  });
});

test("does serve a listed take from the content-asset mount", async () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "local/assets/sfx/joust/topple-1.mp3", "slap");

  await withApp(contentRoot, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/content-assets/sfx/joust/topple-1.mp3`);

    assert.equal(response.status, 200);
    assert.equal(await response.text(), "slap");
  });
});

test("does let the pack's takes of a cue replace the sample's when both have them", async () => {
  const contentRoot = createContentRoot();

  writeContentFile(contentRoot, "local/assets/sfx/joust/topple-1.mp3", "pack");
  writeContentFile(contentRoot, "sample/assets/sfx/joust/topple-1.mp3", "sample");
  writeContentFile(contentRoot, "sample/assets/sfx/joust/topple-2.mp3", "sample");
  writeContentFile(contentRoot, "sample/assets/sfx/joust/creak-1.mp3", "sample");

  await withApp(contentRoot, async (baseUrl) => {
    const response = await fetch(`${baseUrl}${SFX_TAKES_ROUTE_PATH}/joust`);
    const listing = (await response.json()) as { takes: Record<string, string[]> };

    assert.deepEqual(listing.takes.topple, ["/content-assets/sfx/joust/topple-1.mp3"]);
    assert.deepEqual(listing.takes.creak, ["/content-assets/sfx/joust/creak-1.mp3"]);
  });
});

test("does answer an empty listing when nobody has recorded for the game", async () => {
  const contentRoot = createContentRoot();

  await withApp(contentRoot, async (baseUrl) => {
    const response = await fetch(`${baseUrl}${SFX_TAKES_ROUTE_PATH}/fappy`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { takes: {} });
  });
});

test("does refuse a game name that is not a slug", async () => {
  const contentRoot = createContentRoot();

  await withApp(contentRoot, async (baseUrl) => {
    const response = await fetch(`${baseUrl}${SFX_TAKES_ROUTE_PATH}/..%2F..%2Fetc`);

    assert.equal(response.status, 404);
  });
});
