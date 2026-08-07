import { FieldIssue, hasFieldIssue } from "../FieldIssue";
import type { IssueMessagesByPath } from "../selectIssueMessages";
import * as styles from "./styles";

// One editable row per entry, for any content file whose body is a single list.
// The roster and both prompt packs are four instances of the same surface —
// numbered cards, one input per field, remove per row, add at the bottom — so
// the shape is described here and the differences arrive as field specs.

export type EntryFieldSpec<Entry> = {
  // Doubles as the validator's path segment ("name" in `players[0].name`) and
  // the input's id segment, so an issue and its input can never drift apart.
  name: string;
  label: string;
  read: (entry: Entry) => string;
  // Takes the whole entry and returns the whole next one, rather than a value
  // to merge: a field can legitimately REMOVE a key (see `setPlayerAvatarSrc`).
  write?: (entry: Entry, value: string) => Entry;
};

type EntryListEditorProps<Entry> = {
  idPrefix: string;
  // The path the file's validator reports under: "players", "teams", "prompts".
  listPath: string;
  entries: readonly Entry[];
  fields: readonly EntryFieldSpec<Entry>[];
  entryHeading: (entryIndex: number) => string;
  removeLabel: (entryIndex: number) => string;
  addLabel: string;
  issueMessagesByPath: IssueMessagesByPath;
  isLocked: boolean;
  onEntryChange: (entryIndex: number, entry: Entry) => void;
  onAdd: () => void;
  onRemove: (entryIndex: number) => void;
};

export const EntryListEditor = <Entry,>({
  idPrefix,
  listPath,
  entries,
  fields,
  entryHeading,
  removeLabel,
  addLabel,
  issueMessagesByPath,
  isLocked,
  onEntryChange,
  onAdd,
  onRemove
}: EntryListEditorProps<Entry>): JSX.Element => {
  const fieldPath = (entryIndex: number, fieldName: string): string =>
    `${listPath}[${entryIndex}].${fieldName}`;

  return (
    <>
      {entries.map((entry, entryIndex) => (
        <article key={entryIndex} className={styles.entryCard}>
          <p className={styles.entryHead}>
            {entryHeading(entryIndex)}
            <button
              type="button"
              className={styles.removeButton}
              disabled={isLocked}
              aria-label={removeLabel(entryIndex)}
              onClick={(): void => {
                onRemove(entryIndex);
              }}
            >
              {removeLabel(entryIndex)}
            </button>
          </p>
          <div className={styles.fieldGrid}>
            {fields.map((field) => {
              const path = fieldPath(entryIndex, field.name);
              const inputId = `${idPrefix}-${field.name}-${entryIndex}`;
              const { write } = field;

              return (
                <div key={field.name} className={styles.field}>
                  <label className={styles.label} htmlFor={inputId}>
                    {field.label}
                  </label>
                  <input
                    id={inputId}
                    className={`${styles.input} ${
                      hasFieldIssue(issueMessagesByPath, path)
                        ? styles.inputInvalid
                        : ""
                    }`}
                    value={field.read(entry)}
                    // A spec with no `write` is a derived value the wizard mints
                    // and the host must not retype — a prompt id, whose
                    // uniqueness the pack validator enforces. Shown rather than
                    // hidden so an issue on it has somewhere to land.
                    readOnly={write === undefined}
                    disabled={isLocked}
                    onChange={(event): void => {
                      if (write !== undefined) {
                        onEntryChange(entryIndex, write(entry, event.target.value));
                      }
                    }}
                  />
                  <FieldIssue messagesByPath={issueMessagesByPath} path={path} />
                </div>
              );
            })}
          </div>
        </article>
      ))}

      <button
        type="button"
        className={styles.addRowButton}
        disabled={isLocked}
        onClick={onAdd}
      >
        {addLabel}
      </button>
    </>
  );
};
