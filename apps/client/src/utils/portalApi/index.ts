// The teaser pages' one way to call the guest portal (apps/teaser-worker). Same origin in
// production and in `pnpm teaser:dev` (Vite forwards /api), so every path is relative and the
// session cookie rides along on its own. Every answer is read through a guard from
// @wingnight/shared/guestPortal: a page that got something it cannot read gets an error, never
// a half-shaped object.
import { readPortalErrorCode, type PortalErrorCode } from "@wingnight/shared/guestPortal";

// `network` is a request that never got an answer, `unreadable` one whose body was not what the
// route promises; everything else is the API's own error code.
export type PortalFailure = PortalErrorCode | "network" | "unreadable";

export type PortalResult<T> =
  | { ok: true; body: T; headers: Headers }
  | { ok: false; status: number; error: PortalFailure };

export type PortalGuard<T> = (value: unknown) => value is T;

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
};

// The JSON body as `T`, or the failure that stood in its way.
export const readPortalResponse = async <T>(response: Response, guard: PortalGuard<T>): Promise<PortalResult<T>> => {
  const body = await readJson(response);

  if (!response.ok) {
    return { ok: false, status: response.status, error: readPortalErrorCode(body) ?? "unreadable" };
  }

  return guard(body)
    ? { ok: true, body, headers: response.headers }
    : { ok: false, status: response.status, error: "unreadable" };
};

// The raw response, for the one route whose body a caller reads its own way (generate streams
// Gemini's JSON), or a network failure.
export const sendPortalRequest = async (path: string, init?: RequestInit): Promise<Response | null> => {
  try {
    return await fetch(path, { credentials: "same-origin", ...init });
  } catch {
    return null;
  }
};

export const requestPortal = async <T>(
  path: string,
  guard: PortalGuard<T>,
  init?: RequestInit
): Promise<PortalResult<T>> => {
  const response = await sendPortalRequest(path, init);

  return response === null ? { ok: false, status: 0, error: "network" } : readPortalResponse(response, guard);
};

// A JSON body for a write: the method, the body and its Content-Type in one.
export const jsonRequest = (method: "POST" | "PUT" | "PATCH", body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
});

// For a route whose answer the caller only needs to know went through.
export const isAnyBody = (_value: unknown): _value is unknown => true;
