import * as styles from "./styles.js";

type PromptComposerProps = {
  draft: string;
  onDraftChange: (draft: string) => void;
  maxLength: number;
  label: string;
  placeholder: string;
  counterLabel: (remaining: number) => string;
};

// The draft never leaves the tablet until it is sent: nothing on the TV should
// twitch while the team argues over a comma, and one action per prompt keeps
// the runtime honest about what was actually submitted. The surface owns the
// draft rather than this component, because the composer unmounts while the
// host grades and a team sent back to rewrite should find their words waiting.
//
// It owns no button either. "Send to the forger" is the beat's ender, so it
// lives in the takeover's foot row with the other two
// (docs/takeover-layout-api.md §4) rather than half way up the canvas where
// this beat used to keep it.
export const PromptComposer = ({
  draft,
  onDraftChange,
  maxLength,
  label,
  placeholder,
  counterLabel
}: PromptComposerProps): JSX.Element => (
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
    <p className={styles.counter}>{counterLabel(maxLength - draft.length)}</p>
  </div>
);
