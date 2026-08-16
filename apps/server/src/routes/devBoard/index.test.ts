import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtempSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

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

const withWorkCliEnv = async (value: string, run: () => Promise<void>): Promise<void> => {
  const previous = process.env.WORK_CLI;

  process.env.WORK_CLI = value;

  try {
    await run();
  } finally {
    if (previous === undefined) {
      delete process.env.WORK_CLI;
    } else {
      process.env.WORK_CLI = previous;
    }
  }
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

// Pinned against a FAKE CLI rather than whatever sibling checkout happens to
// exist on the machine: branching on the environment would leave the relay shape
// — the endpoint's actual contract — unexercised wherever the real CLI is absent.
test("relays both CLI payloads under their own keys", async () => {
  const directory = mkdtempSync(join(tmpdir(), "wn26-route-cli-"));
  const cliPath = join(directory, "fake-work.mjs");

  writeFileSync(
    cliPath,
    'const command = process.argv[2];\n' +
      'process.stdout.write(JSON.stringify({ ok: true, command }));\n',
    "utf8"
  );

  await withWorkCliEnv(cliPath, async () => {
    await withMountedBoard(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/dev/board`);

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        index: { ok: true, command: "index" },
        next: { ok: true, command: "next" }
      });
    });
  });
});

// One CLI call failing must fail the whole response rather than half-answering
// with a null the client would have to guess at.
test("reports 503 when only one of the two CLI calls fails", async () => {
  const directory = mkdtempSync(join(tmpdir(), "wn26-route-half-"));
  const cliPath = join(directory, "half-work.mjs");

  writeFileSync(
    cliPath,
    'if (process.argv[2] === "next") { process.exit(4); }\n' +
      'process.stdout.write(JSON.stringify({ ok: true }));\n',
    "utf8"
  );

  await withWorkCliEnv(cliPath, async () => {
    await withMountedBoard(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/dev/board`);

      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), {
        error: "work CLI failed",
        workCliPath: cliPath
      });
    });
  });
});

// The diagnostic that matters when the sibling checkout isn't where the default
// expects it: a 503 must say which path was tried.
test("names the resolved CLI path when the CLI cannot be found", async () => {
  const missingCliPath = "/tmp/wn26-definitely-not-a-real-work-cli.ts";

  await withWorkCliEnv(missingCliPath, async () => {
    await withMountedBoard(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/dev/board`);
      const body = (await response.json()) as { error?: string; workCliPath?: string };

      assert.equal(response.status, 503);
      assert.equal(body.workCliPath, missingCliPath);
      assert.match(String(body.error), /not found/);
    });
  });
});
