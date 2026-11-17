import { useEffect, useRef, useState, type RefObject } from "react";
import { Character, type CharacterAppearance, type CharacterMove } from "@wingnight/cast";
import type { TeamTheme } from "@wingnight/shared";

import { runOnNextBeat } from "../beatCue";
import { wardrobeStageCopy } from "./copy";
import * as styles from "./styles";

// A Move is one bar, drawn at 120 bpm (`--cast-move-ms`'s default), which is the page's own
// tempo: with no music the beat clock keeps 120 by itself. The bird goes back to its idle once
// it has played.
const MOVE_MS = 2000;

// A tap waits for the next beat to start the Move, at most a beat and a bit: the clock does not
// run under reduced motion, and the tap still plays (with no animation, as the cast's motion-safe
// Moves have none).
const BEAT_WAIT_MS = 600;

type WardrobeStageProps = {
  appearance: CharacterAppearance;
  theme: TeamTheme;
  // The Move the bird has on, which a tap plays; none, and a tap does nothing.
  move: CharacterMove | undefined;
  label: string;
  // The page's beat (`beatCue`): a tapped Move starts on the next one, on the parade's bar.
  beatRootRef: RefObject<HTMLElement | null>;
};

// The top of the wardrobe (research §2.5): your bird on its Stage, in its team's colour,
// idling, kept in view while the page scrolls under it (the page pins it). Tap it to play its
// Move.
export const WardrobeStage = ({ appearance, theme, move, label, beatRootRef }: WardrobeStageProps): JSX.Element => {
  const [play, setPlay] = useState({ count: 0, isPlaying: false });
  const timerRef = useRef<number | null>(null);
  const cancelCueRef = useRef<(() => void) | null>(null);

  const stopPending = (): void => {
    cancelCueRef.current?.();
    cancelCueRef.current = null;

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(
    () => (): void => {
      cancelCueRef.current?.();

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    },
    []
  );

  // A tap cues the Move for the next beat rather than starting it under the finger; a second
  // tap before then is the same cue, and one during a Move starts it again on the next beat.
  const playMove = (): void => {
    if (move === undefined || cancelCueRef.current !== null) {
      return;
    }

    stopPending();
    cancelCueRef.current = runOnNextBeat(
      beatRootRef.current,
      () => {
        cancelCueRef.current = null;
        setPlay((current) => ({ count: current.count + 1, isPlaying: true }));
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null;
          setPlay((current) => ({ ...current, isPlaying: false }));
        }, MOVE_MS);
      },
      BEAT_WAIT_MS
    );
  };

  return (
    <div className={styles.stage} data-testid="wardrobe-stage" data-team-color={theme.colorToken}>
      <button
        type="button"
        className={styles.birdButton}
        onClick={playMove}
        aria-label={move === undefined ? label : wardrobeStageCopy.playLabel(label)}
        aria-disabled={move === undefined}
        data-testid="wardrobe-bird"
        data-playing-move={play.isPlaying ? move : undefined}
      >
        <span className={styles.bird}>
          <Character
            key={play.count}
            appearance={appearance}
            apparel={theme.apparel}
            silhouette={theme.silhouette}
            dance={theme.dance}
            fillClassName={theme.colorVariant.characterFillClassName}
            pose="idle"
            showpieces
            move={play.isPlaying ? move : undefined}
          />
        </span>
      </button>
      {move !== undefined && <span className={styles.hint}>{wardrobeStageCopy.hint}</span>}
    </div>
  );
};
