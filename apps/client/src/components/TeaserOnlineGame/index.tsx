import { useState } from "react";
import { wakeAudio } from "@wingnight/audio";
import { CrewPhoneBrawlSurface } from "@wingnight/minigames-brawl/client";
import {
  TEASER_ROOM_PAGE_PREFIX,
  TEASER_ROOM_SEATS_MAX,
  isTeaserRoomCode,
  type TeaserRoster
} from "@wingnight/shared";

import { useServerOrigin } from "../../utils/useServerOrigin";
import { PhoneGameFrame } from "../PhoneGameFrame";
import { TEASER_ROUTES } from "../TeaserApp/teaserRoutes";
import { teaserOnlineGameCopy as copy } from "./copy";
import * as styles from "./styles";
import { useTeaserRoom } from "./useTeaserRoom";

// No I or O, so a code read out loud is never misheard as a digit.
const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_LENGTH = 4;
const COPIED_MS = 2000;

const makeRoomCode = (): string =>
  Array.from({ length: CODE_LENGTH }, () => CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)] ?? "A").join("");

/** The room a `/play/<CODE>` path names, or null for `/play` itself (or a code that is not one). */
export const resolveRoomCodeFromPath = (path: string): string | null => {
  if (!path.startsWith(TEASER_ROOM_PAGE_PREFIX)) {
    return null;
  }

  const code = path.slice(TEASER_ROOM_PAGE_PREFIX.length).toUpperCase();

  return isTeaserRoomCode(code) ? code : null;
};

const TopBar = ({ pingMs }: { pingMs: number | null }): JSX.Element => (
  <div className={styles.topBar}>
    <a className={styles.back} href={TEASER_ROUTES.home}>
      <span className={styles.backChevron} aria-hidden />
      {copy.back}
    </a>
    <span className={styles.ping}>{copy.ping(pingMs)}</span>
  </div>
);

const ShareButton = ({ code }: { code: string }): JSX.Element => {
  const [isCopied, setIsCopied] = useState(false);

  const share = async (): Promise<void> => {
    const url = `${window.location.origin}${TEASER_ROOM_PAGE_PREFIX}${code}`;

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: copy.shareTitle, text: copy.shareText, url });

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

  return (
    <button
      type="button"
      className={styles.secondaryButton}
      onClick={(): void => {
        void share();
      }}
    >
      {isCopied ? copy.copied : copy.share}
    </button>
  );
};

const OnlineRoom = ({ code, roster }: { code: string; roster: TeaserRoster }): JSX.Element => {
  const serverOrigin = useServerOrigin();
  const { connection, room, you, refusal, pingMs, send } = useTeaserRoom(code);
  const view = room?.view?.minigame === "BRAWL" ? room.view : null;

  if (room !== null && room.phase === "playing" && view !== null) {
    return (
      <div className={styles.playRoot} data-teaser-room={code} data-teaser-room-phase="playing">
        <PhoneGameFrame>
          <CrewPhoneBrawlSurface
            view={view}
            pad={you === null ? null : (room.pads[you] ?? null)}
            status={room.crewStatus}
            serverOrigin={serverOrigin}
            onWalk={(dir): void => {
              send({ t: "action", actionType: "walk", actionPayload: { dir } });
            }}
            onPeck={(held): void => {
              send({ t: "action", actionType: "peck", actionPayload: { held } });
            }}
          />
        </PhoneGameFrame>
      </div>
    );
  }

  const seats = room?.seats ?? [];
  const seatOf = (playerId: string) => seats.find((seat) => seat.playerId === playerId);
  const playersById = new Map(roster.players.map((player) => [player.id, player]));
  const isOpen = connection === "open" && room !== null;
  const status = connection === "connecting" ? copy.connecting : connection === "reconnecting" ? copy.reconnecting : null;

  return (
    <main className={styles.page} data-teaser-room={code} data-teaser-room-phase={room?.phase ?? "connecting"}>
      <TopBar pingMs={pingMs} />
      <h1 className={styles.title}>{copy.title}</h1>
      <div className={styles.roomRow}>
        <span className={styles.roomCode}>{copy.roomTag(code)}</span>
        <ShareButton code={code} />
      </div>

      {room?.phase === "finished" && view !== null && (
        <section className={styles.finishCard} data-teaser-room-finish="">
          <p className={styles.finishKicker}>{copy.finishedKicker}</p>
          <p className={styles.finishHeadline}>{copy.finishedHeadline(view.points)}</p>
          <p className={styles.finishLine}>{copy.finishedLine(view.banked, view.total)}</p>
        </section>
      )}

      {room?.phase === "playing" && <p className={styles.status}>{copy.watching}</p>}

      <section className={styles.teamBlock}>
        <h2 className={styles.heading}>{copy.pickHeading}</h2>
        <p className={styles.hint}>{copy.pickHint}</p>
        {roster.teams.map((team) => (
          <div key={team.id} className={styles.teamBlock}>
            <p className={styles.teamName}>{team.name}</p>
            <div className={styles.faces}>
              {team.playerIds.map((playerId) => {
                const player = playersById.get(playerId);
                const seat = seatOf(playerId);
                const isMine = you === playerId;
                const isTaken = seat !== undefined && !isMine;

                return player === undefined ? null : (
                  <button
                    key={playerId}
                    type="button"
                    className={styles.face}
                    data-mine={isMine}
                    data-teaser-room-face={playerId}
                    disabled={!isOpen || isTaken || room?.phase === "playing"}
                    onClick={(): void => {
                      wakeAudio();
                      send({ t: "seat", playerId: isMine ? null : playerId });
                    }}
                  >
                    {player.name}
                    {isMine && <span className={styles.faceNote}>{copy.you}</span>}
                    {isTaken && <span className={styles.faceNote}>{seat.connected ? copy.taken : copy.away}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <p className={styles.hint}>{copy.seated(seats.length, TEASER_ROOM_SEATS_MAX)}</p>
      {refusal !== null && <p className={styles.notice}>{copy.refusals[refusal]}</p>}
      {status !== null && <p className={styles.status}>{status}</p>}

      {room?.phase !== "playing" && (
        <>
          <button
            type="button"
            className={styles.primaryButton}
            data-teaser-room-start=""
            disabled={!isOpen || you === null}
            onClick={(): void => {
              // The phone is the speaker online; a browser only lets a tap start its audio.
              wakeAudio();
              send({ t: "start" });
            }}
          >
            {room?.phase === "finished" ? copy.playAgain : copy.start}
          </button>
          <p className={styles.hint}>{you === null ? copy.needSeat : copy.startHint}</p>
        </>
      )}
    </main>
  );
};

/**
 * Streets of Barrie on the teaser, played together online (docs/minigames/base-borden-spec.md
 * §0.7 step 2): `/play` makes a room, `/play/<CODE>` is the link to send. The room is a Durable
 * Object on the teaser's Worker that runs the party's own runtime; this page picks a bird, starts
 * the game, and draws the street with this phone's thumbs over it.
 */
export const TeaserOnlineGame = ({ path, roster }: { path: string; roster: TeaserRoster }): JSX.Element => {
  const code = resolveRoomCodeFromPath(path);

  if (code !== null) {
    return <OnlineRoom code={code} roster={roster} />;
  }

  return (
    <main className={styles.page} data-teaser-room-lobby="">
      <TopBar pingMs={null} />
      <h1 className={styles.title}>{copy.title}</h1>
      <p className={styles.lede}>{copy.lede}</p>
      <button
        type="button"
        className={styles.primaryButton}
        onClick={(): void => {
          // The teaser has no router: a page is a real navigation.
          window.location.assign(`${TEASER_ROOM_PAGE_PREFIX}${makeRoomCode()}`);
        }}
      >
        {copy.makeRoom}
      </button>
    </main>
  );
};
