import type {
  DrawingContentFile,
  DrawingPrompt,
  TriviaContentFile,
  TriviaPrompt
} from "@wingnight/shared";

import { adminCopy } from "../../../copy/admin";
import { nextDrawingPrompt, nextTriviaPrompt } from "../contentDraft";
import { addEntry, removeEntry, setEntry } from "../entryListDraft";
import { EntryListEditor, type EntryFieldSpec } from "../EntryListEditor";
import type { IssueMessagesByPath } from "../selectIssueMessages";
import * as styles from "./styles";

type PromptPacksStepProps = {
  trivia: TriviaContentFile;
  drawing: DrawingContentFile;
  geoPromptCount: number;
  triviaIssueMessagesByPath: IssueMessagesByPath;
  drawingIssueMessagesByPath: IssueMessagesByPath;
  isLocked: boolean;
  onTriviaChange: (trivia: TriviaContentFile) => void;
  onDrawingChange: (drawing: DrawingContentFile) => void;
};

// No `write`: ids are minted by `contentDraft` and unique-checked by the pack
// validator. Rendered read-only rather than omitted so a duplicate-id issue on
// a hand-edited pack has a field to land on.
const promptIdField = <Prompt extends { id: string }>(): EntryFieldSpec<Prompt> => ({
  name: "id",
  label: adminCopy.promptIdFieldLabel,
  read: (prompt) => prompt.id
});

const TRIVIA_FIELDS: readonly EntryFieldSpec<TriviaPrompt>[] = [
  promptIdField<TriviaPrompt>(),
  {
    name: "question",
    label: adminCopy.triviaQuestionFieldLabel,
    read: (prompt) => prompt.question,
    write: (prompt, question) => ({ ...prompt, question })
  },
  {
    name: "answer",
    label: adminCopy.triviaAnswerFieldLabel,
    read: (prompt) => prompt.answer,
    write: (prompt, answer) => ({ ...prompt, answer })
  }
];

const DRAWING_FIELDS: readonly EntryFieldSpec<DrawingPrompt>[] = [
  promptIdField<DrawingPrompt>(),
  {
    name: "prompt",
    label: adminCopy.drawingPromptFieldLabel,
    read: (prompt) => prompt.prompt,
    write: (prompt, value) => ({ ...prompt, prompt: value })
  }
];

export const PromptPacksStep = ({
  trivia,
  drawing,
  geoPromptCount,
  triviaIssueMessagesByPath,
  drawingIssueMessagesByPath,
  isLocked,
  onTriviaChange,
  onDrawingChange
}: PromptPacksStepProps): JSX.Element => {
  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>{adminCopy.triviaSectionTitle}</h2>
        <EntryListEditor
          idPrefix="admin-trivia"
          listPath="prompts"
          entries={trivia.prompts}
          fields={TRIVIA_FIELDS}
          entryHeading={adminCopy.triviaPromptHeading}
          removeLabel={adminCopy.removeTriviaPromptLabel}
          addLabel={adminCopy.addTriviaPromptLabel}
          issueMessagesByPath={triviaIssueMessagesByPath}
          isLocked={isLocked}
          onEntryChange={(entryIndex, prompt): void => {
            onTriviaChange(setEntry(trivia, "prompts", entryIndex, prompt));
          }}
          onAdd={(): void => {
            onTriviaChange(
              addEntry(trivia, "prompts", nextTriviaPrompt(trivia.prompts))
            );
          }}
          onRemove={(entryIndex): void => {
            onTriviaChange(removeEntry(trivia, "prompts", entryIndex));
          }}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>{adminCopy.drawingSectionTitle}</h2>
        <EntryListEditor
          idPrefix="admin-drawing"
          listPath="prompts"
          entries={drawing.prompts}
          fields={DRAWING_FIELDS}
          entryHeading={adminCopy.drawingPromptHeading}
          removeLabel={adminCopy.removeDrawingPromptLabel}
          addLabel={adminCopy.addDrawingPromptLabel}
          issueMessagesByPath={drawingIssueMessagesByPath}
          isLocked={isLocked}
          onEntryChange={(entryIndex, prompt): void => {
            onDrawingChange(setEntry(drawing, "prompts", entryIndex, prompt));
          }}
          onAdd={(): void => {
            onDrawingChange(
              addEntry(drawing, "prompts", nextDrawingPrompt(drawing.prompts))
            );
          }}
          onRemove={(entryIndex): void => {
            onDrawingChange(removeEntry(drawing, "prompts", entryIndex));
          }}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>{adminCopy.geoSectionTitle}</h2>
        <p className={styles.geoCard}>
          {adminCopy.geoPromptCountValue(geoPromptCount)}
          <span className={styles.geoHint}>{adminCopy.geoImportHint}</span>
        </p>
      </section>
    </>
  );
};
