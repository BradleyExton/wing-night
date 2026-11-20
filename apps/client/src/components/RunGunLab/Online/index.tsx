import { useState } from "react";

import { useIsLandscape } from "../../PhoneGameFrame/useIsLandscape";
import { LAB_ROOM_CODE_PATTERN } from "../onlineProtocol";
import { runGunLabCopy } from "../copy";
import { padInk, resolveSlotColour } from "../palette";
import { PadControls } from "../PadControls";
import { Scene } from "../Yard/Scene";
import { DEFAULT_YARD_TUNING, isHenDown } from "../yardSim";
import * as styles from "./styles";
import { useLabRoom } from "./useLabRoom";

const copy = runGunLabCopy.online;

const ROOM_PATH_PREFIX = "/r/";
// No I or O, so a code read out loud is never misheard as a digit.
const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_LENGTH = 4;
const COPIED_MS = 2000;

const makeRoomCode = (): string =>
  Array.from({ length: CODE_LENGTH }, () => CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)] ?? "A").join("");

const resolveRoomCode = (pathname: string): string | null => {
  if (!pathname.startsWith(ROOM_PATH_PREFIX)) {
    return null;
  }

  const code = pathname.slice(ROOM_PATH_PREFIX.length).toUpperCase();

  return LAB_ROOM_CODE_PATTERN.test(code) ? code : null;
};

const Room = ({ code }: { code: string }): JSX.Element => {
  const isLandscape = useIsLandscape();
  const room = useLabRoom(code);
  const [isCopied, setIsCopied] = useState(false);
  const world = room.worldRef.current;
  const hen = world.hens.find((candidate) => candidate.padId === room.padId);
  const colour = room.slot === null ? padInk.dim : resolveSlotColour(room.slot);

  const share = async (): Promise<void> => {
    const url = window.location.href;

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: copy.shareTitle, url });

        return;
      }

      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      window.setTimeout(() => {
        setIsCopied(false);
      }, COPIED_MS);
    } catch {
      // Dismissed the share sheet, or no clipboard: the address bar still has the link.
    }
  };

  const status =
    room.status === "connecting"
      ? copy.connecting
      : room.status === "reconnecting"
        ? copy.reconnecting
        : room.status === "watching"
          ? copy.full
          : null;

  return (
    <main className={styles.root} data-proto-rungun-online={code} data-proto-status={room.status}>
      <div className={styles.stage}>
        <Scene world={world} frame={room.frame} forgiveness={DEFAULT_YARD_TUNING.forgiveness} showBoxes={false} />
      </div>
      {room.status === "playing" && (
        <PadControls colour={colour} isLabelled={false} onStick={room.sendStick} onJump={room.sendJump} />
      )}
      <div className={styles.header}>
        <span
          className={styles.headerBlock}
          data-proto-faced={hen?.faced ?? 0}
          data-proto-dodged={hen?.dodged ?? 0}
          data-proto-input-ms={room.inputMs === null ? "" : Math.round(room.inputMs)}
        >
          <span className={styles.headerName}>
            {room.slot === null ? copy.roomTag(code) : `${copy.playerTag(room.slot)} ${copy.hearts(hen === undefined || isHenDown(hen, world.tick) ? 0 : hen.hearts)}`}
          </span>
          {hen !== undefined && <span className={styles.headerLine}>{copy.dodgeLine(hen.dodged, hen.faced)}</span>}
        </span>
        <button
          type="button"
          className={styles.shareButton}
          onClick={(): void => {
            void share();
          }}
        >
          {isCopied ? copy.copied : `${copy.roomTag(code)} · ${copy.share}`}
        </button>
        <span className={styles.headerBlock}>
          <span className={styles.headerLine}>{copy.inputLine(room.inputMs)}</span>
          <span className={styles.headerLine}>{copy.pingLine(room.pingMs)}</span>
        </span>
      </div>
      {status !== null && <p className={styles.status}>{status}</p>}
      {!isLandscape && (
        <div className={styles.rotate}>
          <p className={styles.rotateText}>{copy.rotate}</p>
        </div>
      )}
    </main>
  );
};

/**
 * PROTOTYPE — throwaway (docs/minigames/base-borden-spec.md §0.7 step 1). The online jump lab:
 * the LAN lab's yard, but run in a Durable Object room on the internet, with every phone drawing
 * the yard itself and the pad laid over it. `/` makes a room; `/r/<CODE>` is the link to send.
 */
export const RunGunOnlineLab = (): JSX.Element => {
  const [code, setCode] = useState(() => resolveRoomCode(window.location.pathname));

  if (code !== null) {
    return <Room code={code} />;
  }

  return (
    <main className={styles.lobby}>
      <h1 className={styles.lobbyTitle}>{copy.title}</h1>
      <p className={styles.lobbyText}>{copy.lede}</p>
      <button
        type="button"
        className={styles.lobbyButton}
        onClick={(): void => {
          const next = makeRoomCode();

          window.history.pushState(null, "", `${ROOM_PATH_PREFIX}${next}`);
          setCode(next);
        }}
      >
        {copy.makeRoom}
      </button>
      <p className={styles.lobbyText}>{copy.shareHint}</p>
    </main>
  );
};
