import { useLayoutEffect, useRef, useState } from "react";
import { BRAWL_CREW_WORLD, type BrawlCrewBlock, type BrawlCrewMember } from "@wingnight/shared";

import { useCrewFigures } from "../useCrewFigures/index.js";
import { useStreetValue, type CrewStreet } from "../useCrewFrame/index.js";
import { SKY_EXTENT, Sky, Street, resolveBrawlSetting, resolveStreetExtent } from "./Backdrop/index.js";
import { BayLift, type BayLiftRefs } from "./BayLift/index.js";
import { Bell } from "./Bell/index.js";
import { DunkSplash } from "./DunkSplash/index.js";
import { FigureLayer, type FigureLayerHandle } from "./FigureLayer/index.js";
import { GoArrow } from "./GoArrow/index.js";
import { PickupLayer, type PickupLayerHandle } from "./PickupLayer/index.js";
import { createScenePainter, placeLayer } from "./scenePainter/index.js";
import * as styles from "./styles.js";

const WORLD = BRAWL_CREW_WORLD;

type CrewSceneProps = {
  /** The block as this screen is drawing it (`useCrewFrame`). */
  street: CrewStreet;
  layout: BrawlCrewBlock;
  crew: readonly BrawlCrewMember[];
  activeTurnTeamId: string | null;
  serverOrigin: string | null;
  label: string;
  /**
   * How the 16:9 window sits in a box of another shape. `cover` fills a wider box and gives up
   * sky from the top, never street from the bottom (the wall's arena). `contain` shows the whole
   * window in a narrower one, so no hen is ever off the side of it (the tablet).
   */
  fit: "cover" | "contain";
};

/**
 * The street with depth (docs/minigames/brawl-crew-spec.md §0.7): one block of Barrie at night —
 * Dunlop Street, the waterfront or Centennial Beach — with the whole crew and every goon on it.
 * The ground is a BAND: figures are drawn back to front by depth, each on a shadow at its own
 * foot. Every hen is her player's own cast hen in a ring of her slot's colour with her name over
 * her head; a downed one lies on her back with the revive ring closing round her; one who sat
 * out is dimmed.
 *
 * The street is SVG in world units on three layers (`styles.ts`): the sky and the block's own
 * stretch of Barrie are built once and only ever slid by the sim's camera, and the figures are
 * the one layer that repaints. Nothing here is React-driven per frame: the scene subscribes to
 * the street and writes each frame onto the DOM itself, and the only React work after mount is
 * the figure layer redrawing a goon whose picture changed. The three endings — block clear, the bay, the bell — are played
 * here over the block's last frame, on this screen's own clock.
 */
export const CrewScene = ({ street, layout, crew, activeTurnTeamId, serverOrigin, label, fit }: CrewSceneProps): JSX.Element => {
  const rootRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<SVGGElement>(null);
  const skyRef = useRef<SVGSVGElement>(null);
  const streetRef = useRef<SVGSVGElement>(null);
  const figuresRef = useRef<FigureLayerHandle>(null);
  const pickupsRef = useRef<PickupLayerHandle>(null);
  const dunkRef = useRef<SVGGElement>(null);
  const goRef = useRef<SVGGElement>(null);
  const bellRef = useRef<SVGGElement>(null);
  const bayRef = useRef<BayLiftRefs>(null);
  const henCount = useStreetValue(street, (frame) => frame?.hens.length ?? 0);
  const figures = useCrewFigures(crew, henCount, activeTurnTeamId, serverOrigin);
  // The bay's geese are only on the street while the bay beat plays: how many hens they are for.
  const [bayCrew, setBayCrew] = useState<number | null>(null);
  const figuresNow = useRef(figures);
  const layoutNow = useRef(layout);

  figuresNow.current = figures;
  layoutNow.current = layout;

  useLayoutEffect(() => {
    const painter = createScenePainter({
      street,
      elements: () => ({
        root: rootRef.current,
        window: windowRef.current,
        sky: skyRef.current,
        street: streetRef.current,
        world: worldRef.current,
        figures: figuresRef.current,
        pickups: pickupsRef.current,
        dunk: dunkRef.current,
        go: goRef.current,
        bell: bellRef.current,
        bay: bayRef.current
      }),
      layout: () => layoutNow.current,
      figures: () => figuresNow.current,
      setBayCrew
    });
    const unsubscribe = street.subscribe(painter.draw);

    painter.draw();

    return (): void => {
      unsubscribe();
      painter.dispose();
    };
  }, [street]);

  const setting = resolveBrawlSetting(layout.index);
  const streetExtent = resolveStreetExtent(layout);

  // Each slid layer is stood in the window by its own extent: a style no class can carry.
  useLayoutEffect(() => {
    placeLayer(skyRef.current, SKY_EXTENT);
    placeLayer(streetRef.current, streetExtent);
  }, [streetExtent.left, streetExtent.right]);

  return (
    <div
      ref={rootRef}
      className={styles.frame}
      role="img"
      aria-label={label}
      data-brawl-scene=""
      data-brawl-block={layout.index}
      data-brawl-setting={setting}
      data-brawl-tick="0"
      data-brawl-wave="0"
      data-brawl-banked="0"
      data-brawl-outcome=""
    >
      <div ref={windowRef} className={fit === "cover" ? styles.windowCover : styles.windowContain} data-brawl-window={fit}>
        <svg
          ref={skyRef}
          className={styles.slidLayer}
          viewBox={`${SKY_EXTENT.left} 0 ${SKY_EXTENT.right - SKY_EXTENT.left} ${WORLD.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <Sky setting={setting} />
        </svg>
        <svg
          ref={streetRef}
          className={styles.slidLayer}
          viewBox={`${streetExtent.left} 0 ${streetExtent.right - streetExtent.left} ${WORLD.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <Street block={layout} />
        </svg>
        <svg className={styles.figureLayer} viewBox={`0 0 ${WORLD.width} ${WORLD.height}`} aria-hidden="true">
          <g ref={worldRef} data-brawl-world>
            <PickupLayer ref={pickupsRef} />
            <DunkSplash ref={dunkRef} kind={layout.hazard?.kind ?? null} />
            <FigureLayer ref={figuresRef} figures={figures} />
            {bayCrew !== null && <BayLift ref={bayRef} crew={bayCrew} />}
          </g>
          <GoArrow ref={goRef} />
          <Bell ref={bellRef} />
        </svg>
      </div>
    </div>
  );
};
