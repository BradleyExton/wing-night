export const devBoardCopy = {
  kicker: "Work log",
  heading: "Board",
  loading: "Reading the work log…",
  errorHeading: "Could not reach the work log",
  errorHint: "Start the server with WN_DEV_BOARD=1 pnpm dev, then reload.",
  nextBadge: "NEXT",
  emptyBucket: "Nothing here",
  waitingOnPrefix: "waiting on",
  bucketTitle: {
    inProgress: "In progress",
    readyPickable: "Ready to pick up",
    waitingOnDeps: "Waiting on deps",
    inReview: "In review",
    blocked: "Blocked",
    funnel: "Funnel"
  }
} as const;
