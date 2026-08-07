import { selectFieldIssueText, type IssueMessagesByPath } from "../selectIssueMessages";
import * as styles from "./styles";

type FieldIssueProps = {
  messagesByPath: IssueMessagesByPath;
  path: string;
};

// Renders nothing for a clean field, so a step can drop one of these under every
// input without branching at each call site.
export const FieldIssue = ({
  messagesByPath,
  path
}: FieldIssueProps): JSX.Element | null => {
  const issueText = selectFieldIssueText(messagesByPath, path);

  if (issueText === null) {
    return null;
  }

  return (
    <p className={styles.text} role="alert">
      {issueText}
    </p>
  );
};

// The same predicate the row above uses, exported so an input can mark itself
// invalid without re-deriving it.
export const hasFieldIssue = (
  messagesByPath: IssueMessagesByPath,
  path: string
): boolean => {
  return selectFieldIssueText(messagesByPath, path) !== null;
};
