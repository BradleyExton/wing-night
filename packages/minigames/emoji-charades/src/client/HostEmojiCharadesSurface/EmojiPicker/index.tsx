import { Fragment, useEffect, useMemo, useState } from "react";

import {
  DEFAULT_EMOJI_CATALOG_TAB_ID,
  EMOJI_CATALOG_TABS,
  type EmojiCatalogSection
} from "../../emojiCatalog/index.js";
import {
  loadEmojiSearchIndex,
  searchEmojiIndex,
  type EmojiSearchEntry
} from "../../emojiSearch/index.js";
import { hostEmojiCharadesSurfaceCopy } from "../copy.js";
import * as styles from "./styles.js";

export type EmojiPickerProps = {
  isDisabled: boolean;
  // Set by a subject whose clue is an authored running joke: the search, the
  // tabs and the catalog all go away, and the picker offers exactly this list.
  lockedEmojis: string[] | null;
  lockedLabel: string;
  onSelectEmoji: (emoji: string) => void;
};

const USED_THIS_TURN_LIMIT = 20;

// The keyword index loads once per picker, in its own chunk, as soon as the
// picker is on screen — by the time a host has typed a word it is there.
const useEmojiSearchIndex = (): EmojiSearchEntry[] | null => {
  const [searchIndex, setSearchIndex] = useState<EmojiSearchEntry[] | null>(null);

  useEffect(() => {
    let isCurrent = true;

    void loadEmojiSearchIndex().then((loadedIndex) => {
      if (isCurrent) {
        setSearchIndex(loadedIndex);
      }
    });

    return (): void => {
      isCurrent = false;
    };
  }, []);

  return searchIndex;
};

// Search is always visible but costs only its own row; typing swaps the tabs
// for results from every emoji there is, matched on names and keywords. The
// "Top" landing tab leads with what this turn has already used, then the
// charades staples (DESIGN.md §2.6).
export const EmojiPicker = ({
  isDisabled,
  lockedEmojis,
  lockedLabel,
  onSelectEmoji
}: EmojiPickerProps): JSX.Element => {
  const [activeTabId, setActiveTabId] = useState(DEFAULT_EMOJI_CATALOG_TAB_ID);
  const [searchQuery, setSearchQuery] = useState("");
  const [usedThisTurn, setUsedThisTurn] = useState<string[]>([]);
  const searchIndex = useEmojiSearchIndex();

  const isSearching = searchQuery.trim().length > 0;

  const sections = useMemo((): EmojiCatalogSection[] => {
    if (isSearching) {
      return [
        {
          id: "search",
          label: hostEmojiCharadesSurfaceCopy.searchResultsLabel(searchQuery),
          emojis: searchIndex === null ? [] : searchEmojiIndex(searchIndex, searchQuery)
        }
      ];
    }

    const activeTab =
      EMOJI_CATALOG_TABS.find((tab) => tab.id === activeTabId) ??
      EMOJI_CATALOG_TABS[0];
    const tabSections = activeTab?.sections ?? [];

    if (activeTab?.id !== DEFAULT_EMOJI_CATALOG_TAB_ID || usedThisTurn.length === 0) {
      return tabSections;
    }

    return [
      {
        id: "used-this-turn",
        label: hostEmojiCharadesSurfaceCopy.usedThisTurnLabel,
        emojis: usedThisTurn
      },
      ...tabSections
    ];
  }, [activeTabId, isSearching, searchIndex, searchQuery, usedThisTurn]);

  const hasResults = sections.some((section) => section.emojis.length > 0);

  const selectEmoji = (emoji: string): void => {
    onSelectEmoji(emoji);
    setUsedThisTurn((current) =>
      [emoji, ...current.filter((used) => used !== emoji)].slice(0, USED_THIS_TURN_LIMIT)
    );
  };

  // A locked subject gets no search and no tabs: there is nothing else to find.
  if (lockedEmojis !== null) {
    return (
      <div className={styles.lockedGrid}>
        <p className={styles.lockedLabel}>{lockedLabel}</p>
        {lockedEmojis.map((emoji, index) => (
          <button
            key={`locked-${emoji}-${index}`}
            className={styles.lockedEmojiButton}
            type="button"
            disabled={isDisabled}
            aria-label={emoji}
            onClick={(): void => {
              onSelectEmoji(emoji);
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    );
  }

  const emptyLabel =
    searchIndex === null
      ? hostEmojiCharadesSurfaceCopy.searchLoadingLabel
      : hostEmojiCharadesSurfaceCopy.noSearchResultsLabel(searchQuery);

  return (
    <div className={styles.root}>
      <div className={styles.search}>
        <span className={styles.searchIcon} aria-hidden="true">
          {hostEmojiCharadesSurfaceCopy.searchIconGlyph}
        </span>
        <input
          className={styles.searchInput}
          type="search"
          value={searchQuery}
          placeholder={hostEmojiCharadesSurfaceCopy.searchPlaceholderLabel}
          aria-label={hostEmojiCharadesSurfaceCopy.searchPlaceholderLabel}
          enterKeyHint="done"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event): void => {
            setSearchQuery(event.target.value);
          }}
          onKeyDown={(event): void => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
        {isSearching && (
          <button
            className={styles.searchClearButton}
            type="button"
            onClick={(): void => {
              setSearchQuery("");
            }}
          >
            {hostEmojiCharadesSurfaceCopy.searchClearLabel}
          </button>
        )}
      </div>

      {!isSearching && (
        <div className={styles.tabs} role="tablist">
          {EMOJI_CATALOG_TABS.map((tab) => (
            <button
              key={tab.id}
              className={tab.id === activeTabId ? styles.tabActive : styles.tab}
              type="button"
              role="tab"
              aria-selected={tab.id === activeTabId}
              onClick={(): void => {
                setActiveTabId(tab.id);
              }}
            >
              <span className={styles.tabIcon} aria-hidden="true">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className={isSearching ? styles.gridSearching : styles.grid}>
        {!hasResults && <p className={styles.emptyNote}>{emptyLabel}</p>}
        {sections.map(
          (section) =>
            section.emojis.length > 0 && (
              <Fragment key={section.id}>
                <p className={styles.gridSection}>{section.label}</p>
                {section.emojis.map((emoji, index) => (
                  <button
                    key={`${section.id}-${emoji}-${index}`}
                    className={styles.emojiButton}
                    type="button"
                    disabled={isDisabled}
                    aria-label={emoji}
                    onClick={(): void => {
                      selectEmoji(emoji);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </Fragment>
            )
        )}
      </div>
    </div>
  );
};
