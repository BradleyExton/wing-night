import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import {
  PORTAL_API_ROUTES,
  TEAM_FORMATS,
  TEAMMATE_WISHES_MAX,
  isGuestVote,
  isPortalGuestList,
  type GuestVote,
  type PortalGuest
} from "@wingnight/shared/guestPortal";

import { jsonRequest, requestPortal } from "../../../utils/portalApi";
import * as shellStyles from "../../PortalShell/styles";
import { teamFormatLabels, voteFormCopy } from "./copy";
import { GenreRanking } from "./GenreRanking";
import { draftFromVote, toGuestVote, toggleWish, type VoteDraft } from "./voteDraft";
import * as styles from "./styles";

type VoteFormProps = {
  guestId: string;
  vote: GuestVote | null;
  onSaved: (vote: GuestVote) => void;
};

type SaveState = "idle" | "saving" | "saved" | "failed";

// The guest's private vote: the music they'd play for, who they'd sit with, and how the teams
// get made at all. Only Brad's summary ever reads it back.
export const VoteForm = ({ guestId, vote, onSaved }: VoteFormProps): JSX.Element => {
  const [guests, setGuests] = useState<PortalGuest[] | null>(null);
  const [draft, setDraft] = useState<VoteDraft>(() => draftFromVote(vote, null));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const others = useMemo(() => (guests ?? []).filter((guest) => guest.guestId !== guestId), [guests, guestId]);

  useEffect(() => {
    let cancelled = false;

    void requestPortal(PORTAL_API_ROUTES.guests, isPortalGuestList).then((result) => {
      if (!cancelled && result.ok) {
        setGuests(result.body);
        // A wish for a guest who has since left the list is dropped before it can be re-saved.
        setDraft((current) => ({
          ...current,
          wishes: current.wishes.filter((wish) => result.body.some((guest) => guest.guestId === wish))
        }));
      }
    });

    return (): void => {
      cancelled = true;
    };
  }, []);

  const edit = (next: Partial<VoteDraft>): void => {
    setDraft((current) => ({ ...current, ...next }));
    setSaveState("idle");
  };

  const payload = toGuestVote(draft);

  const save = async (): Promise<void> => {
    if (payload === null) {
      return;
    }

    setSaveState("saving");
    const result = await requestPortal(
      PORTAL_API_ROUTES.myVote,
      (value): value is GuestVote => isGuestVote(value, guestId),
      jsonRequest("PUT", payload)
    );

    setSaveState(result.ok ? "saved" : "failed");

    if (result.ok) {
      onSaved(payload);
    }
  };

  const statusText =
    saveState === "saved"
      ? voteFormCopy.saved
      : saveState === "failed"
        ? voteFormCopy.failed
        : payload === null
          ? voteFormCopy.incomplete
          : "";

  return (
    <section className={shellStyles.card} aria-labelledby="vote-form-title">
      <p className={shellStyles.eyebrow}>{voteFormCopy.eyebrow}</p>
      <h2 id="vote-form-title" className={shellStyles.cardTitle}>
        {voteFormCopy.title}
      </h2>
      <p className={shellStyles.voice}>{voteFormCopy.body}</p>

      <GenreRanking ranking={draft.ranking} onChange={(ranking): void => edit({ ranking })} />

      <div className={styles.group} role="group" aria-label={voteFormCopy.wishesLabel}>
        <span className={shellStyles.fieldLabel}>{voteFormCopy.wishesLabel}</span>
        {guests !== null && others.length === 0 ? (
          <p className={styles.empty}>{voteFormCopy.wishesEmpty}</p>
        ) : (
          <div className={styles.chips}>
            {others.map((guest) => {
              const isOn = draft.wishes.includes(guest.guestId);

              return (
                <button
                  key={guest.guestId}
                  type="button"
                  className={isOn ? styles.chipOn : styles.chip}
                  aria-pressed={isOn}
                  disabled={!isOn && draft.wishes.length >= TEAMMATE_WISHES_MAX}
                  onClick={(): void => edit({ wishes: toggleWish(draft.wishes, guest.guestId) })}
                >
                  {isOn && <Check className={styles.chipGlyph} aria-hidden />}
                  {guest.displayName}
                </button>
              );
            })}
          </div>
        )}
        <p className={shellStyles.fine}>{voteFormCopy.wishesPrivate}</p>
      </div>

      <div className={styles.group}>
        <span id="vote-format-label" className={shellStyles.fieldLabel}>
          {voteFormCopy.formatLabel}
        </span>
        <div className={styles.choices} role="radiogroup" aria-labelledby="vote-format-label">
          {TEAM_FORMATS.map((format) => (
            <label key={format} className={draft.format === format ? styles.choiceOn : styles.choice}>
              <input
                className={styles.radio}
                type="radio"
                name="team-format"
                checked={draft.format === format}
                onChange={(): void => edit({ format })}
              />
              {teamFormatLabels[format]}
            </label>
          ))}
        </div>
      </div>

      <button
        type="button"
        className={shellStyles.buttonPrimary}
        disabled={payload === null || saveState === "saving"}
        onClick={(): void => void save()}
      >
        {saveState === "saving" ? voteFormCopy.saving : voteFormCopy.save}
      </button>
      <p className={saveState === "failed" ? shellStyles.statusError : shellStyles.status} role="status">
        {statusText}
      </p>
    </section>
  );
};
