const HOST_SECRET_STORAGE_KEY = "wingnight.hostSecret";

type HostSecretStorageBackend = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

const resolveStorageBackend = (): HostSecretStorageBackend | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
};

export const saveHostSecret = (
  hostSecret: string,
  storageBackend: HostSecretStorageBackend | null = resolveStorageBackend()
): void => {
  if (!storageBackend) {
    return;
  }

  storageBackend.setItem(HOST_SECRET_STORAGE_KEY, hostSecret);
};

export const readHostSecret = (
  storageBackend: HostSecretStorageBackend | null = resolveStorageBackend()
): string | null => {
  if (!storageBackend) {
    return null;
  }

  const hostSecret = storageBackend.getItem(HOST_SECRET_STORAGE_KEY);

  if (!hostSecret || hostSecret.trim().length === 0) {
    return null;
  }

  return hostSecret;
};

export const clearHostSecret = (
  storageBackend: HostSecretStorageBackend | null = resolveStorageBackend()
): void => {
  if (!storageBackend) {
    return;
  }

  storageBackend.removeItem(HOST_SECRET_STORAGE_KEY);
};
