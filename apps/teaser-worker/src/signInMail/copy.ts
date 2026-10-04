// Every word in a sign-in email. `{name}` and `{url}` are filled in by signInMail.
export const signInMailCopy = {
  invite: {
    subject: "You're invited to Wing Night",
    greeting: "Hey {name},",
    body: "You're on the list for Wing Night. This is your personal sign-in link — it keeps working, so keep this email:",
    button: "Sign in to Wing Night"
  },
  requested: {
    subject: "Your Wing Night sign-in link",
    greeting: "Hey {name},",
    body: "Here's the sign-in link you asked for. It works once, for the next 30 minutes:",
    button: "Sign in to Wing Night"
  },
  footer: "Didn't expect this? You can ignore it — nobody can sign in without the link."
} as const;
