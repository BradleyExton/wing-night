import { useCallback, useEffect, useMemo } from "react";
import { PORTAL_API_ROUTES, resolveThemeTeam, type PortalAvatarStatus } from "@wingnight/shared/guestPortal";

import { resolveTeamThemeById } from "../../utils/resolveTeamTheme";
import { usePortalMe } from "../../utils/usePortalMe";
import { usePortalTeams } from "../../utils/usePortalTeams";
import * as shellStyles from "../PortalShell/styles";
import { PortalShell, type PortalShellLink } from "../PortalShell";
import { resolveGenreOutfit } from "../PortalWardrobe/wardrobeState";
import { TEASER_ROUTES } from "../TeaserApp/teaserRoutes";
import { AvatarStudio } from "./AvatarStudio";
import { portalProfileCopy } from "./copy";
import { TeamPickCard } from "./TeamPickCard";
import { useTeamPick } from "./useTeamPick";
import { YourBirdCard } from "./YourBirdCard";
import * as styles from "./styles";

const NO_THEMES = new Map<string, never>();

// /me: a signed-in guest's page — their head, their team, then their bird. The team list and the
// pick in flight sit here, above the cards, because every bird on the page dresses as the picked
// team the moment a tile is tapped: its kit, and the outfit the guest built for its genre — a
// costume change they watch (docs/research/bird-wardrobe.md §2.4). Without a session it sends them
// to sign in.
export const PortalProfile = (): JSX.Element => {
  const { state, update, signOut } = usePortalMe();
  const teams = usePortalTeams(state.kind === "ready");
  const me = state.kind === "ready" ? state.me : null;
  const pick = useTeamPick({ storedPick: me?.team?.teamName ?? null, update, teams });

  useEffect(() => {
    if (state.kind === "signedOut") {
      window.location.replace(TEASER_ROUTES.signIn);
    }
  }, [state.kind]);

  const handleAvatar = useCallback(
    (avatar: PortalAvatarStatus): void => update((me) => ({ ...me, avatar, hasHead: avatar.headHash !== null })),
    [update]
  );

  // Themes keyed by team id, resolved in seating order (the colour collision pass). A pick names
  // a team by name, so the shown pick's theme is found through the list.
  const themeById = useMemo(
    () => (teams.state.kind === "ready" ? resolveTeamThemeById(teams.state.teams.teams.map(resolveThemeTeam)) : NO_THEMES),
    [teams.state]
  );
  const shownTeam =
    teams.state.kind === "ready" ? teams.state.teams.teams.find((team) => team.name === pick.shownPick) : undefined;
  const shownTheme = shownTeam === undefined ? undefined : themeById.get(shownTeam.id);
  const shownOutfit = shownTheme === undefined ? {} : resolveGenreOutfit(me?.team?.outfitsByGenre, shownTheme.genre);

  if (me === null) {
    return (
      <PortalShell
        eyebrow={portalProfileCopy.eyebrow}
        title={state.kind === "failed" ? portalProfileCopy.failedTitle : portalProfileCopy.loadingTitle}
      >
        {state.kind === "failed" && <p className={shellStyles.voice}>{portalProfileCopy.failedBody}</p>}
      </PortalShell>
    );
  }

  const links: PortalShellLink[] = me.isAdmin
    ? [{ label: portalProfileCopy.adminLink, href: TEASER_ROUTES.admin }]
    : [{ label: portalProfileCopy.homeLink, href: TEASER_ROUTES.home }];

  return (
    <PortalShell
      eyebrow={portalProfileCopy.eyebrow}
      title={portalProfileCopy.greeting(me.displayName)}
      links={links}
      onSignOut={(): void => void signOut()}
    >
      <div className={styles.cards}>
        <AvatarStudio
          displayName={me.displayName}
          avatar={me.avatar}
          theme={shownTheme}
          outfit={shownOutfit}
          onAvatar={handleAvatar}
        />
        <TeamPickCard teams={teams.state} pick={pick} themeById={themeById} />
        <YourBirdCard
          displayName={me.displayName}
          headSrc={me.avatar.headHash === null ? null : `${PORTAL_API_ROUTES.myAvatar}?v=${me.avatar.headHash}`}
          theme={shownTheme}
          outfit={shownOutfit}
        />
      </div>
    </PortalShell>
  );
};
