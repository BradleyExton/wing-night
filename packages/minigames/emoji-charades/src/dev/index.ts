import { createDevManifest } from "@wingnight/minigames-core";

// Mirrors a slice of content/sample/minigames/emoji-charades.json so sandbox
// play matches a real night without filesystem access from the browser. The
// short deck is deliberate: it exercises the pointsMax selectability gate.
const DEV_CONTENT = {
  decks: [
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
    },
    {
      id: "tiny-deck",
      label: "Quick Two (too short)",
      subjects: [
        { id: "sunrise", text: "Sunrise" },
        { id: "road-trip", text: "Road trip" }
      ]
    }
  ]
};

export const emojiCharadesDevManifest = createDevManifest({
  rules: null,
  content: DEV_CONTENT,
  pointsMax: 6
});
