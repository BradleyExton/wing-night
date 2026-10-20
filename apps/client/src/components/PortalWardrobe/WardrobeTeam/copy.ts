// Every word in the wardrobe's team strip.
export const wardrobeTeamCopy = {
  eyebrow: "Your team in the parade",
  fine: "Live from your teammates' wardrobes. Changes reach the TV at Brad's last pull before the night.",
  alone: "Your teammates dance in here once they pick the team.",
  you: "You",
  birdLabel: (name: string, isMe: boolean): string => (isMe ? "Your bird, dancing" : `${name}'s bird, dancing`)
} as const;
