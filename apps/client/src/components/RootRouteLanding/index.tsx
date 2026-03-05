import { rootRouteLandingCopy } from "./copy";
import * as styles from "./styles";

export const RootRouteLanding = (): JSX.Element => {
  return (
    <main className={styles.container}>
      <div className={styles.atmosphere} aria-hidden />
      <div className={styles.atmosphereGlowPrimary} aria-hidden />
      <div className={styles.atmosphereGlowHeat} aria-hidden />
      <figure className={styles.heroBackdrop} aria-hidden>
        <img
          className={styles.heroMedia}
          src={rootRouteLandingCopy.heroIllustrationPath}
          alt={rootRouteLandingCopy.heroIllustrationAlt}
        />
      </figure>

      <section className={styles.content}>
        <header className={styles.brandRow}>
          <img
            className={styles.brandMark}
            src={rootRouteLandingCopy.brandMarkPath}
            alt={rootRouteLandingCopy.brandMarkAlt}
          />
          <span className={styles.brandLabel}>{rootRouteLandingCopy.brandLabel}</span>
        </header>

        <p className={styles.eyebrow}>{rootRouteLandingCopy.eyebrow}</p>
        <h1 className={styles.title}>{rootRouteLandingCopy.title}</h1>
        <p className={styles.description}>{rootRouteLandingCopy.description}</p>
        <p className={styles.selectionLabel}>{rootRouteLandingCopy.selectionLabel}</p>

        <nav className={styles.roleRail} aria-label="Role routes">
          {rootRouteLandingCopy.actions.map((action) => {
            const toneClassName =
              action.tone === "PRIMARY"
                ? styles.roleActionPrimary
                : styles.roleActionSecondary;

            return (
              <a
                key={action.href}
                href={action.href}
                className={`${styles.roleActionBase} ${toneClassName}`}
              >
                <div className={styles.roleActionHeaderRow}>
                  <span className={styles.roleActionLabel}>{action.label}</span>
                  <span className={styles.roleActionRoute}>{action.href}</span>
                </div>
                <span className={styles.roleActionDetail}>{action.detail}</span>
                <span className={styles.roleActionTarget}>{action.targetDevice}</span>
              </a>
            );
          })}
        </nav>
      </section>
    </main>
  );
};
