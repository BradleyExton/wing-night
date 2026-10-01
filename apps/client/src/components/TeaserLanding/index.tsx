import { useMemo, useRef } from "react";

import type { TeaserRoster } from "../../utils/parseTeaserRoster";
import { resolveTeamThemeById } from "../../utils/resolveTeamTheme";
import { useMediaQuery } from "../../utils/useMediaQuery";
import { useBeatClock } from "../DisplayBoard/useBeatClock";
import { CastParade } from "../DisplayBoard/StageSurface/SetupStageBody/CastParade";
import { Embers } from "../DisplayBoard/StageSurface/SetupStageBody/Embers";
import { HeroFlame } from "../DisplayBoard/StageSurface/SetupStageBody/HeroFlame";
import * as lobbyStyles from "../DisplayBoard/StageSurface/SetupStageBody/styles";
import { resolveTeaserGameHref } from "../TeaserApp/teaserRoutes";
import { dunlopDashGame, fappyBirdGame, slingshlongGame, streetsOfBarrieGame } from "../TeaserSoloGame/teaserGames";
import { teaserLandingCopy } from "./copy";
import { TeaserCountdown } from "./TeaserCountdown";
import { TeaserGameCard } from "./TeaserGameCard";
import { TeaserMusicToggle } from "./TeaserMusicToggle";
import { TEASER_PARTY_STARTS_AT } from "./teaserEvent";
import { useTeaserLobbyMusic } from "./useTeaserLobbyMusic";
import * as styles from "./styles";

type TeaserLandingProps = {
  roster: TeaserRoster;
};

// Set only when the build carries the lobby's song (vite.teaser.config.ts).
const LOBBY_TRACK_SRC = import.meta.env.VITE_TEASER_LOBBY_TRACK_SRC;

// A phone's floor is too narrow for two teams abreast; past this the parade pairs them as the TV does.
const WIDE_FLOOR_QUERY = "(min-width: 640px)";

// The teaser's front page is the TV's lobby (SetupStageBody): the same flame, embers and floor,
// the night's own cast parading across it, and the wordmark. Where the lobby lists the rounds,
// the teaser counts down to the night and offers the games you can warm up on — all of it on
// one phone screen, with nothing to scroll to. The lobby's song plays on a tap of its pill, and
// the parade dances to it through the TV's own beat clock (keeping its own time until then).
export const TeaserLanding = ({ roster }: TeaserLandingProps): JSX.Element => {
  const teamThemeByTeamId = useMemo(() => resolveTeamThemeById(roster.teams), [roster.teams]);
  const hasWideFloor = useMediaQuery(WIDE_FLOOR_QUERY);
  const rootRef = useRef<HTMLElement | null>(null);
  const music = useTeaserLobbyMusic();

  useBeatClock({ mediaRef: music.mediaRef, audioUnlocked: music.isTapped, rootRef });

  return (
    <main ref={rootRef} className={styles.container}>
      <span className={lobbyStyles.ambient} aria-hidden />
      <span className={lobbyStyles.heatBloom} aria-hidden />
      <HeroFlame />
      <Embers />
      <span className={lobbyStyles.vignette} aria-hidden />
      <span className={lobbyStyles.grain} aria-hidden />
      <span className={lobbyStyles.floor} aria-hidden />
      <div className={styles.paradeStrip}>
        <CastParade
          players={roster.players}
          teams={roster.teams}
          teamThemeByTeamId={teamThemeByTeamId}
          lineup={hasWideFloor ? "pairs" : "solo"}
        />
      </div>
      <span className={lobbyStyles.floorBloom} aria-hidden />

      <div className={styles.header}>
        <div className={lobbyStyles.eyebrowRow}>
          <span className={lobbyStyles.eyebrowRuleLeft} aria-hidden />
          <span className={lobbyStyles.eyebrow}>{teaserLandingCopy.eyebrow}</span>
          <span className={lobbyStyles.eyebrowRuleRight} aria-hidden />
        </div>
        <div className={lobbyStyles.headingGlow}>
          <h1 className={styles.heading}>{teaserLandingCopy.brandLabel}</h1>
        </div>
        <p className={styles.tagline}>
          <span className={styles.taglineLine}>{teaserLandingCopy.taglineLead}</span>
          <span className={styles.taglineLine}>{teaserLandingCopy.taglineCall}</span>
        </p>
      </div>

      <TeaserCountdown startsAt={TEASER_PARTY_STARTS_AT} />

      <section className={styles.games}>
        <h2 className={styles.gamesHeading}>{teaserLandingCopy.gamesHeading}</h2>
        <div className={styles.gameList}>
          <TeaserGameCard
            minigame="SCHLONIC"
            title={teaserLandingCopy.dunlopDashTitle}
            summary={teaserLandingCopy.dunlopDashSummary}
            href={resolveTeaserGameHref(dunlopDashGame.slug)}
            statusLabel={teaserLandingCopy.playLabel}
          />
          <TeaserGameCard
            minigame="FAPPY"
            title={teaserLandingCopy.fappyTitle}
            summary={teaserLandingCopy.fappySummary}
            href={resolveTeaserGameHref(fappyBirdGame.slug)}
            statusLabel={teaserLandingCopy.playLabel}
          />
          <TeaserGameCard
            minigame="JOUST"
            title={teaserLandingCopy.slingshlongTitle}
            summary={teaserLandingCopy.slingshlongSummary}
            href={resolveTeaserGameHref(slingshlongGame.slug)}
            statusLabel={teaserLandingCopy.playLabel}
          />
          <TeaserGameCard
            minigame="BRAWL"
            title={teaserLandingCopy.streetsOfBarrieTitle}
            summary={teaserLandingCopy.streetsOfBarrieSummary}
            href={resolveTeaserGameHref(streetsOfBarrieGame.slug)}
            statusLabel={teaserLandingCopy.playLabel}
          />
        </div>
      </section>

      {LOBBY_TRACK_SRC !== undefined && (
        <>
          <audio ref={music.mediaRef} src={LOBBY_TRACK_SRC} loop preload="none" />
          <TeaserMusicToggle
            trackSrc={LOBBY_TRACK_SRC}
            isPlaying={music.isPlaying}
            onToggle={music.toggle}
          />
        </>
      )}
    </main>
  );
};
