import {
  CLIENT_TO_SERVER_EVENTS,
  SERVER_TO_CLIENT_EVENTS,
  validateGameConfigFile,
  type ConfigContentSnapshot,
  type ConfigResultPayload,
  type GameConfigFile,
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
import { resolveConfigOutcome } from "../resolveConfigOutcome";
import { selectIssueMessages, type IssueMessagesByPath } from "../selectIssueMessages";

// The wizard edits exactly one content file. Roster and prompt packs are WN-19.
const GAME_CONFIG_KEY = "gameConfig";

type ConfigWizardSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "on" | "off" | "emit" | "connected"
>;

export type ConfigWizardApi = {
  gameConfig: GameConfigFile | null;
  roster: Pick<ConfigContentSnapshot, "players" | "teams"> | null;
  issueMessagesByPath: IssueMessagesByPath;
  hasBlockingIssues: boolean;
  isDirty: boolean;
  isLocked: boolean;
  didApply: boolean;
  errorMessage: string | null;
  editGameConfig: (edit: (gameConfig: GameConfigFile) => GameConfigFile) => void;
  apply: () => void;
};

// Lifted into the file's coordinates so a locally-detected issue and a
// server-reported one address the same field. The server prefixes its issues
// with the file key before they reach the wire (`contentWriter`), so without
// this the two sets would be in different coordinate systems and only one would
// ever land on an input.
const toFileScopedIssues = (issues: ValidationIssue[]): ValidationIssue[] => {
  return issues.map(({ path, message }) => ({
    path: path.length === 0 ? GAME_CONFIG_KEY : `${GAME_CONFIG_KEY}.${path}`,
    message
  }));
};

export const useConfigWizard = (
  socket: ConfigWizardSocket | null
): ConfigWizardApi => {
  const [snapshot, setSnapshot] = useState<ConfigContentSnapshot | null>(null);
  const [draft, setDraft] = useState<GameConfigFile | null>(null);
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

      // A successful read or apply is the freshest truth on disk, so it
      // re-seeds both the baseline and the draft — after an apply the two
      // agree, which is what makes the surface read "clean" again.
      setSnapshot(outcome.content);
      setDraft(outcome.content.gameConfig);
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

  // Called bare, without the minigame-rules validator: `packages/shared` has no
  // way to reach the runtime plugins, and neither does the client. The server
  // injects its plugin-backed validator on the write path, so rules failures
  // still come back as server issues — this is a pre-check, not a replacement.
  const localIssues = useMemo(
    () => (draft === null ? [] : validateGameConfigFile(draft)),
    [draft]
  );

  const issueMessagesByPath = useMemo(
    () =>
      selectIssueMessages(
        [...toFileScopedIssues(localIssues), ...serverIssues],
        GAME_CONFIG_KEY
      ),
    [localIssues, serverIssues]
  );

  const isDirty = useMemo(() => {
    if (draft === null || snapshot === null) {
      return false;
    }

    return JSON.stringify(draft) !== JSON.stringify(snapshot.gameConfig);
  }, [draft, snapshot]);

  const editGameConfig = useCallback(
    (edit: (gameConfig: GameConfigFile) => GameConfigFile): void => {
      setDraft((previous) => (previous === null ? previous : edit(previous)));
      // The host is now typing past whatever the last apply reported, so the
      // confirmation stops being true.
      setDidApply(false);
    },
    []
  );

  const apply = useCallback((): void => {
    const hostSecret = resolveHostSecret();

    if (socket === null || draft === null || hostSecret === null) {
      return;
    }

    socket.emit(CLIENT_TO_SERVER_EVENTS.CONFIG_APPLY, {
      hostSecret,
      // `ConfigFileEdit.value` is the file's WHOLE next contents, not a delta.
      files: [{ key: GAME_CONFIG_KEY, value: draft }]
    });
  }, [draft, resolveHostSecret, socket]);

  return {
    gameConfig: draft,
    roster: snapshot,
    issueMessagesByPath,
    hasBlockingIssues: localIssues.length > 0,
    isDirty,
    isLocked,
    didApply,
    errorMessage,
    editGameConfig,
    apply
  };
};
