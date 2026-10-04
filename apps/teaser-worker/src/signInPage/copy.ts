// Every word on the `/s/<token>` page.
export const signInPageCopy = {
  documentTitle: "Wing Night — sign in",
  wordmark: "Wing Night",
  ready: {
    heading: "You're on the list.",
    body: "Tap below to sign in on this device.",
    button: "Sign in"
  },
  invalid: {
    heading: "That link doesn't work any more.",
    body: "It may have expired, been used already, or been replaced by a newer one. We can email you a fresh one.",
    emailLabel: "Your email",
    button: "Email me a new link",
    sent: "If that address is on the guest list, a new link is on its way. It works for 30 minutes.",
    failed: "That didn't go through. Try again in a minute."
  },
  crossOrigin: {
    heading: "That sign-in came from somewhere else.",
    body: "Open your link straight from the email or message it came in."
  }
} as const;
