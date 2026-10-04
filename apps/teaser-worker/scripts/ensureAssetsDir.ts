// `wrangler dev` refuses to start when the assets directory is missing, and a clean checkout has
// no teaser build. In local dev the teaser's pages come from Vite, which proxies only `/api` and
// `/s` here, so an empty directory is all the Worker needs to boot.
import { mkdirSync } from "node:fs";

mkdirSync(new URL("../../client/dist-teaser", import.meta.url), { recursive: true });
