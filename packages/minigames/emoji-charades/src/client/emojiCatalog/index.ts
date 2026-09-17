// The picker catalog is client-owned, not content-driven (spec §2). "Top" is
// the landing tab per DESIGN.md §2.6: frequency-ranked for charades rather
// than unicode order, so the likely next tap is already on screen.
export type EmojiCatalogSection = {
  id: string;
  label: string;
  emojis: string[];
};

export type EmojiCatalogTab = {
  id: string;
  label: string;
  icon: string;
  sections: EmojiCatalogSection[];
};

const section = (
  id: string,
  label: string,
  emojis: string[]
): EmojiCatalogSection => ({ id, label, emojis });

export const EMOJI_CATALOG_TABS: EmojiCatalogTab[] = [
  {
    id: "top",
    label: "Top",
    icon: "⭐",
    sections: [
      section("staples", "Charades staples", [
        "😀", "😱", "❤️", "🔥", "👀", "🏃", "🎬", "🎵", "💀", "🚗",
        "🏠", "💡", "🍕", "⭐", "💰", "👑", "🐶", "☠️", "🌊", "⏰",
        "🎉", "💤", "🌙", "☀️", "🧠", "👊", "🙌", "🤔", "😭", "💨"
      ])
    ]
  },
  {
    id: "faces",
    label: "Faces",
    icon: "😀",
    sections: [
      section("faces", "Faces", [
        "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🙂", "😉", "😊",
        "😍", "🥰", "😘", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥳",
        "😏", "😒", "😞", "😭", "😤", "😡", "🤯", "😱", "😨", "😰",
        "🥶", "🥵", "🤢", "🤮", "🤧", "😴", "🤤", "😵", "🤠", "🫠"
      ])
    ]
  },
  {
    id: "people",
    label: "People",
    icon: "🙋",
    sections: [
      section("people", "People", [
        "👶", "🧒", "👦", "👧", "🧑", "👨", "👩", "🧓", "👴", "👵",
        "🤰", "👮", "🕵️", "💂", "👷", "🤴", "👸", "🧙", "🧚", "🦸",
        "🦹", "🤶", "🎅", "🙋", "🤷", "🙅", "💁", "🙆", "💃", "🕺",
        "🏃", "🚶", "🤸", "🧗", "🏊", "🤾", "🧘", "👏", "🙌", "🤝"
      ])
    ]
  },
  {
    id: "animals",
    label: "Animals",
    icon: "🦖",
    sections: [
      section("animals", "Animals & nature", [
        "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
        "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐔", "🐧",
        "🦅", "🦆", "🦉", "🦇", "🐺", "🐴", "🦄", "🐝", "🦋", "🐌",
        "🐙", "🦑", "🦐", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🦈",
        "🐊", "🦖", "🦕", "🐢", "🐍", "🦎", "🌴", "🌵", "🌲", "🌻"
      ])
    ]
  },
  {
    id: "food",
    label: "Food",
    icon: "🍕",
    sections: [
      section("food", "Food & drink", [
        "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍒",
        "🥑", "🍆", "🥕", "🌽", "🌶️", "🥐", "🍞", "🧀", "🥚", "🍳",
        "🥞", "🥓", "🍔", "🍟", "🍕", "🌭", "🌮", "🌯", "🥗", "🍝",
        "🍣", "🍤", "🍦", "🍩", "🍪", "🎂", "🍫", "🍬", "☕", "🍺"
      ])
    ]
  },
  {
    id: "travel",
    label: "Travel",
    icon: "🚙",
    sections: [
      section("travel", "Travel & places", [
        "🚗", "🚕", "🚙", "🚌", "🏎️", "🚓", "🚑", "🚒", "🚚", "🚜",
        "🏍️", "🚲", "🛴", "✈️", "🚀", "🛸", "🚁", "⛵", "🚤", "🚢",
        "🚂", "🚆", "🗽", "🗼", "🏰", "🏝️", "🏔️", "🌋", "🏜️", "🏟️",
        "🏠", "🏢", "🏥", "🏦", "⛺", "🌉", "🎡", "🎢", "🗻", "🧭"
      ])
    ]
  },
  {
    id: "objects",
    label: "Objects",
    icon: "💡",
    sections: [
      section("objects", "Objects", [
        "⌚", "📱", "💻", "🖨️", "🕹️", "💾", "📷", "🎥", "📺", "📻",
        "☎️", "⏰", "🔋", "💡", "🔦", "🕯️", "🧯", "🛢️", "💸", "💰",
        "🔧", "🔨", "🪓", "🔩", "⚙️", "🧲", "🔬", "🔭", "💊", "🩹",
        "🚪", "🪑", "🚽", "🚿", "🛁", "🧹", "🔑", "🧸", "🎈", "⛓️"
      ])
    ]
  },
  {
    id: "symbols",
    label: "Symbols",
    icon: "❤️",
    sections: [
      section("symbols", "Symbols", [
        "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "💔", "💕", "💯",
        "💢", "💥", "💫", "💦", "💨", "🕳️", "🔥", "⭐", "🌟", "✨",
        "⚡", "☀️", "🌙", "☁️", "🌧️", "⛄", "🌈", "🎵", "🎶", "❓",
        "❗", "✅", "❌", "⭕", "🚫", "♻️", "🔔", "🔕", "🏆", "🥇"
      ])
    ]
  }
];

export const DEFAULT_EMOJI_CATALOG_TAB_ID = "top";

// Search matches the section labels and tab labels a picker would think of,
// plus the emoji itself, so typing "dino" still surfaces 🦖 via its section.
export const searchEmojiCatalog = (query: string): string[] => {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return [];
  }

  const matches: string[] = [];

  EMOJI_CATALOG_TABS.forEach((tab) => {
    const tabMatches = tab.label.toLowerCase().includes(normalizedQuery);

    tab.sections.forEach((catalogSection) => {
      const sectionMatches =
        tabMatches || catalogSection.label.toLowerCase().includes(normalizedQuery);

      if (!sectionMatches) {
        return;
      }

      catalogSection.emojis.forEach((emoji) => {
        if (!matches.includes(emoji)) {
          matches.push(emoji);
        }
      });
    });
  });

  return matches;
};
