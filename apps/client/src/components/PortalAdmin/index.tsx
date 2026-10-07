import { useEffect } from "react";

import { usePortalMe } from "../../utils/usePortalMe";
import * as shellStyles from "../PortalShell/styles";
import { PortalShell } from "../PortalShell";
import { TEASER_ROUTES } from "../TeaserApp/teaserRoutes";
import { AdminGuestList } from "./AdminGuestList";
import { AdminHeadGallery } from "./AdminHeadGallery";
import { AdminVoteSummary } from "./AdminVoteSummary";
import { portalAdminCopy } from "./copy";
import { useAdminData } from "./useAdminData";
import * as styles from "./styles";

// /admin: Brad's page. A guest who is not an admin gets a polite no (the API refuses them
// anyway); nobody signed in is sent to sign in.
export const PortalAdmin = (): JSX.Element => {
  const { state, signOut } = usePortalMe();
  const isAdmin = state.kind === "ready" && state.me.isAdmin;
  const { data, reload } = useAdminData(isAdmin);
  const myPage = [{ label: portalAdminCopy.myPageLink, href: TEASER_ROUTES.me }];

  useEffect(() => {
    if (state.kind === "signedOut") {
      window.location.replace(TEASER_ROUTES.signIn);
    }
  }, [state.kind]);

  if (state.kind === "ready" && !isAdmin) {
    return (
      <PortalShell eyebrow={portalAdminCopy.forbiddenEyebrow} title={portalAdminCopy.forbiddenTitle} links={myPage}>
        <p className={shellStyles.voice}>{portalAdminCopy.forbiddenBody}</p>
      </PortalShell>
    );
  }

  if (state.kind === "failed" || data.kind === "failed") {
    return (
      <PortalShell eyebrow={portalAdminCopy.eyebrow} title={portalAdminCopy.failedTitle} links={myPage}>
        <p className={shellStyles.voice}>{portalAdminCopy.failedBody}</p>
      </PortalShell>
    );
  }

  if (data.kind !== "ready") {
    return <PortalShell eyebrow={portalAdminCopy.eyebrow} title={portalAdminCopy.loadingTitle} />;
  }

  return (
    <PortalShell
      eyebrow={portalAdminCopy.eyebrow}
      title={portalAdminCopy.title}
      links={myPage}
      onSignOut={(): void => void signOut()}
    >
      <div className={styles.cards}>
        <AdminGuestList guests={data.guests} onChanged={reload} />
        <AdminHeadGallery guests={data.guests} onChanged={reload} />
        <AdminVoteSummary summary={data.votes} />
      </div>
    </PortalShell>
  );
};
