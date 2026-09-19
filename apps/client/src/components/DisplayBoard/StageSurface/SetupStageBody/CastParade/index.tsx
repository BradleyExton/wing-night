import { useEffect, useState } from "react";
import type { Player, Team, TeamTheme } from "@wingnight/shared";

import {
  Character,
  resolveCharacterGrooveClassName,
  resolvePlayerAppearance,
  type CharacterPose
} from "@wingnight/cast";

import { useServerOrigin } from "../../../../../utils/useServerOrigin";
import { resolveParadeFrame, type ParadeFrame, type ParadePhase } from "./resolveParadeFrame";
import { resolveParadeGroups, resolveParadePairs, type ParadeGroup } from "./resolveParadeGroups";
import * as styles from "./styles";

type CastParadeProps = {
  players: Player[];
  teams: Team[];
  // Colour and apparel come off the theme map so the parade, the standings
  // dots and the intro lineup can never disagree about a team's look.
  teamThemeByTeamId: Map<string, TeamTheme>;
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

const resolveGroupClassName = (side: Side, phase: ParadePhase): string => {
  if (side === "left") {
    return `${styles.groupLeft} ${isOnstage(phase) ? styles.groupLeftOnstage : styles.groupLeftOffstage}`;
  }

  return `${styles.groupRight} ${isOnstage(phase) ? styles.groupRightOnstage : styles.groupRightOffstage}`;
};

// A bird faces the way it is going, and its opposite number while it dances:
// the left group faces right except on the way out, the right group faces
// left except on the way out.
const resolveMemberClassName = (side: Side, phase: ParadePhase): string => {
  const facesLeft = side === "left" ? phase === "exit" : phase !== "exit";

  return facesLeft ? `${styles.member} ${styles.memberFacingLeft}` : styles.member;
};

const resolvePose = (phase: ParadePhase): CharacterPose => (phase === "dance" ? "dance" : "walk");

// A dancing bird bounces around on its own; a walking one just walks.
const resolveJiveClassName = (phase: ParadePhase): string =>
  phase === "dance" ? styles.jiveDancing : styles.jive;

// The pool under its feet answers the bounce only while it is bouncing.
const resolveShadowClassName = (phase: ParadePhase): string =>
  phase === "dance" ? styles.shadowDancing : styles.shadow;

// The lobby's ambient cast, two teams at a time: one walks in from the left
// edge and one from the right, they dance to the beat facing each other, walk
// back out their own edges, and the next pair walks in. Decoration only — no
// state the server knows, `aria-hidden`.
export const CastParade = ({ players, teams, teamThemeByTeamId }: CastParadeProps): JSX.Element | null => {
  // Player heads come from the content pack, which the SERVER serves — the TV
  // is a different origin, so they have to be addressed absolutely. `null` on
  // the first paint, and every player wears their drawn head until it resolves.
  const serverOrigin = useServerOrigin();
  const pairs = resolveParadePairs(resolveParadeGroups(players, teams, teamThemeByTeamId));
  const frame = useParadeFrame(pairs.length);
  const pair = pairs[frame.pairIndex] ?? pairs[0];

  if (pair === undefined) {
    return null;
  }

  const renderGroup = (group: ParadeGroup, side: Side): JSX.Element => (
    <span
      key={group.id}
      className={resolveGroupClassName(side, frame.phase)}
      data-cast-group={group.id}
      data-cast-side={side}
    >
      {group.players.map((player) => (
        // The bird's own groove rides on the member as custom properties and
        // inherits all the way down into the drawing: its footwork tempo, how
        // late it lands the beat, where in its bounce it is. Nothing here is
        // random — the groove is the player's name, so Brad dances Brad's
        // dance every night — but the floor never draws one groove, which is
        // what makes it look like a party and not a drill.
        <span
          key={player.id}
          className={`${resolveMemberClassName(side, frame.phase)} ${resolveCharacterGrooveClassName(player.name)}`}
          data-cast-member={player.id}
        >
          <span className={resolveShadowClassName(frame.phase)} />
          <span className={resolveJiveClassName(frame.phase)}>
            <Character
              appearance={resolvePlayerAppearance(player, serverOrigin)}
              apparel={group.apparel}
              fillClassName={group.fillClassName ?? styles.unassignedFill}
              pose={resolvePose(frame.phase)}
            />
          </span>
        </span>
      ))}
    </span>
  );

  return (
    <div className={styles.container} aria-hidden data-cast-parade data-cast-parade-phase={frame.phase}>
      {renderGroup(pair[0], "left")}
      {pair[1] !== undefined && renderGroup(pair[1], "right")}
    </div>
  );
};
