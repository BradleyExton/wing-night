import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import test from "node:test";
import type { AddressInfo } from "node:net";

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

const withApp = async (handle: (baseUrl: string) => Promise<void>): Promise<void> => {
  const server = createApp().listen(0, "127.0.0.1");

  try {
    await once(server, "listening");

    const { port } = server.address() as AddressInfo;

    await handle(`http://127.0.0.1:${port}`);
  } finally {
    await closeServer(server);
  }
};

const withDevBoardEnv = async (value: string | undefined, run: () => Promise<void>): Promise<void> => {
  const previous = process.env.WN_DEV_BOARD;

  if (value === undefined) {
    delete process.env.WN_DEV_BOARD;
  } else {
    process.env.WN_DEV_BOARD = value;
  }

  try {
    await run();
  } finally {
    if (previous === undefined) {
      delete process.env.WN_DEV_BOARD;
    } else {
      process.env.WN_DEV_BOARD = previous;
    }
  }
};

// The load-bearing half of the gate. No script sets WN_DEV_BOARD, so this — the
// env absent — is the shape every real boot takes, party night included.
test("does not mount the dev board when WN_DEV_BOARD is unset", async () => {
  await withDevBoardEnv(undefined, async () => {
    await withApp(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/dev/board`);

      assert.equal(response.status, 404);
    });
  });
});

// The other direction, so the gate is proven to gate rather than merely to 404
// at a route that was never mounted under either setting.
test("mounts the dev board when WN_DEV_BOARD is 1", async () => {
  await withDevBoardEnv("1", async () => {
    await withApp(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/dev/board`);

      assert.notEqual(response.status, 404);
    });
  });
});

test("does not mount the dev board when WN_DEV_BOARD is some other value", async () => {
  await withDevBoardEnv("true", async () => {
    await withApp(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/dev/board`);

      assert.equal(response.status, 404);
    });
  });
});

// The gate must not cost the app its existing surface.
test("keeps /health mounted when the dev board is gated off", async () => {
  await withDevBoardEnv(undefined, async () => {
    await withApp(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`);

      assert.equal(response.status, 200);
    });
  });
});
