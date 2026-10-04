import assert from "node:assert/strict";
import test from "node:test";

import {
  clearHostControlToken,
  consumeHostControlToken,
  readHostControlToken,
  saveHostControlToken
} from "./index";

type StorageBackend = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const createStorageBackend = (): StorageBackend => {
  const store = new Map<string, string>();

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    }
  };
};

type FakeBrowser = Parameters<typeof consumeHostControlToken>[1] & {
  replacedUrls: string[];
};

const createBrowser = (
  href: string,
  storageBackend: StorageBackend,
  configuredToken: string | null = null
): FakeBrowser => {
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
    configuredToken,
    replacedUrls
  };
};

test("does prefer the URL's token when the query, storage and build all carry one", () => {
  const storageBackend = createStorageBackend();
  saveHostControlToken("stored-token", storageBackend);
  const browser = createBrowser(
    "http://192.168.1.23:5173/host?hostToken=query-token",
    storageBackend,
    "env-token"
  );

  assert.equal(consumeHostControlToken("env-token", browser), "query-token");
  assert.equal(readHostControlToken(storageBackend), "query-token");
});

test("does fall back to the stored token when the URL carries none", () => {
  const storageBackend = createStorageBackend();
  saveHostControlToken("stored-token", storageBackend);
  const browser = createBrowser("http://192.168.1.23:5173/host", storageBackend, "env-token");

  assert.equal(consumeHostControlToken("env-token", browser), "stored-token");
  assert.deepEqual(browser.replacedUrls, []);
});

test("does fall back to the build's token when nothing else is there", () => {
  const storageBackend = createStorageBackend();

  assert.equal(
    consumeHostControlToken("env-token", createBrowser("http://localhost:5173/host", storageBackend, "env-token")),
    "env-token"
  );
  assert.equal(
    consumeHostControlToken(null, createBrowser("http://localhost:5173/host", storageBackend)),
    null
  );
});

test("does strip the token from the address bar when the URL carries one", () => {
  const browser = createBrowser(
    "http://192.168.1.23:5173/host?hostToken=query-token&debug=1#rail",
    createStorageBackend()
  );

  consumeHostControlToken(null, browser);

  assert.deepEqual(browser.replacedUrls, ["/host?debug=1#rail"]);
});

test("does strip a blank token from the URL without storing it", () => {
  const storageBackend = createStorageBackend();
  const browser = createBrowser("http://192.168.1.23:5173/admin?hostToken=", storageBackend);

  assert.equal(consumeHostControlToken(null, browser), null);
  assert.deepEqual(browser.replacedUrls, ["/admin"]);
  assert.equal(readHostControlToken(storageBackend), null);
});

test("does forget the stored token when it is cleared", () => {
  const storageBackend = createStorageBackend();
  saveHostControlToken("stale-token", storageBackend);

  clearHostControlToken(storageBackend);

  assert.equal(readHostControlToken(storageBackend), null);
});

test("does nothing harmful when there is no storage backend", () => {
  saveHostControlToken("token", null);
  clearHostControlToken(null);

  assert.equal(readHostControlToken(null), null);
});
