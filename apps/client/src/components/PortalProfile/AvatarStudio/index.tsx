import { PORTAL_API_ROUTES, type PortalAvatarStatus } from "@wingnight/shared/guestPortal";

import { PortalHeadBird } from "../../PortalHeadBird";
import * as shellStyles from "../../PortalShell/styles";
import { avatarStudioCopy, formatTries } from "./copy";
import { PhotoPicker } from "./PhotoPicker";
import { useAvatarStudio } from "./useAvatarStudio";
import * as styles from "./styles";

type AvatarStudioProps = {
  displayName: string;
  avatar: PortalAvatarStatus;
  onAvatar: (next: PortalAvatarStatus) => void;
};

// The guest's head, made on their phone: a photo in, Gemini's paint keyed in the browser, the
// head previewed on their bird, kept or tried again — five tries in all, counted by the portal.
export const AvatarStudio = ({ displayName, avatar, onAvatar }: AvatarStudioProps): JSX.Element => {
  const studio = useAvatarStudio(avatar, onAvatar);
  const { phase } = studio;
  const preview = phase.kind === "preview" || phase.kind === "accepting" ? phase : null;
  const keptHeadSrc = avatar.headHash === null ? null : `${PORTAL_API_ROUTES.myAvatar}?v=${avatar.headHash}`;
  const isBusy = phase.kind !== "idle" && phase.kind !== "preview";
  const canPaint = avatar.triesLeft > 0;

  const birdLabel =
    preview !== null
      ? avatarStudioCopy.birdLabelPreview
      : keptHeadSrc !== null
        ? avatarStudioCopy.birdLabelHead
        : avatarStudioCopy.birdLabelNone;

  const actions = ((): JSX.Element | null => {
    if (preview !== null) {
      return (
        <div className={shellStyles.buttonRow}>
          <button
            type="button"
            className={shellStyles.buttonPrimary}
            disabled={phase.kind === "accepting"}
            onClick={(): void => void studio.accept()}
          >
            {phase.kind === "accepting" ? avatarStudioCopy.keeping : avatarStudioCopy.keep}
          </button>
          <button
            type="button"
            className={shellStyles.buttonGhost}
            disabled={phase.kind === "accepting" || !canPaint}
            onClick={(): void => void studio.paint()}
          >
            {avatarStudioCopy.tryAgain}
          </button>
        </div>
      );
    }

    if (!canPaint) {
      return null;
    }

    if (avatar.hasPhoto) {
      return (
        <button
          type="button"
          className={shellStyles.buttonPrimary}
          disabled={isBusy}
          onClick={(): void => void studio.paint()}
        >
          {phase.kind === "painting" ? avatarStudioCopy.painting : avatarStudioCopy.paint}
        </button>
      );
    }

    return (
      <PhotoPicker
        isQuiet={keptHeadSrc !== null}
        takeLabel={avatarStudioCopy.takeSelfie}
        chooseLabel={avatarStudioCopy.choosePhoto}
        disabled={isBusy}
        onPick={(file): void => void studio.choosePhoto(file)}
      />
    );
  })();

  return (
    <section className={shellStyles.card} aria-labelledby="avatar-studio-title">
      <p className={shellStyles.eyebrow}>{avatarStudioCopy.eyebrow}</p>
      <h2 id="avatar-studio-title" className={shellStyles.cardTitle}>
        {avatarStudioCopy.title}
      </h2>
      <p className={shellStyles.voice}>{avatarStudioCopy.body}</p>
      <PortalHeadBird name={displayName} headSrc={preview?.previewSrc ?? keptHeadSrc} size="large" label={birdLabel} />
      <div className={styles.statusRow}>
        <span className={preview === null && keptHeadSrc === null ? shellStyles.pillDim : shellStyles.pill}>
          {(preview !== null || keptHeadSrc !== null) && <span className={shellStyles.pillDot} aria-hidden />}
          {preview !== null
            ? avatarStudioCopy.pillPreview
            : keptHeadSrc !== null
              ? avatarStudioCopy.pillHead
              : avatarStudioCopy.pillNone}
        </span>
        {avatar.hasPhoto && preview === null && <span className={shellStyles.pill}>{avatarStudioCopy.pillPhoto}</span>}
        {studio.photoSrc !== null && preview === null && (
          <img className={styles.photoThumb} src={studio.photoSrc} alt={avatarStudioCopy.photoAlt} />
        )}
      </div>
      {actions}
      {phase.kind === "uploading" && <p className={shellStyles.status}>{avatarStudioCopy.uploading}</p>}
      {avatar.hasPhoto && preview === null && (
        <>
          {canPaint && (
            <PhotoPicker
              isQuiet
              takeLabel={avatarStudioCopy.takeSelfie}
              chooseLabel={avatarStudioCopy.choosePhoto}
              disabled={isBusy}
              onPick={(file): void => void studio.choosePhoto(file)}
            />
          )}
          <button
            type="button"
            className={`${shellStyles.navLink} ${styles.removePhoto}`}
            disabled={isBusy}
            onClick={(): void => void studio.removePhoto()}
          >
            {phase.kind === "removing" ? avatarStudioCopy.removingPhoto : avatarStudioCopy.removePhoto}
          </button>
        </>
      )}
      <p className={shellStyles.statusError} role="status">
        {studio.problem === null ? "" : avatarStudioCopy.problems[studio.problem]}
      </p>
      {!canPaint && preview === null && <p className={shellStyles.fine}>{avatarStudioCopy.outOfTries}</p>}
      <div className={styles.triesRow}>
        <span className={shellStyles.eyebrow}>{avatarStudioCopy.triesLabel}</span>
        <span className={styles.triesFigure} data-testid="avatar-tries-left">
          {formatTries(avatar.triesLeft, avatar.triesMax)}
        </span>
      </div>
      <p className={shellStyles.fine}>{avatarStudioCopy.privacy}</p>
    </section>
  );
};
