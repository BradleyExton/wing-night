import { memo, useMemo } from "react";
import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import { BRAWL_CREW_WORLD, CONTESTANT_CONTROLLERS, type BrawlCrewFrame, type BrawlMinigameDisplayView } from "@wingnight/shared";
import { NeonMarquee, ResultPlaque } from "@wingnight/surface";

import { BEAT_MS } from "../../beats/index.js";
import { resolveBrawlSetting } from "../../CrewScene/Backdrop/index.js";
import { CrewScene } from "../../CrewScene/index.js";
import { resolveLiveBanked, resolveShownBlock } from "../../shownBlock/index.js";
import { TurnAwards } from "../../TurnAwards/index.js";
import { resolveTurnAwards } from "../../TurnAwards/resolveTurnAwards/index.js";
import { useAfter } from "../../useAfter/index.js";
import { useCrewFigures } from "../../useCrewFigures/index.js";
import { useCrewFrame, useStreetValue } from "../../useCrewFrame/index.js";
import { useCrewSounds } from "../../useCrewSounds/index.js";
import { resolveWaveMeter, resolveWaveMeterSignature } from "../../waveMeter/index.js";
import { BeatCallout } from "../BeatCallout/index.js";
import { CrewStrip, type CrewStripHen } from "../CrewStrip/index.js";
import { displayBrawlSurfaceCopy } from "../copy.js";
import { ReadyBeat } from "../ReadyBeat/index.js";
import { WaveMeter } from "../WaveMeter/index.js";
import * as styles from "./styles.js";

const MemoCrewStrip = memo(CrewStrip);
const MemoWaveMeter = memo(WaveMeter);

/** The strip's hens as one short string: each one's hearts, state and star. It changes a handful of times a block. */
const resolveStripSignature = (frame: BrawlCrewFrame | null): string => {
  return frame === null ? "" : frame.hens.map((hen) => `${hen.hearts}${hen.state[0]}${hen.hitInWave ? "x" : "c"}`).join("|");
};

type StageProps = Pick<MinigameDisplayRendererProps, "activeTeamName" | "clock" | "clockLine" | "serverOrigin" | "handset"> & {
  view: BrawlMinigameDisplayView;
};

/** What the line under the street says: who the room is waiting on, the verbs, or that the team is through. */
const resolveStatusLine = (view: BrawlMinigameDisplayView): string => {
  if (view.phase === "finished") {
    return displayBrawlSurfaceCopy.finishedPrompt;
  }

  if (view.phase === "running") {
    return displayBrawlSurfaceCopy.verbs;
  }

  if (view.blockIndex === 0) {
    const out = new Set((view.blocks[0]?.crew ?? []).map((member) => member.player?.playerId));

    return displayBrawlSurfaceCopy.steppingOut(
      out.size,
      view.roster.filter((figure) => !out.has(figure.playerId)).map((figure) => figure.name)
    );
  }

  return displayBrawlSurfaceCopy.nextBlock(view.blocks[view.blockIndex - 1]?.outcome ?? null);
};

/**
 * The wall while a team is on the street (docs/minigames/brawl-crew-spec.md §0.7): the house sign
 * with the crew in it, the street drawn from the server's frame and stepped on here between
 * frames, the wave meter over its sky, each ending's callout over its pavement, and the turn's
 * results. The fight moves sixty times a second and this component does not: the scene and the
 * sounds listen to the street themselves, and what is rendered here reads only the few values it
 * shows (`useStreetValue`).
 */
export const Stage = ({ view, activeTeamName, clock, clockLine, serverOrigin, handset }: StageProps): JSX.Element => {
  const shown = resolveShownBlock(view);
  const { street, layout } = useCrewFrame(shown, view);
  const drawnBanked = useStreetValue(street, (frame) => frame?.banked ?? null);
  const outcome = useStreetValue(street, (frame) => frame?.outcome ?? null);
  const stripSignature = useStreetValue(street, resolveStripSignature);
  const meterSignature = useStreetValue(street, (frame) => (frame === null || layout === null ? "" : resolveWaveMeterSignature(resolveWaveMeter(frame, layout))));
  const figures = useCrewFigures(shown?.crew ?? [], stripSignature === "" ? 0 : stripSignature.split("|").length, view.activeTurnTeamId, serverOrigin);
  const hens = useMemo((): CrewStripHen[] => {
    return (street.read()?.hens ?? []).flatMap((hen) => {
      const figure = figures[hen.slot];

      return figure === undefined ? [] : [{ slot: hen.slot, figure, hearts: hen.hearts, state: hen.state, clean: !hen.hitInWave }];
    });
    // The signature IS the hens: the frame itself is a new object sixty times a second.
  }, [street, stripSignature, figures]);
  const meter = useMemo(() => {
    const frame = street.read();

    return frame === null || layout === null ? null : resolveWaveMeter(frame, layout);
  }, [street, meterSignature, layout]);
  const isFinished = view.phase === "finished";
  const isFighting = shown?.status === "running";
  const isOnTheLine = shown?.status === "ready" && !isFinished;
  // The ending on screen: the shown block is over and this screen has drawn its last frame.
  const ending = shown !== null && shown.status === "done" ? outcome : null;
  const hasResults = useAfter(isFinished ? `${shown?.blockIndex ?? ""}:${ending ?? "skipped"}` : null, ending === null ? 0 : BEAT_MS[ending]);
  const next = view.blocks[view.blockIndex] ?? null;
  const awards = useMemo(() => resolveTurnAwards(view.turnStats, view.roster), [JSON.stringify(view.turnStats), JSON.stringify(view.roster)]);

  useCrewSounds({ street, hazard: layout?.hazard?.kind ?? null, serverOrigin });

  return (
    <div className={styles.stage}>
      <NeonMarquee
        title={displayBrawlSurfaceCopy.title}
        teamName={activeTeamName}
        readout={
          <>
            <MemoCrewStrip hens={hens} heartsMax={BRAWL_CREW_WORLD.heartsMax} />
            <span className={styles.counts}>
              <span>{displayBrawlSurfaceCopy.blockCounter(Math.min(view.blockIndex + 1, view.blocksPerTurn), view.blocksPerTurn)}</span>
              <span className={styles.tally} data-brawl-banked={resolveLiveBanked(view, shown, drawnBanked)} data-brawl-total={view.total}>
                {displayBrawlSurfaceCopy.tally(resolveLiveBanked(view, shown, drawnBanked), view.total)}
                <span className={styles.tallyLabel}>{displayBrawlSurfaceCopy.tallyLabel}</span>
              </span>
              {view.bestTurn !== null && (
                <span className={styles.best} data-brawl-best>
                  {displayBrawlSurfaceCopy.best(view.bestTurn.banked, view.bestTurn.total, view.bestTurn.teamName)}
                </span>
              )}
            </span>
          </>
        }
        clock={clock}
        clockLine={clockLine}
      />
      <div className={styles.arenaArea} data-brawl-display-arena>
        {layout !== null && shown !== null ? (
          <div key={shown.blockIndex} className={styles.blockEnter}>
            <CrewScene
              street={street}
              layout={layout}
              crew={shown.crew}
              activeTurnTeamId={view.activeTurnTeamId}
              serverOrigin={serverOrigin}
              label={displayBrawlSurfaceCopy.sceneLabel}
              fit="cover"
            />
          </div>
        ) : (
          <p className={styles.hint}>{displayBrawlSurfaceCopy.waitingStreetLabel}</p>
        )}
        {meter !== null && isFighting && <MemoWaveMeter meter={meter} hidden={outcome !== null} />}
        {isOnTheLine && shown !== null && (
          <ReadyBeat
            roster={view.roster}
            slotByPlayerId={Object.fromEntries(shown.crew.flatMap((member) => (member.player === null ? [] : [[member.player.playerId, member.slot]])))}
            onPhones={handset === CONTESTANT_CONTROLLERS.PHONE || shown.crew.length > 0}
            tabletPlayerName={view.roster.length === 0 ? null : (view.roster[shown.blockIndex % view.roster.length]?.name ?? null)}
            isFirstBlock={shown.blockIndex === 0}
          />
        )}
        {ending !== null && shown !== null && !hasResults && (
          <BeatCallout
            outcome={ending}
            setting={resolveBrawlSetting(shown.blockIndex)}
            next={isFinished || next === null ? null : resolveBrawlSetting(next.blockIndex)}
            nextOnTablet={shown.tablet}
          />
        )}
        {hasResults && (
          <div className={styles.resultOverlay} data-brawl-result="finished">
            <ResultPlaque
              tone={(view.points ?? 0) > 0 ? "hit" : "neutral"}
              title={displayBrawlSurfaceCopy.finishedTitle(view.banked, view.total)}
              detail={displayBrawlSurfaceCopy.finishedBlurb(view.banked, view.total)}
              points={displayBrawlSurfaceCopy.points(view.points ?? 0)}
              pointsCaption={activeTeamName}
              silent
            >
              <TurnAwards awards={awards} activeTurnTeamId={view.activeTurnTeamId} serverOrigin={serverOrigin} tone="wall" />
            </ResultPlaque>
          </div>
        )}
      </div>
      <p className={styles.statusLine} data-brawl-status>
        {resolveStatusLine(view)}
      </p>
    </div>
  );
};
