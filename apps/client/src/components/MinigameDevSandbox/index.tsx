import type { MinigameType } from "@wingnight/shared";

import {
  resolveMinigameDevManifest,
  resolveMinigameRendererBundle,
  resolveMinigameRuntimePlugin
} from "../../minigames/registry";
import { SandboxStage } from "./SandboxStage";
import { useSandboxManifest } from "./useSandboxManifest";
import { minigameDevSandboxCopy } from "./copy";
import * as styles from "./styles";

type MinigameDevSandboxProps = {
  minigameType: MinigameType;
};

export const MinigameDevSandbox = ({
  minigameType
}: MinigameDevSandboxProps): JSX.Element => {
  const fixtureManifest = resolveMinigameDevManifest(minigameType);
  const rendererBundle = resolveMinigameRendererBundle(minigameType);
  const runtimePlugin = resolveMinigameRuntimePlugin(minigameType);

  if (fixtureManifest === null || rendererBundle === null || runtimePlugin === null) {
    return (
      <main className={styles.container}>
        <div className={styles.headingBlock}>
          <h1 className={styles.heading}>{minigameDevSandboxCopy.title}</h1>
          <p className={styles.description}>
            {rendererBundle === null
              ? minigameDevSandboxCopy.noRendererLabel
              : minigameDevSandboxCopy.noRuntimeLabel}
          </p>
        </div>
      </main>
    );
  }

  return (
    <SeededSandbox
      minigameType={minigameType}
      fixtureManifest={fixtureManifest}
      rendererBundle={rendererBundle}
      runtimePlugin={runtimePlugin}
    />
  );
};

type SeededSandboxProps = {
  minigameType: MinigameType;
  fixtureManifest: NonNullable<ReturnType<typeof resolveMinigameDevManifest>>;
  rendererBundle: NonNullable<ReturnType<typeof resolveMinigameRendererBundle>>;
  runtimePlugin: NonNullable<ReturnType<typeof resolveMinigameRuntimePlugin>>;
};

// Split from the component above so the manifest hook is never called behind
// the unregistered-minigame early return, which would be a conditional hook.
const SeededSandbox = ({
  minigameType,
  fixtureManifest,
  rendererBundle,
  runtimePlugin
}: SeededSandboxProps): JSX.Element => {
  const { manifest, source, serverOrigin } = useSandboxManifest(
    minigameType,
    fixtureManifest
  );

  return (
    <main className={styles.container}>
      <div className={styles.headingBlock}>
        <div className={styles.headingRow}>
          <h1 className={styles.heading}>{minigameDevSandboxCopy.title}</h1>
          <a
            className={styles.devIndexLink}
            href={minigameDevSandboxCopy.devIndexLinkHref}
          >
            {minigameDevSandboxCopy.devIndexLinkLabel}
          </a>
        </div>
        <p className={styles.description}>
          {minigameDevSandboxCopy.description}{" "}
          <span className={styles.contentSource}>
            {minigameDevSandboxCopy.contentSourceLabel[source]}
          </span>
        </p>
      </div>

      {/* Re-seeds the runtime when the pack lands, the way a navigation would:
          the two manifests do not share team ids, so the turn in progress
          cannot survive the swap. */}
      <SandboxStage
        key={source}
        minigameType={minigameType}
        devManifest={manifest}
        rendererBundle={rendererBundle}
        runtimePlugin={runtimePlugin}
        serverOrigin={serverOrigin}
      />
    </main>
  );
};
