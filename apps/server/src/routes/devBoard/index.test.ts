import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import test from "node:test";
import type { AddressInfo } from "node:net";

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

const withMountedBoard = async (
  handle: (baseUrl: string) => Promise<void>
): Promise<void> => {
  const previous = process.env.WN_DEV_BOARD;

  process.env.WN_DEV_BOARD = "1";

  const server = createApp().listen(0, "127.0.0.1");

  try {
    await once(server, "listening");

    const { port } = server.address() as AddressInfo;

    await handle(`http://127.0.0.1:${port}`);
  } finally {
    await closeServer(server);

    if (previous === undefined) {
      delete process.env.WN_DEV_BOARD;
    } else {
      process.env.WN_DEV_BOARD = previous;
    }
  }
};

// Regression test for a defect only the live browser check caught: the client
// and server are ALWAYS separate origins in this repo (no vite proxy exists),
// so without this header the browser blocks the board's own fetch and the page
// can only ever render its error state — while every same-process test passes.
test("sends an allow-origin header so a cross-origin client can read it", async () => {
  await withMountedBoard(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/dev/board`);

    assert.equal(response.headers.get("access-control-allow-origin"), "*");
  });
});

// The endpoint's contract, exercised against the real work CLI of whatever
// checkout the suite runs in: either it relays both payloads, or it reports 503
// naming the path it tried. A stack trace or a hang is neither.
test("answers with either both payloads or a 503 naming the resolved path", async () => {
  await withMountedBoard(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/dev/board`);
    const body = (await response.json()) as Record<string, unknown>;

    if (response.status === 200) {
      assert.ok("index" in body, "a 200 carries the index payload");
      assert.ok("next" in body, "a 200 carries the next payload");

      return;
    }

    assert.equal(response.status, 503);
    assert.equal(typeof body.error, "string");
    assert.equal(typeof body.workCliPath, "string");
  });
});

// The diagnostic that matters when the sibling checkout isn't where the default
// expects it: a 503 must say which path was tried.
test("names the resolved CLI path when the CLI cannot be found", async () => {
  const previousWorkCli = process.env.WORK_CLI;

  process.env.WORK_CLI = "/tmp/wn26-definitely-not-a-real-work-cli.ts";

  try {
    await withMountedBoard(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/dev/board`);
      const body = (await response.json()) as { error?: string; workCliPath?: string };

      assert.equal(response.status, 503);
      assert.equal(body.workCliPath, "/tmp/wn26-definitely-not-a-real-work-cli.ts");
      assert.match(String(body.error), /not found/);
    });
  } finally {
    if (previousWorkCli === undefined) {
      delete process.env.WORK_CLI;
    } else {
      process.env.WORK_CLI = previousWorkCli;
    }
  }
});
