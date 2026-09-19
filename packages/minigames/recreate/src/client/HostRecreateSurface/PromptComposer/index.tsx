import * as styles from "./styles.js";

type PromptComposerProps = {
  draft: string;
  onDraftChange: (draft: string) => void;
  maxLength: number;
  canSubmit: boolean;
  label: string;
  placeholder: string;
  counterLabel: (remaining: number) => string;
  submitLabel: string;
  onSubmit: (prompt: string) => void;
};

// The draft never leaves the tablet until it is sent: nothing on the TV should
// twitch while the team argues over a comma, and one action per prompt keeps
// the runtime honest about what was actually submitted. The surface owns the
// draft rather than this component, because the composer unmounts while the
// host grades and a team sent back to rewrite should find their words waiting.
export const PromptComposer = ({
  draft,
  onDraftChange,
  maxLength,
  canSubmit,
  label,
  placeholder,
  counterLabel,
  submitLabel,
  onSubmit
}: PromptComposerProps): JSX.Element => {
  const trimmedDraft = draft.trim();
  const isSubmittable = canSubmit && trimmedDraft.length > 0;

  return (
    <div className={styles.container}>
      <label className={styles.label} htmlFor="recreate-prompt-draft">
        {label}
      </label>
      <textarea
        id="recreate-prompt-draft"
        className={styles.textarea}
        value={draft}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="on"
        spellCheck
        onChange={(event): void => {
          onDraftChange(event.target.value);
        }}
      />
      <div className={styles.footer}>
        <p className={styles.counter}>{counterLabel(maxLength - draft.length)}</p>
        <button
          className={styles.submitButton}
          type="button"
          disabled={!isSubmittable}
          onClick={(): void => {
            onSubmit(trimmedDraft);
          }}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
};
