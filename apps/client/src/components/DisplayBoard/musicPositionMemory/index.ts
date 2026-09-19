import type { MusicPlaybackSource } from "@wingnight/shared";

// Where each track was when it last stopped, remembered by the DISPLAY.
//
// This is deliberately not room state. The server names the track and says
// whether it is playing; how far into the file the TV is belongs to the TV,
// the same way the fade does. Keeping it here means a team's anthem picks up
// in round three where it faded out in round one — the reason it exists —
// without a second display-reported event (AGENTS.md §3.3) or timer-shaped
// clock machinery on the server. The trade: a second display keeps its own
// memory, and the sample-pack e2e runs with none, both of which are fine.
//
// Storage is localStorage, so a display refresh mid-track resumes too. Every
// read and write is best-effort: a private window with no storage plays from
// the top, which is what it did before.

const MUSIC_POSITION_STORAGE_KEY = "wingnight.musicPositions";
// A track remembered this close to its end starts over instead: resuming
// into the last few seconds plays a tail and a silence, not a song.
const RESUME_TAIL_SECONDS = 8;

type MusicPositionStorageBackend = Pick<Storage, "getItem" | "setItem">;
type MusicPositionMemory = Record<string, number>;

const resolveStorageBackend = (): MusicPositionStorageBackend | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const buildMusicPositionKey = (
  source: MusicPlaybackSource,
  trackFileName: string
): string => {
  return `${source}/${trackFileName}`;
};

const readMemory = (backend: MusicPositionStorageBackend): MusicPositionMemory => {
  try {
    const raw = backend.getItem(MUSIC_POSITION_STORAGE_KEY);

    if (raw === null) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }

    const memory: MusicPositionMemory = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        memory[key] = value;
      }
    }

    return memory;
  } catch {
    return {};
  }
};

const writeMemory = (
  backend: MusicPositionStorageBackend,
  memory: MusicPositionMemory
): void => {
  try {
    backend.setItem(MUSIC_POSITION_STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // Quota, a private window, a locked-down kiosk. The song plays from the top.
  }
};

export const readMusicPosition = (
  key: string,
  backend: MusicPositionStorageBackend | null = resolveStorageBackend()
): number | null => {
  if (backend === null) {
    return null;
  }

  return readMemory(backend)[key] ?? null;
};

export const rememberMusicPosition = (
  key: string,
  seconds: number,
  backend: MusicPositionStorageBackend | null = resolveStorageBackend()
): void => {
  if (backend === null || !Number.isFinite(seconds) || seconds < 0) {
    return;
  }

  writeMemory(backend, { ...readMemory(backend), [key]: seconds });
};

export const forgetMusicPosition = (
  key: string,
  backend: MusicPositionStorageBackend | null = resolveStorageBackend()
): void => {
  if (backend === null) {
    return;
  }

  const memory = readMemory(backend);

  if (!(key in memory)) {
    return;
  }

  delete memory[key];
  writeMemory(backend, memory);
};

// Where to seek before playing. `durationSeconds` is NaN until the element
// has metadata, in which case the remembered position is trusted as-is and
// the tail rule is applied again once the duration is known.
export const resolveResumeSeconds = (
  rememberedSeconds: number | null,
  durationSeconds: number
): number => {
  if (rememberedSeconds === null || !Number.isFinite(rememberedSeconds)) {
    return 0;
  }

  if (
    Number.isFinite(durationSeconds) &&
    durationSeconds > 0 &&
    rememberedSeconds >= durationSeconds - RESUME_TAIL_SECONDS
  ) {
    return 0;
  }

  return Math.max(0, rememberedSeconds);
};
