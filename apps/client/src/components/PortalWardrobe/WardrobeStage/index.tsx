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

// The top of the wardrobe (research §2.5): your bird large, on its Stage, in its team's colour,
// idling. Tap it to play its Move. The TV-size pill swaps it for the bird at the sizes the room
// will see it — 130px in the parade, blurred as from the couch, and 76px in a game, kit only —
// which is honest, and steers a guest off an item too quiet to read.
export const WardrobeStage = ({ appearance, theme, move, label, beatRootRef }: WardrobeStageProps): JSX.Element => {
  const [isTvSize, setIsTvSize] = useState(false);
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

  const birdProps = {
    appearance,
    apparel: theme.apparel,
    silhouette: theme.silhouette,
    dance: theme.dance,
    fillClassName: theme.colorVariant.characterFillClassName
  };

  return (
    <div className={isTvSize ? styles.stageTv : styles.stage} data-testid="wardrobe-stage" data-team-color={theme.colorToken}>
      {isTvSize ? (
        <div className={styles.tvRow} role="img" aria-label={wardrobeStageCopy.tvLabel(label)}>
          <figure className={styles.tvFigure}>
            <span className={styles.tvBird130}>
              <Character {...birdProps} pose="idle" showpieces />
            </span>
            <figcaption className={styles.tvCaption}>{wardrobeStageCopy.parade}</figcaption>
          </figure>
          <figure className={styles.tvFigure}>
            <span className={styles.tvBird76}>
              <Character {...birdProps} pose="still" />
            </span>
            <figcaption className={styles.tvCaption}>{wardrobeStageCopy.game}</figcaption>
          </figure>
        </div>
      ) : (
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
              {...birdProps}
              pose="idle"
              showpieces
              move={play.isPlaying ? move : undefined}
            />
          </span>
        </button>
      )}
      {!isTvSize && move !== undefined && <span className={styles.hint}>{wardrobeStageCopy.hint}</span>}
      <button
        type="button"
        className={isTvSize ? styles.tvPillOn : styles.tvPill}
        aria-pressed={isTvSize}
        onClick={(): void => setIsTvSize((current) => !current)}
        data-testid="wardrobe-tv-size"
      >
        {wardrobeStageCopy.tvSize}
      </button>
    </div>
  );
};
