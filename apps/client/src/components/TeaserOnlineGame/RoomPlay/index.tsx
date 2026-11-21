import { CrewPhoneBordenSurface } from "@wingnight/minigames-borden/client";
import { CrewPhoneBrawlSurface } from "@wingnight/minigames-brawl/client";
import type { TeaserRoomClientMessage, TeaserRoomSnapshot } from "@wingnight/shared";

import { PhoneGameFrame } from "../../PhoneGameFrame";
import * as styles from "./styles";

type RoomPlayProps = {
  room: TeaserRoomSnapshot;
  /** The player this phone sits as, or null while it only watches. */
  you: string | null;
  serverOrigin: string | null;
  send: (message: TeaserRoomClientMessage) => void;
};

/**
 * A room's game in play on this phone: the game's own phone surface, fed the room's view and this
 * phone's pad, sending its thumbs as the game's own actions. Null for a view this page cannot draw.
 */
export const RoomPlay = ({ room, you, serverOrigin, send }: RoomPlayProps): JSX.Element | null => {
  const view = room.view;
  const pad = you === null ? null : (room.pads[you] ?? null);
  const act = (actionType: string, actionPayload: Record<string, unknown>): void => {
    send({ t: "action", actionType, actionPayload });
  };

  if (view?.minigame === "BRAWL") {
    return (
      <div className={styles.playRoot} data-teaser-room={room.code} data-teaser-room-phase="playing">
        <PhoneGameFrame>
          <CrewPhoneBrawlSurface
            view={view}
            pad={pad}
            status={room.crewStatus}
            serverOrigin={serverOrigin}
            onWalk={(dir): void => {
              act("walk", { dir });
            }}
            onPeck={(held): void => {
              act("peck", { held });
            }}
          />
        </PhoneGameFrame>
      </div>
    );
  }

  if (view?.minigame === "BORDEN") {
    return (
      <div className={styles.playRoot} data-teaser-room={room.code} data-teaser-room-phase="playing">
        <PhoneGameFrame>
          <CrewPhoneBordenSurface
            view={view}
            playerId={you}
            pad={pad}
            status={room.crewStatus}
            serverOrigin={serverOrigin}
            onStick={(dir): void => {
              act("stick", { dir });
            }}
            onJump={(): void => {
              act("jump", {});
            }}
          />
        </PhoneGameFrame>
      </div>
    );
  }

  return null;
};
