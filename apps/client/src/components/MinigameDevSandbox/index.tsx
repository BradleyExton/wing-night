import { Suspense, lazy } from "react";
import type { MinigameType } from "@wingnight/shared";

import { minigameDevSandboxCopy } from "./copy";
import * as styles from "./styles";

type MinigameDevSandboxProps = {
  minigameType: MinigameType;
};

// The stage is the only thing in the client that touches the dev registry — the
// dev manifests and the server's runtime plugins. Loading it lazily is what
// keeps that weight out of the chunk the tablet and the TV download at the
// party; this shell is the chrome around the boundary, and only the /dev
// minigame route ever renders it.
const SandboxStage = lazy(async () => {
  const { SandboxStage: LoadedSandboxStage } = await import("./SandboxStage");

  return { default: LoadedSandboxStage };
});

export const MinigameDevSandbox = ({
  minigameType
}: MinigameDevSandboxProps): JSX.Element => {
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
        <p className={styles.description}>{minigameDevSandboxCopy.description}</p>
      </div>

      <Suspense
        fallback={
          <p className={styles.loadingNote}>{minigameDevSandboxCopy.loadingLabel}</p>
        }
      >
        <SandboxStage minigameType={minigameType} />
      </Suspense>
    </main>
  );
};
