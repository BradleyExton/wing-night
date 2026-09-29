import { useMemo } from "react";

import type { TeaserRoster } from "../../utils/parseTeaserRoster";
import { resolveTeamThemeById } from "../../utils/resolveTeamTheme";
import { CastParade } from "../DisplayBoard/StageSurface/SetupStageBody/CastParade";
import { Embers } from "../DisplayBoard/StageSurface/SetupStageBody/Embers";
import { HeroFlame } from "../DisplayBoard/StageSurface/SetupStageBody/HeroFlame";
import * as lobbyStyles from "../DisplayBoard/StageSurface/SetupStageBody/styles";
import { teaserLandingCopy } from "../TeaserLanding/copy";
import * as styles from "./styles";

type TeaserShareCardProps = {
  roster: TeaserRoster;
};

// The picture a text message shows when the link is shared (og:image), composed at 1200×630 and
// captured by tools/build-teaser/captureShareCard.mjs: the lobby, the wordmark, and the cast
// dancing big enough to spot your friends. Nothing links here; it is a page only to be a photo.
export const TeaserShareCard = ({ roster }: TeaserShareCardProps): JSX.Element => {
  const teamThemeByTeamId = useMemo(() => resolveTeamThemeById(roster.teams), [roster.teams]);

  return (
    <main className={styles.container} data-teaser-share-card>
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
      <div className={lobbyStyles.header}>
        <div className={lobbyStyles.eyebrowRow}>
          <span className={lobbyStyles.eyebrowRuleLeft} aria-hidden />
          <span className={lobbyStyles.eyebrow}>{teaserLandingCopy.eyebrow}</span>
          <span className={lobbyStyles.eyebrowRuleRight} aria-hidden />
        </div>
        <div className={lobbyStyles.headingGlow}>
          <h1 className={styles.heading}>{teaserLandingCopy.brandLabel}</h1>
        </div>
      </div>
    </main>
  );
};
