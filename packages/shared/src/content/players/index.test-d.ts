import type { PlayersContentEntry, PlayersContentFile } from "../../index.js";

type Assert<T extends true> = T;
type IsAssignable<From, To> = From extends To ? true : false;

export type ValidPlayersContentEntryCheck = Assert<
  IsAssignable<{ name: string; avatarSrc?: string }, PlayersContentEntry>
>;

export type ValidPlayersContentFileCheck = Assert<
  IsAssignable<{ players: PlayersContentEntry[] }, PlayersContentFile>
>;

// @ts-expect-error Player content entry requires a name.
export type MissingPlayerNameCheck = Assert<IsAssignable<{ avatarSrc: string }, PlayersContentEntry>>;

// @ts-expect-error avatarSrc must be a string when provided.
export type InvalidAvatarTypeCheck = Assert<IsAssignable<{ name: string; avatarSrc: number }, PlayersContentEntry>>;

// @ts-expect-error players must be an array.
export type InvalidPlayersCollectionCheck = Assert<IsAssignable<{ players: string }, PlayersContentFile>>;
