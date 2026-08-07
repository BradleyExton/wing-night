import * as styles from "./styles";

export const Embers = (): JSX.Element => {
  return (
    <div className={styles.container} aria-hidden>
      {styles.particles.map((particleClass, index) => (
        <span key={`ember-${index}`} className={particleClass} />
      ))}
    </div>
  );
};
