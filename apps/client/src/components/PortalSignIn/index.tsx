import { useState, type FormEvent } from "react";
import { PORTAL_API_ROUTES } from "@wingnight/shared/guestPortal";

import { isAnyBody, jsonRequest, requestPortal } from "../../utils/portalApi";
import * as shellStyles from "../PortalShell/styles";
import { PortalShell } from "../PortalShell";
import { TEASER_ROUTES } from "../TeaserApp/teaserRoutes";
import { portalSignInCopy } from "./copy";
import * as styles from "./styles";

type SendState = "idle" | "sending" | "sent" | "failed";

// /signin: where a guest without a session lands. The personal link in their invite is the way
// in; this asks the portal to email a fresh one.
export const PortalSignIn = (): JSX.Element => {
  const [email, setEmail] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSendState("sending");
    const result = await requestPortal(PORTAL_API_ROUTES.emailLink, isAnyBody, jsonRequest("POST", { email }));
    setSendState(result.ok ? "sent" : "failed");
  };

  return (
    <PortalShell
      eyebrow={portalSignInCopy.eyebrow}
      title={portalSignInCopy.title}
      links={[{ label: portalSignInCopy.homeLink, href: TEASER_ROUTES.home }]}
    >
      <section className={shellStyles.card}>
        <p className={shellStyles.eyebrow}>{portalSignInCopy.cardEyebrow}</p>
        <h2 className={shellStyles.cardTitle}>{portalSignInCopy.cardTitle}</h2>
        <p className={shellStyles.voice}>{portalSignInCopy.body}</p>
        <form className={styles.form} onSubmit={(event): void => void submit(event)}>
          <label className={shellStyles.field}>
            <span className={shellStyles.fieldLabel}>{portalSignInCopy.emailLabel}</span>
            <input
              className={shellStyles.input}
              type="email"
              required
              autoComplete="email"
              placeholder={portalSignInCopy.emailPlaceholder}
              value={email}
              onChange={(event): void => setEmail(event.target.value)}
            />
          </label>
          <button type="submit" className={shellStyles.buttonPrimary} disabled={sendState === "sending"}>
            {sendState === "sending" ? portalSignInCopy.sending : portalSignInCopy.send}
          </button>
        </form>
        <p className={sendState === "failed" ? shellStyles.statusError : shellStyles.status} role="status">
          {sendState === "sent" ? portalSignInCopy.sent : sendState === "failed" ? portalSignInCopy.failed : ""}
        </p>
      </section>
    </PortalShell>
  );
};
