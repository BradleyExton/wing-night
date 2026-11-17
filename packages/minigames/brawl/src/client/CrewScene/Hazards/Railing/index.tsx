import { STREET_BANDS, resolveStops } from "../../Backdrop/layout/index.js";
import type { BrawlNightPalette } from "../nightPalette/index.js";

/** A post every four units, a baluster every one and a third between them, and the rail's height. */
const POST_STEP = 4;
const BALUSTERS_PER_BAY = 3;
const RAIL_HEIGHT = 9;
const MID_RAIL_Y = 5.4;
/** The posts of the two side runs, back of the band to front, and the deck's boards. */
const SIDE_POST_STEP = 8;
const DECK_BOARD = 4;

/**
 * Dunlop Street's hazard: the Queen's patio, spilled out into the road. A deck of boards lies
 * across the WHOLE depth of the band from `x` across `width` world units, with the patio's iron
 * railing along its back edge and a run of posts down either side — a shove into it is decided
 * left to right only, so the thing has to be there to hit at every depth. A goon shoved past it
 * goes over the rail. Painted in the scene's night steel so it sits with the lamps, and drawn
 * under the fight: nothing here ever stands in front of a figure.
 */
export const Railing = ({ x, width, palette }: { x: number; width: number; palette: BrawlNightPalette }): JSX.Element => {
  const left = Number.isFinite(x) ? x : 0;
  const span = Number.isFinite(width) && width > 0 ? width : POST_STEP;
  const { bandBackY, bandFrontY } = STREET_BANDS;
  const back = bandBackY - 3;
  const front = bandFrontY + 2;
  const posts = resolveStops({ left, right: left + span }, POST_STEP, left % POST_STEP);
  const balusterStep = POST_STEP / BALUSTERS_PER_BAY;
  const balusters = resolveStops({ left: left + balusterStep / 2, right: left + span }, balusterStep, (left + balusterStep / 2) % balusterStep)
    .filter(
(bx) => !posts.some((px) => Math.abs(px - bx) < 0.5))
    .map((bx) => Math.round(bx * 100) / 100);
  const sidePosts = resolveStops({ left: back + SIDE_POST_STEP, right: front }, SIDE_POST_STEP, back % SIDE_POST_STEP);

  return (
    <g data-brawl-hazard="railing" aria-hidden="true">
      <rect x={left - 1} y={back} width={span + 2} height={front - back + 1} fill={palette.shadow} />
      <rect x={left} y={back} width={span} height={front - back} fill={palette.plank} />
      {resolveStops({ left: back + DECK_BOARD, right: front - 1 }, DECK_BOARD, back % DECK_BOARD).map((y) => (
        <rect key={y} x={left} y={y} width={span} height={0.3} fill={palette.joint} />
      ))}
      <rect x={left} y={front - 0.9} width={span} height={0.9} fill={palette.steelDark} />
      {[left, left + span].map((sx) => (
        <g key={sx}>
          <rect x={sx - 0.3} y={back - RAIL_HEIGHT} width={0.6} height={front - back} fill={palette.steelDark} />
          <rect x={sx - 0.2} y={back - MID_RAIL_Y} width={0.4} height={front - back} fill={palette.steelDark} opacity={0.7} />
          {sidePosts.map((y) => (
            <g key={y}>
              <rect x={sx - 0.4} y={y - RAIL_HEIGHT} width={0.8} height={RAIL_HEIGHT} fill={palette.steelDark} />
              <circle cx={sx} cy={y - RAIL_HEIGHT - 0.5} r={0.6} fill={palette.steel} />
            </g>
          ))}
        </g>
      ))}
      {balusters.map((bx) => (
        <rect key={bx} x={Math.round((bx - 0.12) * 100) / 100} y={back - MID_RAIL_Y} width={0.24} height={MID_RAIL_Y - 0.7} fill={palette.steelDark} />
      ))}
      <rect x={left} y={back - MID_RAIL_Y} width={span} height={0.5} fill={palette.steel} />
      {posts.map((px) => (
        <g key={px}>
          <rect x={px - 0.35} y={back - RAIL_HEIGHT} width={0.7} height={RAIL_HEIGHT} fill={palette.steelDark} />
          <circle cx={px} cy={back - RAIL_HEIGHT - 0.5} r={0.55} fill={palette.steel} />
        </g>
      ))}
      <rect x={left - 0.4} y={back - RAIL_HEIGHT - 0.2} width={span + 0.8} height={0.9} fill={palette.steel} />
      <rect x={left - 0.4} y={back - RAIL_HEIGHT - 0.2} width={span + 0.8} height={0.25} fill={palette.glint} />
    </g>
  );
};
