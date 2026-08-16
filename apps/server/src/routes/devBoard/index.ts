import { Router } from "express";

import { resolveWorkCliTarget } from "../../resolveWorkCliTarget/index.js";
import { runWorkCli } from "../../runWorkCli/index.js";

export const devBoardRouter = Router();

// The client and server are ALWAYS separate origins here — there is no vite
// proxy anywhere in the repo — so without this the browser blocks the board's
// own fetch and the page can only ever render its error state. The socket
// server solves the same problem by reflecting any origin; this router is
// GET-only, read-only, and mounted only behind the explicit WN_DEV_BOARD opt-in,
// so it can be flatly permissive rather than configurable.
devBoardRouter.use((_request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// Relays the work CLI's two machine seams rather than re-parsing tickets here:
// pickability is the drift-prone logic, and `--json` is the seam built for it.
devBoardRouter.get("/", (_request, response) => {
  const { cliPath, cwd } = resolveWorkCliTarget();

  // Naming the resolved path is the whole diagnostic on a failure — the usual
  // cause is a sibling checkout that isn't where the default expects it.
  const respondUnavailable = (reason: string): void => {
    response.status(503).json({ error: reason, workCliPath: cliPath });
  };

  void Promise.all([
    runWorkCli({ cliPath, cwd, args: ["index", "--json"] }),
    runWorkCli({ cliPath, cwd, args: ["next", "--json"] })
  ]).then(([index, next]) => {
    if (!index.ok) {
      respondUnavailable(index.reason);

      return;
    }

    if (!next.ok) {
      respondUnavailable(next.reason);

      return;
    }

    response.status(200).json({ index: index.value, next: next.value });
  });
});
