import assert from "node:assert/strict";
import test from "node:test";

import {
  clearPlayerSeat,
  consumePlayerSeat,
  forgetPlayerClaim,
  readPlayerSeat,
  savePlayerClaim,
  savePlayerSeat
} from "./index";

type StorageBackend = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const createStorageBackend = (): StorageBackend & { raw: Map<string, string> } => {
  const raw = new Map<string, string>();

  return {
    raw,
    getItem: (key) => raw.get(key) ?? null,
    setItem: (key, value) => {
      raw.set(key, value);
    },
    removeItem: (key) => {
      raw.delete(key);
    }
  };
};

const createBrowser = (href: string, storageBackend: StorageBackend) => {
  const replacedUrls: string[] = [];

  return {
    location: { href },
    history: {
      state: null,
      replaceState: (_state: unknown, _unused: string, url?: string | URL | null) => {
        replacedUrls.push(String(url));
      }
    },
    storageBackend,
    replacedUrls
  };
};

test("does store the scanned token and strip it from the address bar when the URL carries one", () => {
  const storage = createStorageBackend();
  const browser = createBrowser("http://192.168.1.23:5173/play?t=tok-1&x=1#top", storage);

  assert.deepEqual(consumePlayerSeat(browser), {
    joinToken: "tok-1",
    claimSecret: null,
    playerId: null
  });
  assert.deepEqual(browser.replacedUrls, ["/play?x=1#top"]);
  assert.equal(readPlayerSeat(storage)?.joinToken, "tok-1");
});

test("does keep the claim when the phone scans the same code again", () => {
  const storage = createStorageBackend();

  savePlayerSeat({ joinToken: "tok-1", claimSecret: "sec", playerId: "player-2" }, storage);

  assert.deepEqual(consumePlayerSeat(createBrowser("http://h/play?t=tok-1", storage)), {
    joinToken: "tok-1",
    claimSecret: "sec",
    playerId: "player-2"
  });
});

test("does drop an old night's claim when the phone scans a new code", () => {
  const storage = createStorageBackend();

  savePlayerSeat({ joinToken: "tok-1", claimSecret: "sec", playerId: "player-2" }, storage);

  assert.deepEqual(consumePlayerSeat(createBrowser("http://h/play?t=tok-2", storage)), {
    joinToken: "tok-2",
    claimSecret: null,
    playerId: null
  });
  assert.equal(readPlayerSeat(storage)?.claimSecret, null);
});

test("does come back with the stored seat and touch no URL when the page reloads", () => {
  const storage = createStorageBackend();
  const browser = createBrowser("http://h/play", storage);

  assert.equal(consumePlayerSeat(browser), null);

  savePlayerSeat({ joinToken: "tok-1", claimSecret: null, playerId: null }, storage);
  savePlayerClaim("player-3", "sec-3", storage);

  assert.deepEqual(consumePlayerSeat(browser), {
    joinToken: "tok-1",
    claimSecret: "sec-3",
    playerId: "player-3"
  });
  assert.deepEqual(browser.replacedUrls, []);
});

test("does keep the join token when the claim is forgotten and drop everything when cleared", () => {
  const storage = createStorageBackend();

  savePlayerSeat({ joinToken: "tok-1", claimSecret: "sec", playerId: "player-1" }, storage);
  forgetPlayerClaim(storage);

  assert.deepEqual(readPlayerSeat(storage), { joinToken: "tok-1", claimSecret: null, playerId: null });

  clearPlayerSeat(storage);

  assert.equal(readPlayerSeat(storage), null);
});

test("does read nothing when storage holds junk or half a claim", () => {
  const storage = createStorageBackend();

  storage.raw.set("wingnight.playerSeat", "{not json");
  assert.equal(readPlayerSeat(storage), null);

  storage.raw.set("wingnight.playerSeat", JSON.stringify({ joinToken: "tok", claimSecret: "sec" }));
  assert.deepEqual(readPlayerSeat(storage), { joinToken: "tok", claimSecret: null, playerId: null });

  // No seat to attach a claim to: nothing is saved.
  storage.raw.clear();
  savePlayerClaim("player-1", "sec", storage);
  assert.equal(readPlayerSeat(storage), null);
});
