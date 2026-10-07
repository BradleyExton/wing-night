// Every word on /me outside its two cards.
export const portalProfileCopy = {
  eyebrow: "Your seat",
  greeting: (displayName: string): string => `Hey, ${displayName}.`,
  loadingTitle: "One moment.",
  failedTitle: "Something went sideways.",
  failedBody: "We couldn't load your page. Refresh to try again.",
  adminLink: "Admin",
  homeLink: "Home"
} as const;
