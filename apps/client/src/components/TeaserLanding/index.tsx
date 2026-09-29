import { useMemo } from "react";

import type { TeaserRoster } from "../../utils/parseTeaserRoster";
import { resolveTeamThemeById } from "../../utils/resolveTeamTheme";
import { CastParade } from "../DisplayBoard/StageSurface/SetupStageBody/CastParade";
import { Embers } from "../DisplayBoard/StageSurface/SetupStageBody/Embers";
import { HeroFlame } from "../DisplayBoard/StageSurface/SetupStageBody/HeroFlame";
import * as lobbyStyles from "../DisplayBoard/StageSurface/SetupStageBody/styles";
import { resolveTeaserGameHref } from "../TeaserApp/teaserRoutes";
import { dunlopDashGame, fappyBirdGame, slingshlongGame } from "../TeaserSoloGame/teaserGames";
import { teaserLandingCopy } from "./copy";
import { TeaserCountdown } from "./TeaserCountdown";
import { TeaserGameCard } from "./TeaserGameCard";
import { TEASER_PARTY_STARTS_AT } from "./teaserEvent";
import * as styles from "./styles";

type TeaserLandingProps = {
  roster: TeaserRoster;
};

// The teaser's front page is the TV's lobby (SetupStageBody): the same flame, embers and floor,
// the night's own cast parading two teams at a time, and the wordmark. Where the lobby lists the
// rounds, the teaser counts down to the night and offers the games you can warm up on.
export const TeaserLanding = ({ roster }: TeaserLandingProps): JSX.Element => {
  const teamThemeByTeamId = useMemo(() => resolveTeamThemeById(roster.teams), [roster.teams]);

  return (
    <main className={styles.container}>
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
        />
      </div>
      <span className={lobbyStyles.floorBloom} aria-hidden />

      <div className={lobbyStyles.header}>
        <div className={lobbyStyles.eyebrowRow}>
          <span className={lobbyStyles.eyebrowRuleLeft} aria-hidden />
          <span className={lobbyStyles.eyebrow}>{teaserLandingCopy.eyebrow}</span>
          <span className={lobbyStyles.eyebrowRuleRight} aria-hidden />
        </div>
        <div className={lobbyStyles.headingGlow}>
          <h1 className={styles.heading}>{teaserLandingCopy.brandLabel}</h1>
        </div>
        <p className={styles.tagline}>{teaserLandingCopy.tagline}</p>
      </div>

      <TeaserCountdown startsAt={TEASER_PARTY_STARTS_AT} />

      <section className={styles.games}>
        <h2 className={styles.gamesHeading}>{teaserLandingCopy.gamesHeading}</h2>
        <div className={styles.gameGrid}>
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
        </div>
      </section>
    </main>
  );
};
