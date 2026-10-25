import { useEffect, useRef, useState } from "react";
import { resolvePlayerOutfit, type Player, type Team, type TeamTheme } from "@wingnight/shared";

import {
  Character,
  CharacterStage,
  isOutfitSlotDrawn,
  resolveCharacterGrooveClassName,
  resolvePlayerAppearance,
  type CharacterAppearance,
  type CharacterPose
} from "@wingnight/cast";

import { BEATS_PER_BAR, resolveOutfitMove, resolveParadeMoves } from "../../../../../utils/resolveCastMoves";
import { useRoomBeat } from "../../../../../utils/useRoomBeat";
import { useServerOrigin } from "../../../../../utils/useServerOrigin";
import { PARADE_DANCE_MS, resolveParadeFrame, type ParadeFrame, type ParadePhase } from "./resolveParadeFrame";
import {
  resolveParadeGroups,
  resolveParadePairs,
  type ParadeGroup,
  type ParadeLineup
} from "./resolveParadeGroups";
import * as styles from "./styles";

type CastParadeProps = {
  players: Player[];
  teams: Team[];
  // Colour and apparel come off the theme map so the parade, the standings
  // dots and the intro lineup can never disagree about a team's look.
  teamThemeByTeamId: Map<string, TeamTheme>;
  // Two teams a cycle, one a side (the TV's floor), or one team a cycle in
  // the middle of the floor, from alternating edges (a phone's). Pairs unless
  // said otherwise.
  lineup?: ParadeLineup;
};

type Side = "left" | "right";

const STAGED_FRAME: ParadeFrame = { pairIndex: 0, phase: "staged" };

// Asked every few frames where the parade has got to; the state only changes
// when the answer does, so the birds are not re-rendered on a clock. A room
// that asked for less motion gets the first pair parked on the floor.
const FRAME_POLL_MS = 50;

const useParadeFrame = (pairCount: number): ParadeFrame => {
  const [frame, setFrame] = useState<ParadeFrame>(STAGED_FRAME);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFrame({ pairIndex: 0, phase: "dance" });
      return undefined;
    }

    const startedAt = performance.now();
    const poll = window.setInterval(() => {
      const next = resolveParadeFrame(performance.now() - startedAt, pairCount);

      setFrame((current) =>
        current.pairIndex === next.pairIndex && current.phase === next.phase ? current : next
      );
    }, FRAME_POLL_MS);

    return () => {
      window.clearInterval(poll);
    };
  }, [pairCount]);

  return frame;
};

const isOnstage = (phase: ParadePhase): boolean => phase === "enter" || phase === "dance";

const resolveGroupClassName = (side: Side, phase: ParadePhase, lineup: ParadeLineup): string => {
  if (lineup === "solo") {
    if (isOnstage(phase)) {
      return `${styles.groupSolo} ${styles.groupSoloOnstage}`;
    }

    return `${styles.groupSolo} ${side === "left" ? styles.groupSoloLeftOffstage : styles.groupSoloRightOffstage}`;
  }

  if (side === "left") {
    return `${styles.groupLeft} ${isOnstage(phase) ? styles.groupLeftOnstage : styles.groupLeftOffstage}`;
  }

  return `${styles.groupRight} ${isOnstage(phase) ? styles.groupRightOnstage : styles.groupRightOffstage}`;
};

// A solo team takes turns with the edges, so the floor is not a one-way street.
const resolveSoloSide = (pairIndex: number): Side => (pairIndex % 2 === 0 ? "left" : "right");

// A bird faces the way it is going, and its opposite number while it dances:
// the left group faces right except on the way out, the right group faces
// left except on the way out.
const isFacingLeft = (side: Side, phase: ParadePhase): boolean =>
  side === "left" ? phase === "exit" : phase !== "exit";

const resolvePose = (phase: ParadePhase): CharacterPose => (phase === "dance" ? "dance" : "walk");

// A dancing bird bounces around on its own; a walking one just walks, and one
// playing its Move stands its ground for the bar.
const resolveJiveClassName = (bouncing: boolean): string => (bouncing ? styles.jiveDancing : styles.jive);

// The pool under its feet answers the bounce only while it is bouncing.
const resolveShadowClassName = (bouncing: boolean): string =>
  bouncing ? styles.shadowDancing : styles.shadow;

// Each bird's face over the back of the bird in front of it: in a row facing
// right the front bird is the last, so depth runs down the row; facing left,
// up it.
const resolveDepthClassName = (index: number, count: number, facingLeft: boolean): string => {
  const place = facingLeft ? index : count - 1 - index;

  return styles.birdDepths[Math.min(place, styles.birdDepths.length - 1)] ?? "";
};

const isOnShow = (appearance: CharacterAppearance | undefined): boolean =>
  isOutfitSlotDrawn(appearance?.outfit, "prop") || isOutfitSlotDrawn(appearance?.outfit, "stage");

// How far a bird tucks in behind the one before it (the first takes no
// overlap): a huddle, unless either of the two has a showpiece to hold out.
const resolveOverlapClassName = (
  appearances: readonly CharacterAppearance[],
  index: number,
  lineup: ParadeLineup
): string => {
  if (index === 0) {
    return "";
  }

  if (lineup === "solo") {
    return styles.memberOverlapSolo;
  }

  return isOnShow(appearances[index - 1]) || isOnShow(appearances[index])
    ? styles.memberOverlapShowpiece
    : styles.memberOverlapTight;
};

// The lobby's ambient cast, two teams at a time: one walks in from the left
// edge and one from the right, they dance to the beat facing each other, walk
// back out their own edges, and the next pair walks in. Decoration only — no
// state the server knows, `aria-hidden`.
export const CastParade = ({
  players,
  teams,
  teamThemeByTeamId,
  lineup = "pairs"
}: CastParadeProps): JSX.Element | null => {
  // Player heads come from the content pack, which the SERVER serves — the TV
  // is a different origin, so they have to be addressed absolutely. `null` on
  // the first paint, and every player wears their drawn head until it resolves.
  const serverOrigin = useServerOrigin();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pairs = resolveParadePairs(resolveParadeGroups(players, teams, teamThemeByTeamId), lineup);
  const frame = useParadeFrame(pairs.length);
  const pair = pairs[frame.pairIndex] ?? pairs[0];
  // The room's bars, counted from the pair's first on the floor. A bird's Move
  // (the wardrobe's showpiece motion) comes round every eight of them (fewer
  // when slow music fits fewer in the dance), and only where the whole bar
  // fits before the pair walks off: a Move cut off by the walk would snap.
  const {
    step: bar,
    stepAtMs,
    barMs,
    openingBarMs
  } = useRoomBeat(containerRef, {
    active: frame.phase === "dance" && pair !== undefined,
    resetKey: frame.pairIndex,
    beatsPerStep: BEATS_PER_BAR
  });
  const barsOnFloor = Math.floor(PARADE_DANCE_MS / openingBarMs);
  const moveBar = bar !== null && stepAtMs + barMs <= PARADE_DANCE_MS ? bar : null;

  if (pair === undefined) {
    return null;
  }

  const renderGroup = (group: ParadeGroup, side: Side): JSX.Element => {
    const facingLeft = isFacingLeft(side, frame.phase);
    const mirrorClassName = facingLeft ? styles.facingLeft : "";
    const fillClassName = group.fillClassName ?? styles.unassignedFill;
    const appearances = group.players.map((player) =>
      resolvePlayerAppearance({ ...player, outfit: resolvePlayerOutfit(player, group.genre) }, serverOrigin)
    );
    // The line runs front to back, the way the row faces, so the Bump's answer
    // lands on the bird behind the one that bumps.
    const dancers = group.players.map((player, index) => ({
      name: player.name,
      move: resolveOutfitMove(appearances[index]?.outfit)
    }));
    const line = facingLeft ? dancers : [...dancers].reverse();
    const linePlays = moveBar === null ? [] : resolveParadeMoves(line, moveBar, barsOnFloor);
    const plays = facingLeft ? linePlays : [...linePlays].reverse();

    return (
      <span
        key={group.id}
        className={resolveGroupClassName(side, frame.phase, lineup)}
        data-cast-group={group.id}
        data-cast-side={side}
      >
        {group.players.map((player, index) => {
          const appearance = appearances[index] ?? resolvePlayerAppearance(player, serverOrigin);
          const play = plays[index];
          const bouncing = frame.phase === "dance" && play === undefined;

          // The bird's own groove rides on the member as custom properties and
          // inherits all the way down into the drawing: its footwork tempo, how
          // late it lands the beat, where in its bounce it is. Nothing here is
          // random — the groove is the player's name, so Brad dances Brad's
          // dance every night — but the floor never draws one groove, which is
          // what makes it look like a party and not a drill.
          //
          // A worn Stage takes the shadow pool's place, in the ground under the
          // bird and outside the jive, so the bird hops off its stage and lands
          // on it. A Move plays for its bar in place of the pose (a pop bird's
          // team bounce included) and hands it back.
          return (
            <span
              key={player.id}
              className={`${styles.member} ${resolveOverlapClassName(appearances, index, lineup)} ${resolveCharacterGrooveClassName(player.name)}`}
              data-cast-member={player.id}
              data-cast-move={play}
            >
              <span className={`${styles.ground} ${mirrorClassName}`}>
                {isOutfitSlotDrawn(appearance.outfit, "stage") ? (
                  <CharacterStage appearance={appearance} fillClassName={fillClassName} silhouette={group.silhouette} />
                ) : (
                  <span className={resolveShadowClassName(bouncing)} />
                )}
              </span>
              <span
                className={`${styles.bird} ${resolveDepthClassName(index, group.players.length, facingLeft)} ${mirrorClassName}`}
              >
                <span className={resolveJiveClassName(bouncing)}>
                  {/* Keyed on the Move, so the bird is drawn afresh as a Move
                      starts and as it hands back. Kept, the figure's dance jig
                      wrapper comes and goes around its parts, React reuses one
                      part's nodes as another's, and the dance pose's transform
                      transition slides the body in from its pivot offset: the
                      body flew off its legs for a fifth of a second at every
                      hand-back. */}
                  <Character
                    key={play ?? "pose"}
                    appearance={appearance}
                    showpieces
                    stage="none"
                    apparel={group.apparel}
                    silhouette={group.silhouette}
                    dance={group.dance}
                    fillClassName={fillClassName}
                    pose={resolvePose(frame.phase)}
                    move={play}
                  />
                </span>
              </span>
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <div
      ref={containerRef}
      className={styles.container}
      aria-hidden
      data-cast-parade
      data-cast-parade-phase={frame.phase}
    >
      {renderGroup(pair[0], lineup === "solo" ? resolveSoloSide(frame.pairIndex) : "left")}
      {pair[1] !== undefined && renderGroup(pair[1], "right")}
    </div>
  );
};
