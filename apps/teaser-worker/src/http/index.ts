// Response building and request reading shared by every route.
import type { PortalErrorCode } from "@wingnight/shared/guestPortal";

// On every response the Worker sends, whatever made it (app/index.ts applies them last). The
// robots value matches the static site's `_headers` (tools/build-teaser), which never reaches a
// Worker-made response.
export const PORTAL_RESPONSE_HEADERS: Readonly<Record<string, string>> = {
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer"
};

export const withPortalHeaders = (response: Response): Response => {
  // A fetched or redirect response has immutable headers, so it is always rebuilt.
  const wrapped = new Response(response.body, response);

  for (const [name, value] of Object.entries(PORTAL_RESPONSE_HEADERS)) {
    wrapped.headers.set(name, value);
  }

  return wrapped;
};

export const jsonResponse = (body: unknown, status = 200, headers: HeadersInit = {}): Response => {
  const response = new Response(JSON.stringify(body), { status, headers });

  response.headers.set("Content-Type", "application/json; charset=utf-8");

  return response;
};

const ERROR_STATUS: Record<PortalErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  cross_origin: 403,
  not_found: 404,
  method_not_allowed: 405,
  email_taken: 409,
  no_email: 409,
  mail_failed: 502,
  server_error: 500
};

export const errorResponse = (error: PortalErrorCode): Response => {
  return jsonResponse({ error }, ERROR_STATUS[error]);
};

export const htmlResponse = (html: string, status = 200, headers: HeadersInit = {}): Response => {
  const response = new Response(html, { status, headers });

  response.headers.set("Content-Type", "text/html; charset=utf-8");
  // The sign-in page is a button; nobody gets to frame it and steer a click.
  response.headers.set("Content-Security-Policy", "frame-ancestors 'none'");

  return response;
};

// The parsed body, or undefined when it is missing or not JSON.
export const readJsonBody = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
};

export const readCookie = (request: Request, name: string): string | null => {
  const header = request.headers.get("Cookie");

  if (header === null) {
    return null;
  }

  for (const pair of header.split(";")) {
    const separatorIndex = pair.indexOf("=");

    if (separatorIndex !== -1 && pair.slice(0, separatorIndex).trim() === name) {
      return pair.slice(separatorIndex + 1).trim();
    }
  }

  return null;
};

// The bearer secret, when the request carries `Authorization: Bearer …`.
export const readBearerToken = (request: Request): string | null => {
  const match = /^Bearer\s+(\S+)$/i.exec(request.headers.get("Authorization") ?? "");

  return match?.[1] ?? null;
};

// Where the client is, as Cloudflare reports it. Only ever hashed or used as a limiter key.
export const readClientIp = (request: Request): string => {
  return request.headers.get("CF-Connecting-IP") ?? "unknown";
};

export const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};
