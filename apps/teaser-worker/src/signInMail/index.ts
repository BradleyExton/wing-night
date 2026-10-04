// The two sign-in emails: Brad's invite, carrying the guest's personal link, and the one-off link
// a guest asks for.
import { escapeHtml } from "../http/index.ts";
import type { MailMessage } from "../mail/index.ts";
import { signInMailCopy } from "./copy.ts";

export type SignInMailKind = "invite" | "requested";

type SignInMailInput = {
  kind: SignInMailKind;
  to: string;
  displayName: string;
  url: string;
};

export const composeSignInMail = ({ kind, to, displayName, url }: SignInMailInput): MailMessage => {
  const copy = signInMailCopy[kind];
  const greeting = copy.greeting.replace("{name}", displayName);

  return {
    to,
    subject: copy.subject,
    text: `${greeting}\n\n${copy.body}\n\n${url}\n\n${signInMailCopy.footer}\n`,
    html: `<p>${escapeHtml(greeting)}</p>
<p>${escapeHtml(copy.body)}</p>
<p><a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 20px;border-radius:10px;background:#F97316;color:#121212;font-weight:700;text-decoration:none">${escapeHtml(copy.button)}</a></p>
<p style="color:#6B6157">${escapeHtml(url)}</p>
<p style="color:#6B6157">${escapeHtml(signInMailCopy.footer)}</p>`
  };
};
