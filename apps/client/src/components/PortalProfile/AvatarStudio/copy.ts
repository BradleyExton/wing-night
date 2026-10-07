import type { StudioProblem } from "./useAvatarStudio";

// Every word in the head studio.
export const avatarStudioCopy = {
  eyebrow: "Your head",
  title: "Put your face on a bird",
  body: "Snap a selfie, face on, in good light. We paint it as a cartoon and sit it on your bird for the night.",
  privacy:
    "Your photo goes to Google's Gemini to paint the head, and is deleted once you keep one (or remove it). Your head is shown on the TV at the party, and Brad may pick it as the style other heads are painted in.",
  birdLabelPreview: "Your painted head on your bird, not kept yet",
  birdLabelHead: "Your head on your bird",
  birdLabelNone: "Your bird, still waiting for a head",
  pillPreview: "Preview",
  pillHead: "Your head",
  pillNone: "No head yet",
  pillPhoto: "Photo ready",
  photoAlt: "The photo you picked",
  takeSelfie: "Take a selfie",
  choosePhoto: "Pick a photo",
  removePhoto: "Remove my photo",
  removingPhoto: "Removing…",
  paint: "Paint my head",
  painting: "Painting…",
  uploading: "Getting your photo ready…",
  keep: "Keep this one",
  keeping: "Keeping…",
  tryAgain: "Try again",
  triesLabel: "Tries left",
  outOfTries: "That's all your tries. Ask Brad — he can give you more.",
  problems: {
    unreadablePhoto: "That photo wouldn't open. Try another one.",
    photoTooLarge: "That photo is too big to send. Try another one.",
    noPhoto: "Pick a photo first.",
    triesExhausted: "That's all your tries. Ask Brad for more.",
    painterFailed: "The painter is busy. That try didn't count — have another go in a minute.",
    refused: "The painter wouldn't paint that one. Try a clearer photo, face on.",
    blank: "That paint came out blank. Have another go.",
    acceptFailed: "That didn't save. Try keeping it again.",
    removeFailed: "That didn't remove it. Try again.",
    network: "No connection. Check your signal and try again."
  } satisfies Record<StudioProblem, string>
} as const;

export const formatTries = (triesLeft: number, triesMax: number): string => `${triesLeft} / ${triesMax}`;
