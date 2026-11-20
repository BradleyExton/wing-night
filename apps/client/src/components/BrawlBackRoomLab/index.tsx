import { useState } from "react";

import { Controls } from "./Controls";
import { Stage } from "./Stage";
import type { BackRoomSettings } from "./backRoom";
import { brawlBackRoomLabCopy } from "./copy";
import * as styles from "./styles";

const copy = brawlBackRoomLabCopy;

const DEFAULT_SETTINGS: BackRoomSettings = {
  mode: "carry",
  staff: "few",
  clockSeconds: 120,
  isChargeOn: true,
  crew: 3,
  humans: 1,
  seed: 20261001
};

/**
 * PROTOTYPE — throwaway (docs/minigames/ideas/brawl-back-room-finale.md §7). The finale idea for
 * Streets of Barrie, playable: the real crew sim's last block with a sleeping body to get out of
 * the back door, on flat shapes. Deleted when Brad has played it and the idea is either a spec or
 * dropped.
 */
export const BrawlBackRoomLab = (): JSX.Element => {
  const [settings, setSettings] = useState<BackRoomSettings>(DEFAULT_SETTINGS);
  const [runKey, setRunKey] = useState(0);

  return (
    <main className={styles.container}>
      <div className={styles.headingBlock}>
        <h1 className={styles.heading}>{copy.title}</h1>
        <p className={styles.description}>{copy.description}</p>
      </div>

      <div className={styles.layout}>
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <span className={styles.cardLabel}>{copy.stageLabel}</span>
          </header>
          <div className={styles.stageViewport}>
            <Stage settings={settings} runKey={runKey} />
          </div>
        </section>

        <aside className={styles.side}>
          <div className={styles.panel}>
            <span className={styles.cardLabel}>{copy.controlsLabel}</span>
            <Controls settings={settings} onChange={setSettings} />
            <button
              type="button"
              className={styles.button}
              onClick={(): void => {
                setRunKey((previous) => previous + 1);
              }}
            >
              {copy.restart}
            </button>
          </div>
          <div className={styles.panel}>
            <span className={styles.cardLabel}>{copy.howLabel}</span>
            <ul className={styles.howList}>
              {copy.how.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className={styles.notes}>{copy.notes}</p>
          </div>
        </aside>
      </div>
    </main>
  );
};
