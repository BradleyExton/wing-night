import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { NetworkInterfaceInfo } from "node:os";
import test from "node:test";

import { LAN_ADDRESSES_ROUTE_PATH } from "@wingnight/shared";

import { createApp } from "../../createApp/index.js";
import { listLanAddresses } from "./index.js";

const ipv4 = (address: string, internal = false): NetworkInterfaceInfo => ({
  address,
  netmask: "255.255.255.0",
  family: "IPv4",
  mac: "00:00:00:00:00:00",
  internal,
  cidr: `${address}/24`
});

const ipv6 = (address: string): NetworkInterfaceInfo => ({
  address,
  netmask: "ffff:ffff:ffff:ffff::",
  family: "IPv6",
  mac: "00:00:00:00:00:00",
  internal: false,
  cidr: `${address}/64`,
  scopeid: 0
});

test("does list external IPv4 addresses with the home-network ranges first", () => {
  assert.deepEqual(
    listLanAddresses({
      lo0: [ipv4("127.0.0.1", true)],
      utun4: [ipv4("100.101.102.103")],
      en0: [ipv6("fe80::1"), ipv4("192.168.1.23")],
      bridge0: [ipv4("172.20.0.1")],
      en5: [ipv4("169.254.12.34")]
    }),
    { addresses: ["192.168.1.23", "172.20.0.1", "100.101.102.103"] }
  );
});

test("does list nothing when the machine is on no network", () => {
  assert.deepEqual(listLanAddresses({ lo0: [ipv4("127.0.0.1", true)], en0: undefined }), {
    addresses: []
  });
});

test("does answer cross-origin with the machine's addresses", async () => {
  const server: Server = createApp({ hostControlToken: "test-token" }).listen(0, "127.0.0.1");

  try {
    await once(server, "listening");

    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}${LAN_ADDRESSES_ROUTE_PATH}`);
    const body = (await response.json()) as { addresses: unknown };

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
    assert.ok(Array.isArray(body.addresses));
  } finally {
    server.close();
  }
});
