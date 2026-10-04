// What a route handler is handed. The app resolves the caller before the handler runs, so a
// guest route's handler always has a session and an admin route's has already been let in.
import type { PortalDeps } from "../deps/index.ts";
import type { RouteMethod } from "../router/index.ts";
import type { SessionGuest } from "../sessions/index.ts";

export type PublicContext = {
  request: Request;
  url: URL;
  params: Record<string, string>;
  deps: PortalDeps;
};

export type GuestContext = PublicContext & {
  session: SessionGuest;
};

// An admin is either a signed-in guest with `is_admin` or a script holding ADMIN_API_TOKEN;
// no admin handler needs to know which.
export type AdminContext = PublicContext;

type Route<Access, Context> = {
  method: RouteMethod;
  pattern: string;
  access: Access;
  handle: (context: Context) => Promise<Response>;
};

export type PortalRoute =
  | Route<"public", PublicContext>
  | Route<"guest", GuestContext>
  | Route<"admin", AdminContext>;
