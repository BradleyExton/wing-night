import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplayEmojiCharadesSurface } from "./DisplayEmojiCharadesSurface/index.js";
import { HostEmojiCharadesSurface } from "./HostEmojiCharadesSurface/index.js";

export const emojiCharadesRendererBundle: MinigameRendererBundle = {
  HostSurface: HostEmojiCharadesSurface,
  DisplaySurface: DisplayEmojiCharadesSurface
};
