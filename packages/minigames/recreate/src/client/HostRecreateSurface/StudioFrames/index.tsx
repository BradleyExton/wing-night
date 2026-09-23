import {
  resolveContentAssetSrc,
  type RecreateAttempt,
  type RecreateMinigameHostView
} from "@wingnight/shared";

import { hostRecreateSurfaceCopy } from "../copy.js";
import * as styles from "./styles.js";

const Frame = ({
  caption,
  imageSrc,
  alt,
  serverOrigin,
  placeholder,
  isBusy = false
}: {
  caption: string;
  imageSrc: string | null;
  alt: string;
  serverOrigin: string | null;
  placeholder?: string;
  isBusy?: boolean;
}): JSX.Element => {
  const resolvedSrc = imageSrc === null ? null : resolveContentAssetSrc(imageSrc, serverOrigin);

  return (
    <figure className={styles.frame}>
      <div className={styles.picture}>
        {resolvedSrc !== null ? (
          <img className={styles.photo} src={resolvedSrc} alt={alt} />
        ) : (
          <div className={isBusy ? styles.placeholderBusy : styles.placeholder}>
            {placeholder ?? ""}
          </div>
        )}
      </div>
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
};

const resolveAttemptPlaceholder = (attempt: RecreateAttempt): string => {
  switch (attempt.status) {
    case "generating":
      return hostRecreateSurfaceCopy.attemptGeneratingLabel;
    case "failed":
      return hostRecreateSurfaceCopy.attemptFailedLabel(attempt.failureReason ?? "");
    case "skipped":
      return hostRecreateSurfaceCopy.attemptSkippedLabel;
    case "ready":
      return hostRecreateSurfaceCopy.attemptReadyLabel;
  }
};

// The left-hand column of the takeover body, on all three beats: the target
// while they write, the target and the forgery once the prompt is in. The
// frames split the column's height between them rather than standing at a
// fixed 4:3, so a party photo gets the canvas the migration freed rather than
// the 171px box it used to sit in while the host graded.
export const StudioFrames = ({
  recreateHostView,
  serverOrigin
}: {
  recreateHostView: RecreateMinigameHostView;
  serverOrigin: string | null;
}): JSX.Element | null => {
  const { currentTarget, attempt, subState } = recreateHostView;

  if (currentTarget === null) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Frame
        caption={hostRecreateSurfaceCopy.targetCaption}
        imageSrc={currentTarget.targetImageSrc}
        alt={currentTarget.title}
        serverOrigin={serverOrigin}
      />
      {subState === "writing" ? (
        currentTarget.sourceImageSrc !== null && (
          <Frame
            caption={hostRecreateSurfaceCopy.originalCaption}
            imageSrc={currentTarget.sourceImageSrc}
            alt={currentTarget.title}
            serverOrigin={serverOrigin}
          />
        )
      ) : (
        <Frame
          caption={hostRecreateSurfaceCopy.attemptCaption}
          imageSrc={attempt?.imageSrc ?? null}
          alt={attempt?.prompt ?? currentTarget.title}
          serverOrigin={serverOrigin}
          placeholder={attempt === null ? undefined : resolveAttemptPlaceholder(attempt)}
          isBusy={attempt?.status === "generating"}
        />
      )}
    </div>
  );
};
