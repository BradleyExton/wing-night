import { createDevManifest, type SerializableValue } from "@wingnight/minigames-core";
import type { EmojiCharadesContentFile } from "@wingnight/shared";

// Mirrors a slice of content/sample/minigames/emoji-charades.json so sandbox
// play matches a real night without filesystem access from the browser. The
// room deck leads because the deck a turn is dealt is the first one long
// enough to carry it; the decks under it are the fallbacks nobody should ever
// see. Rob keeps his locked picker here so the joke is previewable.
const DEV_CONTENT: EmojiCharadesContentFile = {
  decks: [
    {
      id: "the-room",
      label: "People in This Room",
      subjects: [
        { id: "alex-m", text: "Alex M" },
        { id: "kaitlyn", text: "Kaitlyn" },
        { id: "dan-b", text: "Dan B" },
        { id: "rosi", text: "Rosi" },
        { id: "darren-m", text: "Darren M" },
        { id: "steve-burke", text: "Steve Burke" },
        {
          id: "rob-barnes",
          text: "Rob Barnes",
          lockedEmojis: [
            "✡️", "🕎", "🕍", "🕯️", "📜", "🍷",
            "🥯", "🍎", "🍯", "🐏", "🧔", "🙏"
          ]
        }
      ]
    },
    {
      id: "movies",
      label: "Movies",
      subjects: [
        { id: "jurassic-park", text: "Jurassic Park" },
        { id: "titanic", text: "Titanic" },
        { id: "jaws", text: "Jaws" },
        { id: "home-alone", text: "Home Alone" },
        { id: "the-lion-king", text: "The Lion King" },
        { id: "ghostbusters", text: "Ghostbusters" }
      ]
    },
    {
      id: "around-the-house",
      label: "Around the House",
      subjects: [
        { id: "dishwasher", text: "Dishwasher" },
        { id: "smoke-alarm", text: "Smoke alarm" },
        { id: "junk-drawer", text: "Junk drawer" },
        { id: "rubber-duck", text: "Rubber duck" },
        { id: "houseplant", text: "Houseplant" },
        { id: "mousetrap", text: "Mousetrap" }
      ]
    }
  ]
};

export const emojiCharadesDevManifest = createDevManifest({
  rules: null,
  // `lockedEmojis` is optional, and an optional property is not expressible in
  // SerializableValue — the same crossing the runtime's content adapter makes.
  content: DEV_CONTENT as unknown as SerializableValue,
  pointsMax: 6
});
