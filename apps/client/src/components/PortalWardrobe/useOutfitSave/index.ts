import { useCallback, useRef, useState } from "react";
import type { GenreKey, Outfit } from "@wingnight/shared";
import { PORTAL_API_ROUTES, isPortalOutfitSaved, type PortalMe } from "@wingnight/shared/guestPortal";

import { jsonRequest, requestPortal, type PortalFailure } from "../../../utils/portalApi";

export type OutfitSaveStatus = { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "failed"; error: PortalFailure };

export type OutfitSaveHandle = {
  // What the bird wears on the page: the latest tap while it saves, else what is stored.
  shown: Outfit;
  status: OutfitSaveStatus;
  dress: (outfit: Outfit) => void;
};

type UseOutfitSaveArgs = {
  genre: GenreKey;
  // The stored outfit for this genre, read as worn (PortalMe.team), the settled half.
  stored: Outfit;
  update: (next: (me: PortalMe) => PortalMe) => void;
};

// Every tap in the wardrobe is a save, optimistic like useTeamPick: the tapped outfit is shown
// at once and saved with PUT myOutfit, and on the answer the stored pick (PortalMe.team) takes
// over. Taps come faster than saves, so they are sent one at a time, latest first: a tap while a
// save is in flight replaces whatever was waiting, and goes when the flight lands. Each save is
// the genre's whole outfit, so the last one to land is the bird. A refusal drops the waiting tap
// too and puts the stored outfit back.
export const useOutfitSave = ({ genre, stored, update }: UseOutfitSaveArgs): OutfitSaveHandle => {
  const [pending, setPending] = useState<Outfit | null>(null);
  const [status, setStatus] = useState<OutfitSaveStatus>({ kind: "idle" });
  const waitingRef = useRef<Outfit | null>(null);
  const isFlyingRef = useRef(false);

  const dress = useCallback(
    (outfit: Outfit): void => {
      waitingRef.current = outfit;
      setPending(outfit);
      setStatus({ kind: "saving" });

      if (isFlyingRef.current) {
        return;
      }

      isFlyingRef.current = true;

      const fly = async (): Promise<void> => {
        while (waitingRef.current !== null) {
          const sending = waitingRef.current;
          const result = await requestPortal(
            PORTAL_API_ROUTES.myOutfit,
            isPortalOutfitSaved,
            jsonRequest("PUT", { genre, outfit: sending })
          );

          if (!result.ok) {
            waitingRef.current = null;
            setPending(null);
            setStatus({ kind: "failed", error: result.error });
            break;
          }

          const { team } = result.body;

          update((me) => ({ ...me, team }));

          if (waitingRef.current === sending) {
            waitingRef.current = null;
            setPending(null);
            setStatus({ kind: "saved" });
          }
        }

        isFlyingRef.current = false;
      };

      void fly();
    },
    [genre, update]
  );

  return { shown: pending ?? stored, status, dress };
};
