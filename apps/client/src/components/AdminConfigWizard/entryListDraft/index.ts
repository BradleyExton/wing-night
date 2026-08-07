// The wizard's structural vocabulary for a list-shaped content file.
//
// `players.json`, `teams.json` and both prompt packs are the SAME shape — a file
// object whose entire body is one array — differing only in the property name
// and the entry type. Written once here rather than four times over; the
// per-file meaning (what a blank entry is, how an id is minted) lives in
// `contentDraft`, which is the thing that actually differs.
//
// Pure and returning a new file, for the same reason `gameConfigDraft` is:
// `ConfigFileEdit.value` is the file's WHOLE next contents, not a delta, so the
// draft has to stay a valid file at every keystroke rather than only at submit.

export type EntryListFile<ListKey extends string, Entry> = {
  [Key in ListKey]: Entry[];
};

// A computed-key spread widens back to an index signature and loses the mapped
// type, so the assertion is re-applied in the one place that spreads. It is
// sound by construction: `listKey` is the only key written, and it is written
// with an `Entry[]`.
const withEntries = <ListKey extends string, Entry>(
  file: EntryListFile<ListKey, Entry>,
  listKey: ListKey,
  entries: Entry[]
): EntryListFile<ListKey, Entry> => {
  return { ...file, [listKey]: entries } as EntryListFile<ListKey, Entry>;
};

// Takes the whole next entry rather than a `Partial` to merge: `avatarSrc` is
// validated on PRESENCE, so removing it is a legal edit that no merge can
// express (see `setPlayerAvatarSrc`).
export const setEntry = <ListKey extends string, Entry>(
  file: EntryListFile<ListKey, Entry>,
  listKey: ListKey,
  entryIndex: number,
  entry: Entry
): EntryListFile<ListKey, Entry> => {
  return withEntries(
    file,
    listKey,
    file[listKey].map((previous, index) => (index === entryIndex ? entry : previous))
  );
};

export const addEntry = <ListKey extends string, Entry>(
  file: EntryListFile<ListKey, Entry>,
  listKey: ListKey,
  entry: Entry
): EntryListFile<ListKey, Entry> => {
  return withEntries(file, listKey, [...file[listKey], entry]);
};

export const removeEntry = <ListKey extends string, Entry>(
  file: EntryListFile<ListKey, Entry>,
  listKey: ListKey,
  entryIndex: number
): EntryListFile<ListKey, Entry> => {
  return withEntries(
    file,
    listKey,
    file[listKey].filter((_entry, index) => index !== entryIndex)
  );
};
