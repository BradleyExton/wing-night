// The page a sign-in link opens. Self-contained HTML from the Worker, not a teaser page: it has
// to work before the guest has a session, and it is a single button.
//
// The GET only ever draws this page. Mail scanners and link previews fetch every link in an
// email, so a GET that signed in or burned a token would be spent before the guest tapped it;
// the button POSTs to the same URL, and that is where the token is looked at.
import { PORTAL_API_ROUTES } from "@wingnight/shared/guestPortal";

import { escapeHtml } from "../http/index.ts";
import { signInPageCopy } from "./copy.ts";

export type SignInPageView = "ready" | "invalid" | "crossOrigin";

// The house colours (DESIGN.md §0.1: bg, surface, text, muted, primary, ember) and its two
// faces, served from the teaser's own /fonts.
const STYLES = `
@font-face { font-family: "Barlow Condensed"; font-weight: 800; font-display: swap;
  src: url("/fonts/barlow-condensed/barlow-condensed-800-latin.woff2") format("woff2"); }
@font-face { font-family: "Playfair Display"; font-style: italic; font-weight: 700; font-display: swap;
  src: url("/fonts/playfair-display/playfair-display-700-italic-latin.woff2") format("woff2"); }
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px 16px;
  background: radial-gradient(ellipse at 50% 120%, #2E1609 0%, #121212 60%); color: #FFFFFF;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
main { width: 100%; max-width: 420px; background: #1C1C1C; border-top: 1px solid #FFB35A;
  border-radius: 16px; padding: 32px 24px; text-align: center; }
.wordmark { margin: 0 0 20px; font-family: "Barlow Condensed", sans-serif; font-weight: 800;
  font-size: 40px; letter-spacing: 0.04em; text-transform: uppercase; }
h1 { margin: 0 0 12px; font-family: "Playfair Display", serif; font-style: italic; font-size: 24px; }
p { margin: 0 0 24px; color: #A3A3A3; line-height: 1.5; }
form { display: grid; gap: 12px; }
input { width: 100%; padding: 14px 16px; border-radius: 10px; border: 1px solid #242424;
  background: #121212; color: #FFFFFF; font-size: 16px; }
button { width: 100%; padding: 16px; border: 0; border-radius: 10px; background: #F97316;
  color: #121212; font-size: 18px; font-weight: 700; cursor: pointer; }
[role="status"] { margin: 16px 0 0; min-height: 1.5em; }
`;

const renderReady = (): string => `
<h1>${escapeHtml(signInPageCopy.ready.heading)}</h1>
<p>${escapeHtml(signInPageCopy.ready.body)}</p>
<form method="post"><button type="submit">${escapeHtml(signInPageCopy.ready.button)}</button></form>`;

// The re-send form posts JSON to the email-link API; its answer is the same whatever the
// address, so the page can only ever say "if you're on the list".
const renderInvalid = (): string => {
  const scriptCopy = JSON.stringify({
    route: PORTAL_API_ROUTES.emailLink,
    sent: signInPageCopy.invalid.sent,
    failed: signInPageCopy.invalid.failed
  }).replace(/</g, "\\u003c");

  return `
<h1>${escapeHtml(signInPageCopy.invalid.heading)}</h1>
<p>${escapeHtml(signInPageCopy.invalid.body)}</p>
<form id="relink">
  <input type="email" name="email" required autocomplete="email" aria-label="${escapeHtml(signInPageCopy.invalid.emailLabel)}" placeholder="${escapeHtml(signInPageCopy.invalid.emailLabel)}">
  <button type="submit">${escapeHtml(signInPageCopy.invalid.button)}</button>
</form>
<p role="status" id="relink-status"></p>
<script>
const copy = ${scriptCopy};
document.getElementById("relink").addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = document.getElementById("relink-status");
  const email = new FormData(event.target).get("email");
  try {
    const response = await fetch(copy.route, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    status.textContent = response.ok ? copy.sent : copy.failed;
  } catch {
    status.textContent = copy.failed;
  }
});
</script>`;
};

const renderCrossOrigin = (): string => `
<h1>${escapeHtml(signInPageCopy.crossOrigin.heading)}</h1>
<p>${escapeHtml(signInPageCopy.crossOrigin.body)}</p>`;

const VIEW_RENDERERS: Record<SignInPageView, () => string> = {
  ready: renderReady,
  invalid: renderInvalid,
  crossOrigin: renderCrossOrigin
};

export const renderSignInPage = (view: SignInPageView): string => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="referrer" content="no-referrer">
<title>${escapeHtml(signInPageCopy.documentTitle)}</title>
<style>${STYLES}</style>
</head>
<body>
<main>
<p class="wordmark">${escapeHtml(signInPageCopy.wordmark)}</p>
${VIEW_RENDERERS[view]()}
</main>
</body>
</html>
`;
