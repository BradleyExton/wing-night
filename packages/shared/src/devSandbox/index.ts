// The route the server serves the dev sandbox's content-pack manifest from.
//
// Shared for the same reason `CONTENT_ASSET_ROUTE_PATH` is: the express mount
// and the sandbox's fetch have to agree on the string, so a rename is a
// typecheck failure instead of a sandbox that silently falls back to its
// bundled fixture.
export const DEV_SANDBOX_MANIFEST_ROUTE_PATH = "/dev/sandbox-manifest";

export const resolveDevSandboxManifestUrl = (
  minigameSlug: string,
  serverOrigin: string | null
): string | null => {
  if (serverOrigin === null || serverOrigin.trim().length === 0) {
    return null;
  }

  return `${serverOrigin.trim()}${DEV_SANDBOX_MANIFEST_ROUTE_PATH}/${encodeURIComponent(minigameSlug)}`;
};
