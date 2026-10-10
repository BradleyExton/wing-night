// `wrangler dev` refuses to start when its assets directory is missing. In local dev the teaser's
// pages come from Vite, which proxies only `/api` and `/s` here, so the Worker's assets are
// apps/client/teaser-public — what `pnpm teaser:prepare` fills, and where the Worker reads the
// night's teams (`teaser-roster.json`, src/roster) — rather than wrangler.jsonc's built site. An
// empty directory is enough to boot without a prepare; the team routes then answer server_error
// and log that the roster is missing.
import { mkdirSync } from "node:fs";

mkdirSync(new URL("../../client/teaser-public", import.meta.url), { recursive: true });
