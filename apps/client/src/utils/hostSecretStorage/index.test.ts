import assert from "node:assert/strict";
import test from "node:test";

import { clearHostSecret, readHostSecret, saveHostSecret } from "./index";

const createStorageBackend = (): Storage => {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear(): void {
      store.clear();
    },
    getItem(key: string): string | null {
      return store.get(key) ?? null;
    },
    key(index: number): string | null {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    setItem(key: string, value: string): void {
      store.set(key, value);
    }
  };
};

test("saves and reads host secret", () => {
  const storageBackend = createStorageBackend();

  saveHostSecret("test-host-secret", storageBackend);

  assert.equal(readHostSecret(storageBackend), "test-host-secret");
});

test("clearHostSecret removes stored host secret", () => {
  const storageBackend = createStorageBackend();

  saveHostSecret("test-host-secret", storageBackend);
  clearHostSecret(storageBackend);

  assert.equal(readHostSecret(storageBackend), null);
});

test("readHostSecret returns null for blank values", () => {
  const storageBackend = createStorageBackend();

  storageBackend.setItem("wingnight.hostSecret", "   ");

  assert.equal(readHostSecret(storageBackend), null);
});

test("storage helpers are safe without an available storage backend", () => {
  saveHostSecret("test-host-secret", null);
  clearHostSecret(null);

  assert.equal(readHostSecret(null), null);
});
