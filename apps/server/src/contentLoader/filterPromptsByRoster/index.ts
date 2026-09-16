import {
  buildRosterNameSet,
  findUnknownFeaturedPlayers,
  isFeaturedOnRoster,
  readFeaturedPlayers,
  type MinigameType,
  type Player
} from "@wingnight/shared";
import type { SerializableRecord, SerializableValue } from "@wingnight/minigames-core";

type MinigameContentById = Partial<Record<MinigameType, SerializableValue>>;

type FilterPromptsByRosterInput = {
  minigameContentById: MinigameContentById;
  players: Player[];
  // Injected so the unit layer can assert on what a host would be told without
  // monkey-patching the console, and so a future admin surface can route these
  // somewhere the host will actually look on game night.
  warn?: (message: string) => void;
};

type PromptBank = SerializableRecord & { prompts: SerializableValue[] };

// A guard rather than a `readPrompts` returning the array, so the spread that
// rebuilds the bank below keeps `content` narrowed to an object type.
const isPromptBank = (content: SerializableValue): content is PromptBank => {
  if (typeof content !== "object" || content === null || Array.isArray(content)) {
    return false;
  }

  return "prompts" in content && Array.isArray(content.prompts);
};

// Dropped rather than reordered or de-prioritized: the geo runtime walks its
// pack with a wrapping cursor (`promptCursor % prompts.length`), so a prompt
// left in the array WILL come up given enough turns. "Only photos with people
// who are here" has to mean the pack, not the ordering.
export const filterPromptsByRoster = ({
  minigameContentById,
  players,
  warn = (message) => console.warn(message)
}: FilterPromptsByRosterInput): MinigameContentById => {
  const rosterNames = buildRosterNameSet(players.map((player) => player.name));
  const filteredContentById: MinigameContentById = {};

  for (const [minigameType, content] of Object.entries(minigameContentById)) {
    if (content === undefined) {
      continue;
    }

    // A bank that is not prompt-shaped is none of this filter's business; hand
    // it back byte-for-byte rather than guessing at its structure.
    if (!isPromptBank(content)) {
      filteredContentById[minigameType as MinigameType] = content;
      continue;
    }

    const prompts = content.prompts;

    const keptPrompts = prompts.filter((prompt) => {
      return isFeaturedOnRoster(readFeaturedPlayers(prompt), rosterNames);
    });

    const unknownNames = new Set<string>();

    for (const prompt of prompts) {
      for (const playerName of findUnknownFeaturedPlayers(
        readFeaturedPlayers(prompt),
        rosterNames
      )) {
        unknownNames.add(playerName);
      }
    }

    if (unknownNames.size > 0) {
      warn(
        `${minigameType}: tagged names not on the roster: ${[...unknownNames].join(", ")}. Either they are not playing tonight, or the tag is a typo in the content pack.`
      );
    }

    // Worth saying out loud even though it is not an error: a pack can be
    // filtered to nothing by tagging alone, and finding that out when the
    // round starts is the worst possible time.
    if (keptPrompts.length === 0 && prompts.length > 0) {
      warn(
        `${minigameType}: all ${prompts.length} prompt(s) were filtered out — nobody tagged in them is on tonight's roster. That round will have nothing to show.`
      );
    } else if (keptPrompts.length < prompts.length) {
      warn(
        `${minigameType}: ${prompts.length - keptPrompts.length} of ${prompts.length} prompt(s) hidden — nobody tagged in them is on tonight's roster.`
      );
    }

    filteredContentById[minigameType as MinigameType] = {
      ...content,
      prompts: keptPrompts
    };
  }

  return filteredContentById;
};
