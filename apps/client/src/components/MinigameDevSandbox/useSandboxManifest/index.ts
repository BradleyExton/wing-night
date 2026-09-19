import { useEffect, useState } from "react";
import {
  isMinigameDevManifest,
  type MinigameDevManifest
} from "@wingnight/minigames-core";
import {
  resolveDevSandboxManifestUrl,
  resolveMinigameDefinition,
  type MinigameType
} from "@wingnight/shared";

import { useServerOrigin } from "../../../utils/useServerOrigin";

// Which roster, teams and prompt bank the previews were drawn from. Three
// states rather than two, because "I asked for the fixture" and "the pack is
// gone" are the same picture on screen and very different news.
export type SandboxManifestSource = "pack" | "fixtureRequested" | "fixtureFallback";

export type SandboxManifest = {
  manifest: MinigameDevManifest;
  source: SandboxManifestSource;
  // Threaded back out so the previews and the fetch agree on one origin; the
  // display surface needs it to address the pack's images.
  serverOrigin: string | null;
};

export const SANDBOX_SEED_QUERY_KEY = "seed";
export const SANDBOX_SEED_FIXTURE_VALUE = "fixture";

// `?seed=fixture` pins the sandbox to the package's bundled fixture. The e2e
// sandbox specs ask for it: they use the fixture as a designed scenario — a
// twelve-player, four-team room is what gives JOUST a lane worth racking — and
// a spec that read whatever pack the server happened to have would be asserting
// on content it does not own.
export const isFixturePinnedByQuery = (search: string): boolean => {
  const normalizedSearch = search.startsWith("?") ? search.slice(1) : search;

  return (
    new URLSearchParams(normalizedSearch).get(SANDBOX_SEED_QUERY_KEY) ===
    SANDBOX_SEED_FIXTURE_VALUE
  );
};

// Seeds the sandbox from the running server's content pack — the party's own
// roster, teams and prompt bank — and falls back to the package's bundled
// fixture whenever that cannot be had.
//
// The fixture is what renders FIRST, always: `serverOrigin` is only known on
// the effect pass, and the sandbox's own tests render it with
// `renderToStaticMarkup`, where no effect ever runs. So the pack is a swap
// onto a sandbox that was already usable, not a gate in front of one.
export const useSandboxManifest = (
  minigameType: MinigameType,
  fixtureManifest: MinigameDevManifest
): SandboxManifest => {
  const serverOrigin = useServerOrigin();
  const [packManifest, setPackManifest] = useState<MinigameDevManifest | null>(null);
  const [isFixturePinned, setIsFixturePinned] = useState(false);
  const { slug } = resolveMinigameDefinition(minigameType);

  useEffect(() => {
    // Read in the effect, not at render scope: `window` does not exist under
    // `react-dom/server`, which is how this component is tested.
    if (isFixturePinnedByQuery(window.location.search)) {
      setIsFixturePinned(true);
      return;
    }

    const manifestUrl = resolveDevSandboxManifestUrl(slug, serverOrigin);

    if (manifestUrl === null) {
      return;
    }

    // Guards the swap against a slow response landing after the sandbox has
    // navigated to another game — a real navigation here, but the effect can
    // also re-run when the origin resolves.
    const abortController = new AbortController();

    const loadPackManifest = async (): Promise<void> => {
      try {
        const response = await fetch(manifestUrl, { signal: abortController.signal });

        if (!response.ok) {
          return;
        }

        const payload: unknown = await response.json();

        if (!isMinigameDevManifest(payload)) {
          return;
        }

        setPackManifest(payload);
      } catch {
        // No pack, no server, or a malformed one: the bundled fixture already
        // on screen stays, which is the whole point of loading it first.
      }
    };

    void loadPackManifest();

    return (): void => {
      abortController.abort();
    };
  }, [slug, serverOrigin]);

  if (packManifest !== null) {
    return { manifest: packManifest, source: "pack", serverOrigin };
  }

  return {
    manifest: fixtureManifest,
    source: isFixturePinned ? "fixtureRequested" : "fixtureFallback",
    serverOrigin
  };
};
