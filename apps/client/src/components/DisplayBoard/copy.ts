import { displayCopy } from "../../copy/display";

export const displayBoardCopy = {
  ...displayCopy,
  title: displayCopy.placeholderTitle
} as const;
