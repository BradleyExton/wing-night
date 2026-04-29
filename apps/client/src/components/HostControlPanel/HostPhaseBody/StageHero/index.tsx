import type { ReactNode } from "react";
import type { RoomState } from "@wingnight/shared";

import { HostMiniRail } from "../../HostMiniRail";
import * as styles from "./styles";

type StageHeroProps = {
  roomState: RoomState | null;
  teamNameByTeamId: Map<string, string>;
  glowClassName?: string;
  children: ReactNode;
};

export const StageHero = ({
  roomState,
  teamNameByTeamId,
  glowClassName = styles.glowDefault,
  children
}: StageHeroProps): JSX.Element => {
  return (
    <section className={styles.root}>
      <span className={`${styles.glow} ${glowClassName}`} aria-hidden />
      <HostMiniRail roomState={roomState} teamNameByTeamId={teamNameByTeamId} />
      {children}
    </section>
  );
};
