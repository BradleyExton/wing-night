// The picker catalog is client-owned, not content-driven (spec §2). "Top" is
// the landing tab per DESIGN.md §2.6: frequency-ranked for charades rather
// than unicode order, so the likely next tap is already on screen. The tabs are
// a curated few hundred; search reaches every emoji (see emojiSearch).
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
        "🎉", "💤", "🌙", "☀️", "🧠", "👊", "🙌", "🤔", "😭", "💨",
        "👶", "👻", "🤖", "👽", "🧙", "🦸", "💍", "🎁", "🎂", "🍺",
        "🎤", "🎸", "📺", "📱", "🎮", "⚽", "🏆", "✈️", "🚀", "🌎"
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
