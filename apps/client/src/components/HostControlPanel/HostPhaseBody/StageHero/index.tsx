import type { ReactNode } from "react";

import { HostMiniRail } from "../../HostMiniRail";
import * as styles from "./styles";

type StageHeroProps = {
  glowClassName?: string;
  children: ReactNode;
};

export const StageHero = ({
  glowClassName = styles.glowDefault,
  children
}: StageHeroProps): JSX.Element => {
  return (
    <section className={styles.root}>
      <span className={`${styles.glow} ${glowClassName}`} aria-hidden />
      <HostMiniRail />
      {children}
    </section>
  );
};
