import type { SocketClientRole } from "../index.js";

type Assert<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? true
    : false;

export type SocketClientRoleUnionCheck = Assert<
  Equal<SocketClientRole, "HOST" | "DISPLAY">
>;

// @ts-expect-error SocketClientRole must not accept unsupported role values.
export type InvalidSocketClientRoleCheck = Assert<Equal<SocketClientRole, "HOST" | "DISPLAY" | "ADMIN">>;
