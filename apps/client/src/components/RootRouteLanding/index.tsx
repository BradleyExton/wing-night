import { rootRouteLandingCopy } from "./copy";
import * as styles from "./styles";

export const RootRouteLanding = (): JSX.Element => {
  return (
    <main className={styles.container}>
      <section className={styles.panel}>
        <p className={styles.eyebrow}>{rootRouteLandingCopy.eyebrow}</p>
        <h1 className={styles.title}>{rootRouteLandingCopy.title}</h1>
        <p className={styles.description}>{rootRouteLandingCopy.description}</p>
        <nav className={styles.actionGrid} aria-label="Role routes">
          {rootRouteLandingCopy.actions.map((action) => {
            const toneClassName =
              action.tone === "PRIMARY"
                ? styles.actionCardPrimary
                : styles.actionCardSecondary;

            return (
              <a
                key={action.href}
                href={action.href}
                className={`${styles.actionCardBase} ${toneClassName}`}
              >
                <span className={styles.actionLabel}>{action.label}</span>
                <span className={styles.actionDetail}>{action.detail}</span>
              </a>
            );
          })}
        </nav>
      </section>
    </main>
  );
};
