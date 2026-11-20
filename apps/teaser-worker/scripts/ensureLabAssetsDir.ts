// PROTOTYPE — throwaway, deleted with the online jump lab. `wrangler dev` refuses to start when its
// assets directory is missing, and in local dev the lab's pages come from Vite
// (`pnpm --filter @wingnight/client dev:lab`), which proxies `/room/` here. An empty build
// directory is enough to boot.
import { mkdirSync } from "node:fs";

mkdirSync(new URL("../../client/dist-lab", import.meta.url), { recursive: true });
