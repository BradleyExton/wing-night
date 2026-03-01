import * as styles from "./styles";
import { routeNotFoundCopy } from "./copy";

export const RouteNotFound = (): JSX.Element => {
  return (
    <main className={styles.container}>
      <div>
        <h1 className={styles.heading}>{routeNotFoundCopy.title}</h1>
        <p className={styles.subtext}>{routeNotFoundCopy.description}</p>
      </div>
    </main>
  );
};
