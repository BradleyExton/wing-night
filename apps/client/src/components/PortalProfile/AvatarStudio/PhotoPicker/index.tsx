import type { ChangeEvent } from "react";

import * as shellStyles from "../../../PortalShell/styles";
import * as styles from "./styles";

type PhotoPickerProps = {
  // Once there is a photo or a head, a new photo is not the next thing to do, so neither leads.
  isQuiet: boolean;
  takeLabel: string;
  chooseLabel: string;
  disabled: boolean;
  onPick: (file: File) => void;
};

// A phone's camera (`capture="user"`, the front one) and its library, both ending in a File.
export const PhotoPicker = ({ isQuiet, takeLabel, chooseLabel, disabled, onPick }: PhotoPickerProps): JSX.Element => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (file !== undefined) {
      onPick(file);
    }
  };

  return (
    <div className={styles.row}>
      <label className={isQuiet ? shellStyles.buttonGhost : shellStyles.buttonPrimary}>
        <input
          className={styles.hiddenInput}
          type="file"
          accept="image/*"
          capture="user"
          disabled={disabled}
          onChange={handleChange}
        />
        {takeLabel}
      </label>
      <label className={shellStyles.buttonGhost}>
        <input className={styles.hiddenInput} type="file" accept="image/*" disabled={disabled} onChange={handleChange} />
        {chooseLabel}
      </label>
    </div>
  );
};
