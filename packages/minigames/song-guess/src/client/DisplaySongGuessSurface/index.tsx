import { useRef } from "react";
import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import type { SongGuessMinigameDisplayView } from "@wingnight/shared";

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
      <h2 className={styles.introTitle}>{displaySongGuessSurfaceCopy.showTitle}</h2>
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
  songCounter
}: {
  activeTeamName: string | null;
  songCounter: string;
}): JSX.Element => {
  // A `<div>`, the way EMOJI_CHARADES's marquee is one, not the `<header>` the
  // other five reach for: `page.locator("header")` is the e2e suite's strict
  // handle on the host's mini-rail, and the dev sandbox renders the host and
  // the display previews on one page. A second `<header>` naming the same team
  // there turns `header >> text=<team>` from one match into two.
  return (
    <div className={styles.marquee}>
      <span className={styles.marqueeBulbs} aria-hidden="true" />
      <h2 className={styles.marqueeTeamName}>{activeTeamName ?? ""}</h2>
      <span className={styles.marqueeTitle}>
        {displaySongGuessSurfaceCopy.showTitle}
      </span>
      <div className={styles.marqueeCounter}>{songCounter}</div>
    </div>
  );
};

const SongGuessPlayBody = ({
  view
}: {
  view: SongGuessMinigameDisplayView;
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
    return (
      <div className={styles.body} data-song-guess-reveal>
        <span className={styles.revealLabel}>
          {displaySongGuessSurfaceCopy.revealLabel}
        </span>
        <p className={styles.revealTitle}>{view.reveal.title}</p>
        <p className={styles.revealArtist}>
          <span className={styles.revealArtistPrefix}>
            {displaySongGuessSurfaceCopy.revealArtistPrefix}
          </span>
          {view.reveal.artist}
        </p>
      </div>
    );
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
  serverOrigin
}: MinigameDisplayRendererProps): JSX.Element => {
  const songGuessView =
    minigameDisplayView?.minigame === "SONG_GUESS" ? minigameDisplayView : null;
  const mediaRef = useRef<HTMLAudioElement | null>(null);

  useSongAudioPlayback({ view: songGuessView, serverOrigin, mediaRef });

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
          />
          <SongGuessPlayBody view={songGuessView} />
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
