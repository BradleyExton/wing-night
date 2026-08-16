import { useEffect, useState } from "react";

import {
  type BoardBucketKey,
  type BoardCard,
  type BoardTicket,
  bucketBoardTickets
} from "../../utils/bucketBoardTickets";
import { devBoardCopy } from "./copy";
import * as styles from "./styles";

type BoardPayload = {
  tickets: BoardTicket[];
  nextTicketId: string | null;
};

type BoardState =
  | { phase: "loading" }
  | { phase: "ready"; payload: BoardPayload }
  | { phase: "error" };

// Same resolution `resolveSocketServerUrl` uses. Called only from the effect
// below — a bare `window` / `import.meta.env` read at module or render scope
// throws under `tsx --test`, where there is no DOM and no Vite.
const resolveBoardApiUrl = (): string => {
  const configuredUrl = import.meta.env.VITE_SOCKET_SERVER_URL;
  const origin =
    configuredUrl && configuredUrl.trim().length > 0
      ? configuredUrl.trim()
      : `${window.location.protocol}//${window.location.hostname}:3000`;

  return `${origin}/api/dev/board`;
};

const readPayload = (body: unknown): BoardPayload | null => {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const { index, next } = body as { index?: unknown; next?: unknown };
  const tickets = (index as { tickets?: unknown })?.tickets;

  if (!Array.isArray(tickets)) {
    return null;
  }

  const nextTicket = (next as { next?: { id?: unknown } })?.next;
  const nextTicketId = typeof nextTicket?.id === "string" ? nextTicket.id : null;

  return { tickets: tickets as BoardTicket[], nextTicketId };
};

const describeCard = (card: BoardCard): string => {
  const parts = [card.ticket.kind, card.ticket.priority].filter(
    (part): part is string => typeof part === "string" && part.length > 0
  );

  if (card.blockingDeps.length > 0) {
    parts.push(`${devBoardCopy.waitingOnPrefix} ${card.blockingDeps.join(", ")}`);
  }

  return parts.join(" · ");
};

// Exported for its own test: the board's fetch runs in an effect, so a server
// render can never reach a populated bucket, and this is the seam that lets the
// card chrome be asserted directly.
export const BucketColumn = ({
  title,
  cards
}: {
  title: string;
  cards: BoardCard[];
}): JSX.Element => {
  return (
    <section className={styles.bucket}>
      <h2 className={styles.bucketHeading}>
        {title}
        <span className={styles.bucketCount}>{cards.length}</span>
      </h2>

      {cards.length === 0 ? (
        <p className={styles.emptyBucket}>{devBoardCopy.emptyBucket}</p>
      ) : (
        <ul className={styles.cardList}>
          {cards.map((card) => (
            <li key={card.ticket.id} className={card.isNext ? styles.cardNext : styles.card}>
              <p className={styles.cardId}>
                {card.ticket.id}
                {card.isNext ? (
                  <span className={styles.nextBadge}>{devBoardCopy.nextBadge}</span>
                ) : null}
              </p>
              <p className={styles.cardTitle}>{card.ticket.title}</p>
              <p className={styles.cardMeta}>{describeCard(card)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const BUCKET_ORDER: BoardBucketKey[] = [
  "inProgress",
  "readyPickable",
  "waitingOnDeps",
  "inReview",
  "blocked",
  "funnel"
];

export const DevBoard = (): JSX.Element => {
  const [state, setState] = useState<BoardState>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      try {
        const response = await fetch(resolveBoardApiUrl());
        const payload = response.ok ? readPayload(await response.json()) : null;

        if (cancelled) {
          return;
        }

        setState(payload === null ? { phase: "error" } : { phase: "ready", payload });
      } catch {
        if (!cancelled) {
          setState({ phase: "error" });
        }
      }
    };

    void load();

    return (): void => {
      cancelled = true;
    };
  }, []);

  const buckets =
    state.phase === "ready"
      ? bucketBoardTickets(state.payload.tickets, state.payload.nextTicketId)
      : null;

  return (
    <main className={styles.container}>
      <p className={styles.kicker}>{devBoardCopy.kicker}</p>
      <h1 className={styles.heading}>{devBoardCopy.heading}</h1>

      {state.phase === "loading" ? <p className={styles.status}>{devBoardCopy.loading}</p> : null}

      {state.phase === "error" ? (
        <div className={styles.errorPanel}>
          <p className={styles.errorHeading}>{devBoardCopy.errorHeading}</p>
          <p className={styles.errorHint}>{devBoardCopy.errorHint}</p>
        </div>
      ) : null}

      {buckets === null ? null : (
        <div className={styles.buckets}>
          {BUCKET_ORDER.map((key) => (
            <BucketColumn key={key} title={devBoardCopy.bucketTitle[key]} cards={buckets[key]} />
          ))}
        </div>
      )}
    </main>
  );
};
