import { useCallback, useEffect, useState } from "react";
import {
  AVATAR_ATTEMPT_ID_HEADER,
  AVATAR_HEAD_TYPE,
  AVATAR_TRIES_LEFT_HEADER,
  PORTAL_API_ROUTES,
  isPortalAvatarStatus,
  readPortalErrorCode,
  resolveAvatarAcceptRoute,
  type PortalAvatarStatus
} from "@wingnight/shared/guestPortal";

import { requestPortal, sendPortalRequest } from "../../../../utils/portalApi";
import { finishGeneratedHead, HeadFinishError } from "../finishHead";
import { preparePhotoDataUrl } from "../preparePhoto";

// What the studio is doing. A `preview` is a painted, keyed head held in the browser until the
// guest keeps it: only `accept` sends it to the portal.
export type StudioPhase =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "removing" }
  | { kind: "painting" }
  | { kind: "preview"; attemptId: string; previewSrc: string; png: Blob }
  | { kind: "accepting"; attemptId: string; previewSrc: string; png: Blob };

// What went wrong, as the studio's copy names it.
export type StudioProblem =
  | "unreadablePhoto"
  | "photoTooLarge"
  | "noPhoto"
  | "triesExhausted"
  | "painterFailed"
  | "refused"
  | "blank"
  | "acceptFailed"
  | "removeFailed"
  | "network";

export type AvatarStudio = {
  phase: StudioPhase;
  problem: StudioProblem | null;
  // The photo picked on this phone, shown beside the paint button; gone after a reload.
  photoSrc: string | null;
  choosePhoto: (file: File) => Promise<void>;
  paint: () => Promise<void>;
  accept: () => Promise<void>;
  removePhoto: () => Promise<void>;
};

const readTriesLeft = (headers: Headers, fallback: number): number => {
  const value = Number(headers.get(AVATAR_TRIES_LEFT_HEADER));

  return Number.isInteger(value) && value >= 0 ? value : fallback;
};

const readJsonSafely = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
};

const PAINT_FAILURES: Record<number, StudioProblem> = { 409: "noPhoto", 429: "triesExhausted" };

// The head studio's whole flow: pick a photo (downscaled here, then uploaded), spend a try on a
// paint (keyed here), keep it. `onAvatar` hands the portal's new avatar status up to the page.
export const useAvatarStudio = (
  avatar: PortalAvatarStatus,
  onAvatar: (next: PortalAvatarStatus) => void
): AvatarStudio => {
  const [phase, setPhase] = useState<StudioPhase>({ kind: "idle" });
  const [problem, setProblem] = useState<StudioProblem | null>(null);
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const previewSrc = phase.kind === "preview" || phase.kind === "accepting" ? phase.previewSrc : null;

  // A preview's object URL lives exactly as long as the preview does.
  useEffect(() => {
    return (): void => {
      if (previewSrc !== null) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  // A painted head that is not kept is a spent try thrown away: leaving the page asks first.
  useEffect(() => {
    if (previewSrc === null) {
      return undefined;
    }

    const warn = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warn);

    return (): void => window.removeEventListener("beforeunload", warn);
  }, [previewSrc]);

  const choosePhoto = useCallback(
    async (file: File): Promise<void> => {
      setProblem(null);
      setPhase({ kind: "uploading" });
      const dataUrl = await preparePhotoDataUrl(file);

      if (dataUrl === null) {
        setProblem("unreadablePhoto");
        setPhase({ kind: "idle" });
        return;
      }

      const result = await requestPortal(PORTAL_API_ROUTES.myAvatarPhoto, isPortalAvatarStatus, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: dataUrl
      });

      setPhase({ kind: "idle" });

      if (!result.ok) {
        setProblem(
          result.error === "too_large"
            ? "photoTooLarge"
            : result.error === "tries_exhausted"
              ? "triesExhausted"
              : result.error === "network"
                ? "network"
                : "unreadablePhoto"
        );
        return;
      }

      setPhotoSrc(dataUrl);
      onAvatar(result.body);
    },
    [onAvatar]
  );

  const paint = useCallback(async (): Promise<void> => {
    setProblem(null);
    setPhase({ kind: "painting" });
    const response = await sendPortalRequest(PORTAL_API_ROUTES.myAvatarGenerate, { method: "POST" });

    if (response === null) {
      setProblem("network");
      setPhase({ kind: "idle" });
      return;
    }

    const triesLeft = readTriesLeft(response.headers, avatar.triesLeft);
    const reply = await readJsonSafely(response);

    onAvatar({ ...avatar, triesLeft });

    if (!response.ok) {
      const code = readPortalErrorCode(reply);
      setProblem(code === null ? "painterFailed" : (PAINT_FAILURES[response.status] ?? "painterFailed"));
      setPhase({ kind: "idle" });
      return;
    }

    const attemptId = response.headers.get(AVATAR_ATTEMPT_ID_HEADER) ?? "";

    try {
      const png = await finishGeneratedHead(reply);

      setPhase({ kind: "preview", attemptId, png, previewSrc: URL.createObjectURL(png) });
    } catch (error) {
      setProblem(error instanceof HeadFinishError && error.reason === "refused" ? "refused" : "blank");
      setPhase({ kind: "idle" });
    }
  }, [avatar, onAvatar]);

  const accept = useCallback(async (): Promise<void> => {
    if (phase.kind !== "preview") {
      return;
    }

    setProblem(null);
    setPhase({ ...phase, kind: "accepting" });
    const result = await requestPortal(resolveAvatarAcceptRoute(phase.attemptId), isPortalAvatarStatus, {
      method: "POST",
      headers: { "Content-Type": AVATAR_HEAD_TYPE },
      body: phase.png
    });

    if (!result.ok) {
      setProblem(result.error === "network" ? "network" : "acceptFailed");
      setPhase({ ...phase, kind: "preview" });
      return;
    }

    // Accepting spends the photo on the portal; it is spent here too.
    setPhotoSrc(null);
    setPhase({ kind: "idle" });
    onAvatar(result.body);
  }, [phase, onAvatar]);

  const removePhoto = useCallback(async (): Promise<void> => {
    setProblem(null);
    setPhase({ kind: "removing" });
    const result = await requestPortal(PORTAL_API_ROUTES.myAvatarPhoto, isPortalAvatarStatus, { method: "DELETE" });

    setPhase({ kind: "idle" });

    if (!result.ok) {
      setProblem(result.error === "network" ? "network" : "removeFailed");
      return;
    }

    setPhotoSrc(null);
    onAvatar(result.body);
  }, [onAvatar]);

  return { phase, problem, photoSrc, choosePhoto, paint, accept, removePhoto };
};
