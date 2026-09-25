import { MINIGAME_TYPES, resolveMinigameDefinition } from "@wingnight/shared";

import { resolveMinigameBriefingContent } from "../../copy/minigameBriefings";
import { devRouteIndexCopy } from "./copy";
import * as styles from "./styles";

// Derived from MINIGAME_TYPES rather than hand-listed, so a newly registered
// minigame shows up here without touching this component.
const resolveMinigameSandboxEntries = (): {
  href: string;
  label: string;
  detail: string;
  illustrationPath: string;
  illustrationAlt: string;
}[] => {
  return MINIGAME_TYPES.map((minigameType) => {
    const { slug, displayName } = resolveMinigameDefinition(minigameType);
    // Non-null: the briefing map is Record<MinigameType, ...>, and every
    // resolver falls back to its own defaults when no game config is loaded.
    const briefing = resolveMinigameBriefingContent(minigameType, null);

    return {
      href: `/dev/minigame/${slug}`,
      label: displayName,
      detail: briefing?.summary ?? "",
      illustrationPath: briefing?.illustrationPath ?? "",
      illustrationAlt: briefing?.illustrationAlt ?? ""
    };
  });
};

export const DevRouteIndex = (): JSX.Element => {
  const minigameEntries = resolveMinigameSandboxEntries();

  return (
    <main className={styles.container}>
      <div className={styles.atmosphere} aria-hidden />
      <div className={styles.atmosphereGlowPrimary} aria-hidden />

      <section className={styles.content}>
        <header className={styles.brandRow}>
          <img
            className={styles.brandMark}
            src={devRouteIndexCopy.brandMarkPath}
            alt={devRouteIndexCopy.brandMarkAlt}
          />
          <span className={styles.brandLabel}>{devRouteIndexCopy.brandLabel}</span>
        </header>

        <p className={styles.eyebrow}>{devRouteIndexCopy.eyebrow}</p>
        <h1 className={styles.title}>{devRouteIndexCopy.title}</h1>
        <p className={styles.description}>{devRouteIndexCopy.description}</p>

        <p className={styles.sectionLabel}>{devRouteIndexCopy.minigameSectionLabel}</p>
        <nav className={styles.rail} aria-label={devRouteIndexCopy.minigameNavLabel}>
          {minigameEntries.map((entry) => {
            return (
              <a key={entry.href} href={entry.href} className={styles.routeCard}>
                <img
                  className={styles.routeThumb}
                  src={entry.illustrationPath}
                  alt={entry.illustrationAlt}
                />
                <span className={styles.routeBody}>
                  <span className={styles.routeHeaderRow}>
                    <span className={styles.routeLabel}>{entry.label}</span>
                    <span className={styles.routePath}>{entry.href}</span>
                  </span>
                  <span className={styles.routeDetail}>{entry.detail}</span>
                </span>
              </a>
            );
          })}
        </nav>

        <p className={styles.sectionLabel}>{devRouteIndexCopy.labSectionLabel}</p>
        <nav className={styles.rail} aria-label={devRouteIndexCopy.labNavLabel}>
          {devRouteIndexCopy.labs.map((lab) => {
            return (
              <a key={lab.href} href={lab.href} className={styles.routeCard}>
                <span className={styles.routeBody}>
                  <span className={styles.routeHeaderRow}>
                    <span className={styles.routeLabel}>{lab.label}</span>
                    <span className={styles.routePath}>{lab.href}</span>
                  </span>
                  <span className={styles.routeDetail}>{lab.detail}</span>
                </span>
              </a>
            );
          })}
        </nav>

        <a className={styles.homeLink} href="/">
          {devRouteIndexCopy.homeLinkLabel}
        </a>
      </section>
    </main>
  );
};
