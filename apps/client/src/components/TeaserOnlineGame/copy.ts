import type { TeaserRoomGame, TeaserRoomRefusal } from "@wingnight/shared";

// What changes from one game's room to the other's: its name, its pitch, the share sheet's words,
// and how the end card and the lobby count put it.
type OnlineGameCopy = {
  title: string;
  lede: string;
  shareTitle: string;
  shareText: string;
  seated: (count: number, max: number) => string;
  startHint: string;
  finishedLine: (banked: number, total: number) => string;
};

export const onlineGameCopy: Record<TeaserRoomGame, OnlineGameCopy> = {
  BRAWL: {
    title: "Streets of Barrie, together",
    lede: "Two to five phones, one street, wherever you all are. Make a room and send the link.",
    shareTitle: "Streets of Barrie on Wing Night",
    shareText: "Come peck some geese with me.",
    seated: (count, max) => `${count} of ${max} on the street`,
    startHint: "Anyone in the room can start it. Turn your phone sideways.",
    finishedLine: (banked, total) => `Worth ${banked} of the street's ${total}.`
  },
  BORDEN: {
    title: "Base Borden",
    lede: "Two to four phones run the base two at a time, spraying hot sauce, wherever you all are. Make a room and send the link.",
    shareTitle: "Base Borden on Wing Night",
    shareText: "Run the base with me. Bring sauce.",
    seated: (count, max) => `${count} of ${max} at the fence`,
    startHint: "Anyone in the room can start it. Pairs take turns, so you might watch a stretch first. Turn your phone sideways.",
    finishedLine: (banked, total) => `Worth ${banked} of the base's ${total}.`
  }
};

export const teaserOnlineGameCopy = {
  back: "Wing Night",
  makeRoom: "Make a room",
  roomTag: (code: string): string => `Room ${code}`,
  share: "Share the link",
  copied: "Link copied",
  pickHeading: "Who are you?",
  pickHint: "Tap your own bird. One phone each.",
  you: "you",
  taken: "taken",
  away: "away",
  start: "Start",
  needSeat: "Pick your bird to play.",
  watching: "A game is on. You'll be in the next one.",
  connecting: "Finding the room…",
  reconnecting: "Lost the room — trying again…",
  ping: (ms: number | null): string => (ms === null ? "" : `${Math.round(ms)} ms to the room`),
  best: (points: number): string => `This phone's best: ${points} out of 15`,
  finishedHeadline: (points: number | null): string => (points === null ? "Done" : `${points} out of 15`),
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
