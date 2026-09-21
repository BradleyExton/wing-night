import { Fragment, useMemo, useState } from "react";

import {
  DEFAULT_EMOJI_CATALOG_TAB_ID,
  EMOJI_CATALOG_TABS,
  searchEmojiCatalog,
  type EmojiCatalogSection
} from "../../emojiCatalog/index.js";
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

// Search is always visible but costs only its own row; the tabs and the
// frequency-ranked "Top" landing tab stay underneath it (DESIGN.md §2.6).
export const EmojiPicker = ({
  isDisabled,
  lockedEmojis,
  lockedLabel,
  onSelectEmoji
}: EmojiPickerProps): JSX.Element => {
  const [activeTabId, setActiveTabId] = useState(DEFAULT_EMOJI_CATALOG_TAB_ID);
  const [searchQuery, setSearchQuery] = useState("");

  const isSearching = searchQuery.trim().length > 0;

  const sections = useMemo((): EmojiCatalogSection[] => {
    if (isSearching) {
      return [
        {
          id: "search",
          label: hostEmojiCharadesSurfaceCopy.searchPlaceholderLabel,
          emojis: searchEmojiCatalog(searchQuery)
        }
      ];
    }

    const activeTab =
      EMOJI_CATALOG_TABS.find((tab) => tab.id === activeTabId) ??
      EMOJI_CATALOG_TABS[0];

    return activeTab?.sections ?? [];
  }, [activeTabId, isSearching, searchQuery]);

  const hasResults = sections.some((section) => section.emojis.length > 0);

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

  return (
    <>
      <div className={styles.search}>
        <span className={styles.searchIcon} aria-hidden="true">
          {"\u{1F50D}"}
        </span>
        <input
          className={styles.searchInput}
          type="search"
          value={searchQuery}
          placeholder={hostEmojiCharadesSurfaceCopy.searchPlaceholderLabel}
          aria-label={hostEmojiCharadesSurfaceCopy.searchPlaceholderLabel}
          onChange={(event): void => {
            setSearchQuery(event.target.value);
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

      <div className={styles.tabs} role="tablist">
        {EMOJI_CATALOG_TABS.map((tab) => (
          <button
            key={tab.id}
            className={
              !isSearching && tab.id === activeTabId ? styles.tabActive : styles.tab
            }
            type="button"
            role="tab"
            aria-selected={!isSearching && tab.id === activeTabId}
            onClick={(): void => {
              setSearchQuery("");
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

      <div className={styles.grid}>
        {!hasResults && (
          <p className={styles.emptyNote}>
            {hostEmojiCharadesSurfaceCopy.noSearchResultsLabel}
          </p>
        )}
        {sections.map((section) => (
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
                  onSelectEmoji(emoji);
                }}
              >
                {emoji}
              </button>
            ))}
          </Fragment>
        ))}
      </div>
    </>
  );
};
