import { useRef, type ReactNode } from "react";
import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import { NeonMarquee } from "@wingnight/surface";
import type {
  SongGuessMinigameDisplayReveal,
  SongGuessMinigameDisplayView
} from "@wingnight/shared";

import { useHeldSongReveal } from "../useHeldSongReveal/index.js";
import { useSongAudioPlayback } from "../useSongAudioPlayback/index.js";
import { displaySongGuessSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// Bar heights are a fixed visual motif, not data — the TV shows that something
// is playing, it does not analyse the waveform.
const EQUALIZER_BARS = [
  { id: "bar-1", className: "h-6" },
  { id: "bar-2", className: "h-12" },
  { id: "bar-3", className: "h-16" },
  { id: "bar-4", className: "h-10" },
  { id: "bar-5", className: "h-14" }
] as const;

const SongEqualizer = (): JSX.Element => {
  return (
    <div className={styles.equalizer} aria-hidden="true">
      {EQUALIZER_BARS.map((bar) => (
        <span key={bar.id} className={`${styles.equalizerBar} ${bar.className}`} />
      ))}
    </div>
  );
};

const SongGuessIntro = (): JSX.Element => {
  return (
    <div className={styles.container}>
      <h2 className={styles.introTitle}>{displaySongGuessSurfaceCopy.title}</h2>
      <p className={styles.introDescription}>
        {displaySongGuessSurfaceCopy.introDescription}
      </p>
    </div>
  );
};

// The set's position used to be a bare gold line above the prompt, in the
// marquee title's own tracking, weight and colour — the marquee, unframed and
// off to one side. It is the counter cell now, which is where the other eight
// displays put it, and it reaches the reveal and the set's last screen for the
// first time.
const SongGuessMarquee = ({
  activeTeamName,
  songCounter,
  clock,
  clockLine
}: {
  activeTeamName: string | null;
  songCounter: string;
  clock: ReactNode;
  clockLine: ReactNode;
}): JSX.Element => (
  <NeonMarquee
    title={displaySongGuessSurfaceCopy.title}
    teamName={activeTeamName}
    readout={<span className={styles.marqueeCounter}>{songCounter}</span>}
    clock={clock}
    clockLine={clockLine}
  />
);

const VerdictChip = ({ field, isHit }: { field: string; isHit: boolean }): JSX.Element => (
  <span
    className={isHit ? styles.verdictChipHit : styles.verdictChipMiss}
    data-song-guess-verdict={isHit ? "hit" : "miss"}
  >
    <span className={styles.verdictField}>{field}</span>
    <span className={isHit ? styles.verdictGlyphHit : styles.verdictGlyphMiss}>
      {isHit
        ? displaySongGuessSurfaceCopy.verdictHitGlyph
        : displaySongGuessSurfaceCopy.verdictMissGlyph}
    </span>
    <span className={isHit ? styles.verdictWordHit : styles.verdictWordMiss}>
      {isHit
        ? displaySongGuessSurfaceCopy.verdictHit
        : displaySongGuessSurfaceCopy.verdictMiss}
    </span>
  </span>
);

// The reveal-and-react beat: the answer and the ruling on it, in one card,
// with the points this song earned. `isHeld` marks the render where the
// server has already moved on and the TV is finishing the window
// (`useHeldSongReveal`) — the e2e reads it, the styling does not change.
const SongRevealCard = ({
  reveal,
  isHeld
}: {
  reveal: SongGuessMinigameDisplayReveal;
  isHeld: boolean;
}): JSX.Element => (
  <div
    className={styles.body}
    data-song-guess-reveal
    data-song-guess-reveal-held={isHeld ? "" : undefined}
  >
    <span className={styles.revealLabel}>
      {displaySongGuessSurfaceCopy.revealLabel}
    </span>
    <p className={styles.revealTitle}>{reveal.title}</p>
    <p className={styles.revealArtist}>
      <span className={styles.revealArtistPrefix}>
        {displaySongGuessSurfaceCopy.revealArtistPrefix}
      </span>
      {reveal.artist}
    </p>
    <div className={styles.verdictRow}>
      <VerdictChip
        field={displaySongGuessSurfaceCopy.verdictTitleField}
        isHit={reveal.verdict.title}
      />
      <VerdictChip
        field={displaySongGuessSurfaceCopy.verdictArtistField}
        isHit={reveal.verdict.artist}
      />
    </div>
    <p className={reveal.pointsEarned > 0 ? styles.pointsEarned : styles.pointsNone}>
      {displaySongGuessSurfaceCopy.pointsEarned(reveal.pointsEarned)}
    </p>
  </div>
);

const SongGuessPlayBody = ({
  view,
  isHeld
}: {
  view: SongGuessMinigameDisplayView;
  isHeld: boolean;
}): JSX.Element => {
  if (view.phase === "done") {
    return (
      <div className={styles.body}>
        <p className={styles.doneTitle}>{displaySongGuessSurfaceCopy.donePrompt}</p>
        <p className={styles.hint}>{displaySongGuessSurfaceCopy.doneHint}</p>
      </div>
    );
  }

  if (view.phase === "reveal") {
    // The host has opened the ruling but has not finished it: the room hears
    // nothing and reads nothing until both halves are in.
    if (view.reveal === null) {
      return (
        <div className={styles.body} data-song-guess-ruling>
          <p className={styles.prompt}>{displaySongGuessSurfaceCopy.rulingPrompt}</p>
          <p className={styles.hint}>{displaySongGuessSurfaceCopy.rulingHint}</p>
        </div>
      );
    }

    return <SongRevealCard reveal={view.reveal} isHeld={isHeld} />;
  }

  if (view.phase === "clip_paused") {
    return (
      <div className={styles.body} data-song-guess-lock-in>
        <p className={styles.prompt}>{displaySongGuessSurfaceCopy.lockInPrompt}</p>
        <p className={styles.hint}>{displaySongGuessSurfaceCopy.lockInHint}</p>
      </div>
    );
  }

  return (
    <div className={styles.body} data-song-guess-listening>
      <p className={styles.prompt}>{displaySongGuessSurfaceCopy.listenPrompt}</p>
      {view.phase === "clip_playing" && <SongEqualizer />}
    </div>
  );
};

export const DisplaySongGuessSurface = ({
  phase,
  minigameDisplayView,
  activeTeamName,
  clock,
  clockLine,
  serverOrigin
}: MinigameDisplayRendererProps): JSX.Element => {
  const liveView =
    minigameDisplayView?.minigame === "SONG_GUESS" ? minigameDisplayView : null;
  const mediaRef = useRef<HTMLAudioElement | null>(null);

  // Audio follows the LIVE view: when the host moves on, the next clip is cued
  // at once even while the picture finishes the reveal beat below.
  useSongAudioPlayback({ view: liveView, serverOrigin, mediaRef });

  const { view: songGuessView, isHeld } = useHeldSongReveal(liveView);

  return (
    <>
      {phase !== "play" ? (
        <SongGuessIntro />
      ) : songGuessView === null ? (
        <div className={styles.container}>
          <p className={styles.hint}>{displaySongGuessSurfaceCopy.waitingLabel}</p>
        </div>
      ) : (
        <div className={styles.stage}>
          <SongGuessMarquee
            activeTeamName={activeTeamName}
            songCounter={displaySongGuessSurfaceCopy.songCounter(
              songGuessView.songCursor + 1,
              songGuessView.songsTotal
            )}
            clock={clock}
            clockLine={clockLine}
          />
          <SongGuessPlayBody view={songGuessView} isHeld={isHeld} />
        </div>
      )}
      {/* Rendered for the whole surface lifetime, not per phase, so seeking
          between clip and reveal never has to re-create the element. The `src`
          is set in the playback effect — resolving it reads the server origin,
          which react-dom/server cannot do. */}
      <audio ref={mediaRef} data-song-guess-audio preload="auto" />
    </>
  );
};
