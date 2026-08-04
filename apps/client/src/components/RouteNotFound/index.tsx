import * as styles from "./styles";
import { routeNotFoundCopy } from "./copy";

export const RouteNotFound = (): JSX.Element => {
  return (
    <main className={styles.container}>
      <div className={styles.atmosphere} aria-hidden />
      <div className={styles.atmosphereGlowPrimary} aria-hidden />
      <div>
        <p className={styles.kicker}>{routeNotFoundCopy.kicker}</p>
        <h1 className={styles.heading}>{routeNotFoundCopy.title}</h1>
        <p className={styles.subtext}>{routeNotFoundCopy.description}</p>
        <a className={styles.homeLink} href="/">
          {routeNotFoundCopy.homeLinkLabel}
        </a>
      </div>
    </main>
  );
};
