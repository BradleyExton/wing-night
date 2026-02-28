import { type RoomState } from "@wingnight/shared";
import { useMemo } from "react";

import { ContentFatalState } from "../ContentFatalState";
import { StageSurface } from "./StageSurface";
import { StandingsSurface } from "./StandingsSurface";
import { resolveSortedStandings } from "../../utils/resolveSortedStandings";
import * as styles from "./styles";

type DisplayBoardProps = {
  roomState: RoomState | null;
};

export const DisplayBoard = ({ roomState }: DisplayBoardProps): JSX.Element => {
  const fatalError = roomState?.fatalError ?? null;
  const standings = useMemo(() => {
    if (!roomState) {
      return [];
    }

    return resolveSortedStandings(roomState.teams);
  }, [roomState]);

  const phase = roomState?.phase ?? null;

  if (fatalError !== null) {
    return <ContentFatalState fatalError={fatalError} />;
  }

  return (
    <main className={styles.container}>
      <section className={styles.main}>
        <div className={styles.content}>
          <StageSurface roomState={roomState} />
        </div>
      </section>

      <StandingsSurface phase={phase} standings={standings} />
    </main>
  );
};
