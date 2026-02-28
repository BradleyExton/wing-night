import * as styles from "./styles";
import { routeNotFoundCopy } from "./copy";

export const RouteNotFound = (): JSX.Element => {
  return (
    <main className={styles.container}>
      <section className={styles.panel}>
        <h1 className={styles.heading}>{routeNotFoundCopy.title}</h1>
        <p className={styles.subtext}>{routeNotFoundCopy.description}</p>
        <nav className={styles.linkGrid} aria-label="Recovery routes">
          {routeNotFoundCopy.actions.map((action) => {
            return (
              <a key={action.href} href={action.href} className={styles.linkCard}>
                <span className={styles.linkLabel}>{action.label}</span>
                <span className={styles.linkDetail}>{action.detail}</span>
              </a>
            );
          })}
        </nav>
      </section>
    </main>
  );
};
