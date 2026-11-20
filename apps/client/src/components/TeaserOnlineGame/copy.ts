import type { TeaserRoomRefusal } from "@wingnight/shared";

export const teaserOnlineGameCopy = {
  back: "Wing Night",
  title: "Streets of Barrie, together",
  lede: "Two to five phones, one street, wherever you all are. Make a room and send the link.",
  makeRoom: "Make a room",
  roomTag: (code: string): string => `Room ${code}`,
  share: "Share the link",
  copied: "Link copied",
  shareTitle: "Streets of Barrie on Wing Night",
  shareText: "Come peck some geese with me.",
  pickHeading: "Who are you?",
  pickHint: "Tap your own bird. One phone each.",
  you: "you",
  taken: "taken",
  away: "away",
  seated: (count: number, max: number): string => `${count} of ${max} on the street`,
  start: "Start",
  startHint: "Anyone in the room can start it. Turn your phone sideways.",
  needSeat: "Pick your bird to play.",
  watching: "A game is on. You'll be in the next one.",
  connecting: "Finding the room…",
  reconnecting: "Lost the room — trying again…",
  ping: (ms: number | null): string => (ms === null ? "" : `${Math.round(ms)} ms to the room`),
  finishedKicker: "Streets of Barrie",
  finishedHeadline: (points: number | null): string => (points === null ? "Done" : `${points} out of 15`),
  finishedLine: (banked: number, total: number): string => `Worth ${banked} of the street's ${total}.`,
  playAgain: "Play again",
  refusals: {
    full: "The room is full.",
    malformed: "That didn't send. Try again.",
    rate_limited: "Easy — too many taps at once.",
    seat_taken: "Someone else is already that bird.",
    not_seated: "Pick your bird first.",
    refused: "Not right now."
  } satisfies Record<TeaserRoomRefusal, string>
} as const;
