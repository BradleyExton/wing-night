import type { TeamsContentEntry, TeamsContentFile } from "../../index.js";

type Assert<T extends true> = T;
type IsAssignable<From, To> = From extends To ? true : false;

export type ValidTeamsContentEntryCheck = Assert<
  IsAssignable<{ name: string }, TeamsContentEntry>
>;

export type ValidTeamsContentFileCheck = Assert<
  IsAssignable<{ teams: TeamsContentEntry[] }, TeamsContentFile>
>;

// @ts-expect-error Team content entry requires a name.
export type MissingTeamNameCheck = Assert<IsAssignable<{ label: string }, TeamsContentEntry>>;

// @ts-expect-error teams must be an array.
export type InvalidTeamsCollectionCheck = Assert<IsAssignable<{ teams: string }, TeamsContentFile>>;
