import { useCallback, useEffect } from "react";
import type { GuestVote, PortalAvatarStatus } from "@wingnight/shared/guestPortal";

import { usePortalMe } from "../../utils/usePortalMe";
import * as shellStyles from "../PortalShell/styles";
import { PortalShell, type PortalShellLink } from "../PortalShell";
import { TEASER_ROUTES } from "../TeaserApp/teaserRoutes";
import { AvatarStudio } from "./AvatarStudio";
import { portalProfileCopy } from "./copy";
import { VoteForm } from "./VoteForm";
import * as styles from "./styles";

// /me: a signed-in guest's page — their head, then their vote. Without a session it sends them
// to sign in.
export const PortalProfile = (): JSX.Element => {
  const { state, update, signOut } = usePortalMe();

  useEffect(() => {
    if (state.kind === "signedOut") {
      window.location.replace(TEASER_ROUTES.signIn);
    }
  }, [state.kind]);

  const handleAvatar = useCallback(
    (avatar: PortalAvatarStatus): void => update((me) => ({ ...me, avatar, hasHead: avatar.headHash !== null })),
    [update]
  );
  const handleVote = useCallback((vote: GuestVote): void => update((me) => ({ ...me, vote })), [update]);

  if (state.kind !== "ready") {
    return (
      <PortalShell
        eyebrow={portalProfileCopy.eyebrow}
        title={state.kind === "failed" ? portalProfileCopy.failedTitle : portalProfileCopy.loadingTitle}
      >
        {state.kind === "failed" && <p className={shellStyles.voice}>{portalProfileCopy.failedBody}</p>}
      </PortalShell>
    );
  }

  const { me } = state;
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
        <AvatarStudio displayName={me.displayName} avatar={me.avatar} onAvatar={handleAvatar} />
        <VoteForm guestId={me.guestId} vote={me.vote} onSaved={handleVote} />
      </div>
    </PortalShell>
  );
};
