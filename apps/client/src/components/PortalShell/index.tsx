import type { ReactNode } from "react";

import { TEASER_ROUTES } from "../TeaserApp/teaserRoutes";
import { portalShellCopy } from "./copy";
import * as styles from "./styles";

export type PortalShellLink = {
  label: string;
  href: string;
};

type PortalShellProps = {
  eyebrow: string;
  title: string;
  links?: PortalShellLink[];
  // Shown once the page knows who is signed in.
  onSignOut?: () => void;
  children?: ReactNode;
};

// Every guest-portal page's frame: the wordmark home, the page's way out, and its greeting over
// a column of cards (styles.ts carries the cards' kit for the pages to share).
export const PortalShell = ({ eyebrow, title, links = [], onSignOut, children }: PortalShellProps): JSX.Element => {
  return (
    <main className={styles.root}>
      <div className={styles.column}>
        <div className={styles.topBar}>
          <a className={styles.wordmark} href={TEASER_ROUTES.home}>
            {portalShellCopy.brandLabel}
          </a>
          <div className={styles.topLinks}>
            {links.map((link) => (
              <a key={link.href} className={styles.navLink} href={link.href}>
                {link.label}
              </a>
            ))}
            {onSignOut !== undefined && (
              <button type="button" className={styles.navLink} onClick={onSignOut}>
                {portalShellCopy.signOut}
              </button>
            )}
          </div>
        </div>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
        </div>
        {children}
      </div>
    </main>
  );
};
