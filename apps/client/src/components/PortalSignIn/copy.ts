// Every word on /signin. Its answer is the same whatever the address, as the API's is: the page
// must never tell a stranger who is on the guest list.
export const portalSignInCopy = {
  eyebrow: "Guest list",
  title: "Sign in to the night.",
  cardEyebrow: "Your link",
  cardTitle: "Email me a way in",
  body: "Your invite had a link that signs you straight in. Lost it, or on a new phone? We'll email you a fresh one.",
  emailLabel: "Your email",
  emailPlaceholder: "you@example.com",
  send: "Email me a link",
  sending: "Sending…",
  sent: "If that address is on the guest list, a link is on its way. It works for 30 minutes.",
  failed: "That didn't go through. Try again in a minute.",
  homeLink: "Home"
} as const;
