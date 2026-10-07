import { useCallback, useEffect, useState } from "react";
import { PORTAL_API_ROUTES, isPortalMe, type PortalMe } from "@wingnight/shared/guestPortal";

import { isAnyBody, requestPortal, type PortalFailure } from "../portalApi";

export type PortalMeState =
  | { kind: "loading" }
  | { kind: "signedOut" }
  | { kind: "failed"; error: PortalFailure }
  | { kind: "ready"; me: PortalMe };

export type PortalMeHandle = {
  state: PortalMeState;
  // A section that changed the guest (a head accepted, a vote saved) hands back the new copy.
  update: (next: (me: PortalMe) => PortalMe) => void;
  signOut: () => Promise<void>;
};

// Who is signed in, read once when a portal page opens. A 401 is a state, not an error: the page
// sends the guest to sign in.
export const usePortalMe = (): PortalMeHandle => {
  const [state, setState] = useState<PortalMeState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    void requestPortal(PORTAL_API_ROUTES.me, isPortalMe).then((result) => {
      if (cancelled) {
        return;
      }

      if (result.ok) {
        setState({ kind: "ready", me: result.body });
      } else {
        setState(result.status === 401 ? { kind: "signedOut" } : { kind: "failed", error: result.error });
      }
    });

    return (): void => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((next: (me: PortalMe) => PortalMe): void => {
    setState((current) => (current.kind === "ready" ? { kind: "ready", me: next(current.me) } : current));
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await requestPortal(PORTAL_API_ROUTES.signOut, isAnyBody, { method: "POST" });
    setState({ kind: "signedOut" });
  }, []);

  return { state, update, signOut };
};
