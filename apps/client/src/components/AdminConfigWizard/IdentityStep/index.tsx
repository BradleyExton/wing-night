import type { GameConfigFile } from "@wingnight/shared";

import { adminCopy } from "../../../copy/admin";
import { FieldIssue, hasFieldIssue } from "../FieldIssue";
import type { IssueMessagesByPath } from "../selectIssueMessages";
import * as styles from "./styles";

type IdentityStepProps = {
  gameConfig: GameConfigFile;
  issueMessagesByPath: IssueMessagesByPath;
  isLocked: boolean;
  onNameChange: (name: string) => void;
};

const NAME_PATH = "name";

export const IdentityStep = ({
  gameConfig,
  issueMessagesByPath,
  isLocked,
  onNameChange
}: IdentityStepProps): JSX.Element => {
  return (
    <div className={styles.fieldGrid}>
      <div className={`${styles.fieldGridWide} ${styles.field}`}>
        <label className={styles.label} htmlFor="admin-pack-name">
          {adminCopy.packNameLabel}
        </label>
        <input
          id="admin-pack-name"
          className={`${styles.input} ${
            hasFieldIssue(issueMessagesByPath, NAME_PATH) ? styles.inputInvalid : ""
          }`}
          value={gameConfig.name}
          disabled={isLocked}
          onChange={(event): void => {
            onNameChange(event.target.value);
          }}
        />
        <FieldIssue messagesByPath={issueMessagesByPath} path={NAME_PATH} />
        <p className={styles.hint}>{adminCopy.packNameHint}</p>
      </div>
    </div>
  );
};
