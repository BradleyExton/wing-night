import { createDevManifest } from "@wingnight/minigames-core";

// Mirrors the first eight entries of content/sample/minigames/song-guess.json
// so sandbox play matches a real night: the two fixture teams get the two
// non-overlapping four-song slices the seeded selection hands out.
//
// Audio is not committed to the repo, so the sandbox plays silently — the
// phase machine, controls, and scoring are all exercised regardless.
const DEV_CONTENT = {
  prompts: [
    {
      id: "song-teen-spirit",
      file: "smells-like-teen-spirit.mp3",
      clipStart: 12.5,
      clipEnd: 27,
      revealStart: 45,
      correctTitle: "Smells Like Teen Spirit",
      correctArtist: "Nirvana",
      difficulty: "easy",
      hint: "Grunge anthem that opened the nineties"
    },
    {
      id: "song-billie-jean",
      file: "billie-jean.mp3",
      clipStart: 8,
      clipEnd: 22,
      revealStart: 40,
      correctTitle: "Billie Jean",
      correctArtist: "Michael Jackson",
      difficulty: "easy",
      hint: "That bassline, and a lover who is not the one"
    },
    {
      id: "song-sweet-dreams",
      file: "sweet-dreams.mp3",
      clipStart: 5,
      clipEnd: 19,
      revealStart: 36,
      correctTitle: "Sweet Dreams (Are Made of This)",
      correctArtist: "Eurythmics",
      difficulty: "medium",
      hint: "Who am I to disagree?"
    },
    {
      id: "song-lose-yourself",
      file: "lose-yourself.mp3",
      clipStart: 26,
      clipEnd: 41,
      revealStart: 58,
      correctTitle: "Lose Yourself",
      correctArtist: "Eminem",
      difficulty: "medium",
      hint: "Palms are sweaty"
    },
    {
      id: "song-dont-stop-believin",
      file: "dont-stop-believin.mp3",
      clipStart: 3,
      clipEnd: 18,
      revealStart: 44,
      correctTitle: "Don't Stop Believin'",
      correctArtist: "Journey",
      difficulty: "easy",
      hint: "A small-town girl, a midnight train"
    },
    {
      id: "song-take-on-me",
      file: "take-on-me.mp3",
      clipStart: 10,
      clipEnd: 24,
      revealStart: 38,
      correctTitle: "Take On Me",
      correctArtist: "a-ha",
      difficulty: "easy",
      hint: "Pencil-sketch video, impossible high note"
    },
    {
      id: "song-wonderwall",
      file: "wonderwall.mp3",
      clipStart: 14,
      clipEnd: 28,
      revealStart: 52,
      correctTitle: "Wonderwall",
      correctArtist: "Oasis",
      difficulty: "easy",
      hint: "Every acoustic guitar at every party, ever"
    },
    {
      id: "song-baby-got-back",
      file: "baby-got-back.mp3",
      clipStart: 18,
      clipEnd: 32,
      revealStart: 47,
      correctTitle: "Baby Got Back",
      correctArtist: "Sir Mix-a-Lot",
      difficulty: "medium",
      hint: "The lounge treatment makes this one worse, somehow"
    }
  ]
};

export const songGuessDevManifest = createDevManifest({
  rules: { songsPerTurn: 4 },
  content: DEV_CONTENT
});
