import {
  CLIENT_TO_SERVER_EVENTS,
  CONFIG_FILE_KEYS,
  SERVER_TO_CLIENT_EVENTS,
  type ConfigFileKey,
  type ConfigResultPayload,
  type HostSecretPayload,
  type ValidationIssue
} from "@wingnight/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../../socketContracts/index";
import { readHostSecret } from "../../../utils/hostSecretStorage";
import {
  selectDirtyEdits,
  selectDraftIssues,
  toConfigDraft,
  type ConfigDraft
} from "../contentDraft";
import { resolveConfigOutcome } from "../resolveConfigOutcome";
import { selectIssueMessages, type IssueMessagesByPath } from "../selectIssueMessages";

type ConfigWizardSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "on" | "off" | "emit" | "connected"
>;

// One map per file rather than one map overall: a step edits two files at once
// (roster is players + teams), and `players.name` and `gameConfig.name` would
// otherwise collide on the bare `name` a field is addressed by.
export type IssueMessagesByFile = Readonly<
  Record<ConfigFileKey, IssueMessagesByPath>
>;

export type ConfigContentState = {
  baseline: ConfigDraft;
  draft: ConfigDraft;
};

// Whether the draft holds work a re-seed would discard. The same diff
// `isDirty` reports, so a host who typed a value and then typed the original
// back counts as clean and is safely re-seeded.
const hasUnsavedEdits = (content: ConfigContentState): boolean => {
  return selectDirtyEdits(content.draft, content.baseline).length > 0;
};

// What a `config:result` carrying content does to the pair. Pure, and exported
// for the reason every decision in this app's client is: the harness renders
// with `renderToStaticMarkup` and never runs an effect, so a rule left inside
// the socket handler is a rule no test can reach.
//
// The BASELINE always takes the incoming content — it is what `isDirty` diffs
// against, and a stale one misreports a dirty draft as clean.
//
// The DRAFT does not, and that is the whole point of this function. A read is
// not always something the host asked for: `handleConnect` fires one on every
// socket (re)connect and socket.io reconnects on its own after a dropped
// frame, so re-seeding unconditionally threw away whatever had been typed
// since the last seed — no prompt, nothing to undo it, a wifi blip mid-edit
// was enough. An apply is the one read that DOES reseed, because the content
// coming back IS the host's edits landing on disk, and the two agreeing is
// what makes the surface read "clean" again.
export const resolveNextContentState = (
  previous: ConfigContentState | null,
  incoming: ConfigDraft,
  didApply: boolean
): ConfigContentState => {
  const shouldReseedDraft =
    previous === null || didApply || !hasUnsavedEdits(previous);

  return {
    baseline: incoming,
    draft: shouldReseedDraft ? incoming : previous.draft
  };
};

export type ConfigWizardApi = {
  draft: ConfigDraft | null;
  // Read-only: geo content is produced by `pnpm import:geo`, so the snapshot
  // carries a count and there is no write path to key.
  geoPromptCount: number;
  issueMessagesByFile: IssueMessagesByFile;
  hasBlockingIssues: boolean;
  isDirty: boolean;
  isLocked: boolean;
  didApply: boolean;
  errorMessage: string | null;
  editFile: <Key extends ConfigFileKey>(
    key: Key,
    edit: (file: ConfigDraft[Key]) => ConfigDraft[Key]
  ) => void;
  apply: () => void;
};

const selectIssueMessagesByFile = (
  issues: ValidationIssue[]
): IssueMessagesByFile => {
  return Object.fromEntries(
    CONFIG_FILE_KEYS.map((key) => [key, selectIssueMessages(issues, key)])
  ) as IssueMessagesByFile;
};

export const useConfigWizard = (
  socket: ConfigWizardSocket | null
): ConfigWizardApi => {
  // The draft the host is editing, and the disk state it was seeded from. Both
  // are the WRITE shapes (see `contentDraft`), so the baseline can be diffed
  // against the draft key-for-key and the difference IS the apply payload.
  //
  // Held as ONE state rather than two, because the decision in
  // `handleConfigResult` — may an incoming read replace the draft? — is a
  // question about the pair, and answering it inside a single updater is what
  // keeps it a pure function of the previous pair. As two states it needed a
  // ref written during an updater, which React is free to invoke twice.
  const [content, setContent] = useState<ConfigContentState | null>(null);
  const baseline = content?.baseline ?? null;
  const draft = content?.draft ?? null;
  const [geoPromptCount, setGeoPromptCount] = useState(0);
  const [serverIssues, setServerIssues] = useState<ValidationIssue[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [didApply, setDidApply] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Taken from the `host:secretIssued` PAYLOAD rather than read back out of
  // storage, because both this hook and App's `wireHostControlClaim` listen for
  // that event and React runs a child's effects before its parent's — so this
  // handler is registered first and would read storage before the claim wiring
  // had written the new secret into it. Reading the payload makes the whole
  // question of listener order moot.
  const hostSecretRef = useRef<string | null>(null);

  const resolveHostSecret = useCallback((): string | null => {
    return hostSecretRef.current ?? readHostSecret();
  }, []);

  useEffect(() => {
    if (socket === null) {
      return;
    }

    const handleConfigResult = (payload: ConfigResultPayload): void => {
      const outcome = resolveConfigOutcome(payload);

      setServerIssues(outcome.issues);
      setIsLocked(outcome.isLocked);
      setErrorMessage(outcome.errorMessage);

      if (outcome.content === null) {
        return;
      }

      // A successful read or apply is the freshest truth on disk, so the
      // BASELINE always takes it: that is what `isDirty` diffs against, and a
      // stale baseline would misreport a draft as clean.
      //
      // The DRAFT is another matter. A read is not always something the host
      // asked for — `handleConnect` fires one on every socket (re)connect, and
      // socket.io reconnects on its own after a dropped frame — so re-seeding
      // it unconditionally threw away whatever the host had typed since the
      // last seed, with no prompt and nothing to undo it. A wifi blip mid-edit
      // was enough. Unsaved edits therefore survive a re-read and are diffed
      // against the newer baseline instead; an apply is the one read that DOES
      // reseed, because the content coming back is the host's own edits landing
      // on disk and the two agreeing is what makes the surface read "clean".
      const incoming = toConfigDraft(outcome.content);

      setContent((previous) =>
        resolveNextContentState(previous, incoming, outcome.didApply)
      );

      setGeoPromptCount(outcome.content.geoPromptCount);
      setDidApply(outcome.didApply);
    };

    const requestConfig = (hostSecret: string | null): void => {
      if (hostSecret === null) {
        return;
      }

      socket.emit(CLIENT_TO_SERVER_EVENTS.CONFIG_READ, { hostSecret });
    };

    // The secret arrives only after the claim round trip, which races first
    // render — so the read is sent when the secret lands, and again on every
    // (re)connect, rather than once on mount.
    const handleSecretIssued = (payload: HostSecretPayload): void => {
      hostSecretRef.current = payload.hostSecret;
      requestConfig(payload.hostSecret);
    };

    const handleConnect = (): void => {
      requestConfig(resolveHostSecret());
    };

    socket.on(SERVER_TO_CLIENT_EVENTS.CONFIG_RESULT, handleConfigResult);
    socket.on(SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED, handleSecretIssued);
    socket.on("connect", handleConnect);

    if (socket.connected) {
      handleConnect();
    }

    return (): void => {
      socket.off(SERVER_TO_CLIENT_EVENTS.CONFIG_RESULT, handleConfigResult);
      socket.off(SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED, handleSecretIssued);
      socket.off("connect", handleConnect);
    };
  }, [resolveHostSecret, socket]);

  // Every file is validated on every keystroke, not just the one being edited:
  // the Review step's apply button is gated on the WHOLE draft, so an invalid
  // roster has to block an apply the host started from the lineup step.
  const localIssues = useMemo(
    () => (draft === null ? [] : selectDraftIssues(draft)),
    [draft]
  );

  const issueMessagesByFile = useMemo(
    () => selectIssueMessagesByFile([...localIssues, ...serverIssues]),
    [localIssues, serverIssues]
  );

  const isDirty = useMemo(() => {
    if (draft === null || baseline === null) {
      return false;
    }

    return selectDirtyEdits(draft, baseline).length > 0;
  }, [baseline, draft]);

  const editFile = useCallback(
    <Key extends ConfigFileKey>(
      key: Key,
      edit: (file: ConfigDraft[Key]) => ConfigDraft[Key]
    ): void => {
      setContent((previous) => {
        if (previous === null) {
          return previous;
        }

        const nextDraft: ConfigDraft = { ...previous.draft };
        nextDraft[key] = edit(previous.draft[key]);

        return { baseline: previous.baseline, draft: nextDraft };
      });
      // The host is now typing past whatever the last apply reported, so the
      // confirmation stops being true.
      setDidApply(false);
    },
    []
  );

  // Apply is the wizard's ONLY write. A bare `config:save` exists on the wire
  // and on the server, but nothing here calls it: the Review step makes apply
  // the single action, so a save that did not also re-seed the room would only
  // ever leave the two out of step.
  const apply = useCallback((): void => {
    const hostSecret = resolveHostSecret();

    if (socket === null || draft === null || baseline === null || hostSecret === null) {
      return;
    }

    const files = selectDirtyEdits(draft, baseline);

    if (files.length === 0) {
      return;
    }

    socket.emit(CLIENT_TO_SERVER_EVENTS.CONFIG_APPLY, { hostSecret, files });
  }, [baseline, draft, resolveHostSecret, socket]);

  return {
    draft,
    geoPromptCount,
    issueMessagesByFile,
    hasBlockingIssues: localIssues.length > 0,
    isDirty,
    isLocked,
    didApply,
    errorMessage,
    editFile,
    apply
  };
};
