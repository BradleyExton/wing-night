import type { BrawlCrewEvent, BrawlCrewFrame } from "@wingnight/shared";

/**
 * How far apart two tellings of one event may be and still be the same event. A screen steps its
 * own copy of the fight between the server's frames (`useCrewFrame`), so it can see a hit a tick
 * or two before or after the server's frame says it happened. Nothing in the sim can repeat —
 * same kind, same hen, same goon — inside this: a peck's cooldown and a hit's mercy window are
 * both longer.
 */
export const SAME_EVENT_TICKS = 8;

/**
 * How old an event may be when a screen first sees a fight and still be rung. A wall that
 * reloads mid-block is handed two seconds of events at once; it rings the ones that are
 * happening, not the block's recent history in one chord.
 */
export const FRESH_EVENT_TICKS = 12;

export type CrewEventReader = {
  /**
   * The events in `frame` this reader has not handed out before, oldest first. `key` names the
   * fight (`CrewStreet.key`): a new one forgets everything the last one rang.
   */
  read: (key: string, frame: BrawlCrewFrame) => BrawlCrewEvent[];
};

const resolveIdentity = (event: BrawlCrewEvent): string => `${event.kind}:${event.hen ?? ""}:${event.spawnIndex ?? ""}`;

/**
 * Hands each thing that happens on the street to a screen ONCE. The frame carries a window of
 * its last two seconds of events and a screen is given a new frame many times a second, some of
 * them from the server and some stepped here — so the same hit is in dozens of frames, and now
 * and then at a tick one off. Every consumer that must act once (a cue, a flinch) reads the
 * street through one of these: an event is new if nothing of its kind, hen and goon was rung
 * within `SAME_EVENT_TICKS` of it.
 */
export const createCrewEventReader = (): CrewEventReader => {
  let heldKey: string | null = null;
  const rung = new Map<string, number[]>();

  return {
    read: (key, frame) => {
      const isFirstSight = key !== heldKey;

      if (isFirstSight) {
        heldKey = key;
        rung.clear();
      }

      const fresh: BrawlCrewEvent[] = [];

      for (const event of frame.events) {
        const identity = resolveIdentity(event);
        const ticks = rung.get(identity) ?? [];

        if (ticks.some((tick) => Math.abs(tick - event.tick) <= SAME_EVENT_TICKS)) {
          continue;
        }

        rung.set(identity, [...ticks.filter((tick) => event.tick - tick <= SAME_EVENT_TICKS * 4), event.tick]);

        if (!isFirstSight || frame.tick - event.tick <= FRESH_EVENT_TICKS) {
          fresh.push(event);
        }
      }

      return fresh;
    }
  };
};
