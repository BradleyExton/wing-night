import assert from "node:assert/strict";
import { once } from "node:events";
import { request, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";

import { HOST_JOIN_ROUTE_PATH } from "@wingnight/shared";

import { createApp } from "../../createApp/index.js";
import { resolveHostJoinAccess } from "./index.js";

const LAPTOP_HOST = "127.0.0.1:3000";

const withServer = async (handle: (port: number) => Promise<void>): Promise<void> => {
  const server: Server = createApp({ hostControlToken: "room-token" }).listen(0, "127.0.0.1");

  try {
    await once(server, "listening");
    await handle((server.address() as AddressInfo).port);
  } finally {
    server.close();
  }
};

type RawResponse = { status: number; allowOrigin: string | undefined; body: string };

// `fetch` will not let a caller set Host; `http.request` will, which is what a
// rebinded page's request looks like on the wire.
const getWithHeaders = (port: number, headers: Record<string, string>): Promise<RawResponse> =>
  new Promise((resolve, reject) => {
    const outgoing = request(
      { host: "127.0.0.1", port, path: HOST_JOIN_ROUTE_PATH, headers },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk: string) => {
          body += chunk;
        });
        response.on("end", () => {
          const allowOrigin = response.headers["access-control-allow-origin"];
          resolve({ status: response.statusCode ?? 0, allowOrigin, body });
        });
      }
    );
    outgoing.on("error", reject);
    outgoing.end();
  });

test("does refuse the token when the requester is on the LAN", () => {
  assert.deepEqual(
    resolveHostJoinAccess({ address: "192.168.1.40", host: "192.168.1.23:3000", origin: undefined }),
    { allowed: false }
  );
  assert.deepEqual(
    resolveHostJoinAccess({
      address: "::ffff:192.168.1.40",
      host: LAPTOP_HOST,
      origin: "http://localhost:5173"
    }),
    { allowed: false }
  );
  assert.deepEqual(resolveHostJoinAccess({ address: undefined, host: LAPTOP_HOST, origin: undefined }), {
    allowed: false
  });
});

test("does refuse the token when a loopback request comes from a foreign page", () => {
  for (const origin of [
    "https://evil.example",
    "http://192.168.1.23:5173",
    "http://127.evil.example",
    "null"
  ]) {
    assert.deepEqual(
      resolveHostJoinAccess({ address: "::ffff:127.0.0.1", host: LAPTOP_HOST, origin }),
      { allowed: false },
      origin
    );
  }
});

test("does refuse the token when a loopback request names a foreign Host and no Origin", () => {
  assert.deepEqual(
    resolveHostJoinAccess({ address: "::ffff:127.0.0.1", host: "attacker.example:3000", origin: undefined }),
    { allowed: false }
  );
});

test("does reflect the origin when a loopback request comes from a laptop page", () => {
  for (const origin of ["http://localhost:5173", "http://127.0.0.1:5273", "http://[::1]:5173"]) {
    assert.deepEqual(resolveHostJoinAccess({ address: "::1", host: "localhost:3000", origin }), {
      allowed: true,
      allowOrigin: origin
    });
  }
});

test("does answer with addresses and the token when the laptop asks", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}${HOST_JOIN_ROUTE_PATH}`, {
      headers: { Origin: "http://localhost:5173" }
    });
    const body = (await response.json()) as { addresses: unknown; hostControlToken: unknown };

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:5173");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.ok(Array.isArray(body.addresses));
    assert.equal(body.hostControlToken, "room-token");
  });
});

test("does answer 403 with no CORS header when a laptop request carries a foreign origin", async () => {
  await withServer(async (port) => {
    const response = await getWithHeaders(port, { Origin: "https://evil.example" });

    assert.equal(response.status, 403);
    assert.equal(response.allowOrigin, undefined);
    assert.equal(response.body.includes("room-token"), false);
  });
});

test("does answer 403 when a loopback request names a foreign Host and no Origin", async () => {
  await withServer(async (port) => {
    const rebound = await getWithHeaders(port, { Host: `attacker.example:${port}` });
    const laptop = await getWithHeaders(port, { Host: `localhost:${port}` });

    assert.equal(rebound.status, 403);
    assert.equal(rebound.body.includes("room-token"), false);
    assert.equal(laptop.status, 200);
    assert.equal(laptop.body.includes("room-token"), true);
  });
});
