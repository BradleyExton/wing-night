import { useCallback, useEffect, useMemo } from "react";
import { resolveThemeTeam, type PortalAvatarStatus } from "@wingnight/shared/guestPortal";

import { resolveTeamThemeById } from "../../utils/resolveTeamTheme";
import { usePortalMe } from "../../utils/usePortalMe";
import { usePortalTeams } from "../../utils/usePortalTeams";
import * as shellStyles from "../PortalShell/styles";
import { PortalShell, type PortalShellLink } from "../PortalShell";
import { TEASER_ROUTES } from "../TeaserApp/teaserRoutes";
import { AvatarStudio } from "./AvatarStudio";
import { portalProfileCopy } from "./copy";
import { TeamPickCard } from "./TeamPickCard";
import { useTeamPick } from "./useTeamPick";
import * as styles from "./styles";

const NO_THEMES = new Map<string, never>();

// /me: a signed-in guest's page — their head, then their team. The team list and the pick in
// flight sit here, above both cards, because the studio's bird dresses as the picked team the
// moment a tile is tapped. Without a session it sends them to sign in.
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
        <AvatarStudio displayName={me.displayName} avatar={me.avatar} theme={shownTheme} onAvatar={handleAvatar} />
        <TeamPickCard teams={teams.state} pick={pick} themeById={themeById} />
      </div>
    </PortalShell>
  );
};
