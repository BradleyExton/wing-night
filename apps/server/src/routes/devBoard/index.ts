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
  // Naming the resolved path is the whole diagnostic on a failure — the usual
  // cause is a sibling checkout that isn't where the default expects it.
  const respondUnavailable = (reason: string, workCliPath: string | null): void => {
    response.status(503).json({ error: reason, workCliPath });
  };

  // `resolveWorkCliTarget` shells out to git, which THROWS outside a checkout
  // or without git installed. Uncaught, express would answer with its default
  // error page — a stack trace in the body, which AC#3 forbids.
  let target: ReturnType<typeof resolveWorkCliTarget>;

  try {
    target = resolveWorkCliTarget();
  } catch {
    respondUnavailable("could not resolve the repo root", null);

    return;
  }

  const { cliPath, cwd } = target;

  void Promise.all([
    runWorkCli({ cliPath, cwd, args: ["index", "--json"] }),
    runWorkCli({ cliPath, cwd, args: ["next", "--json"] })
  ])
    .then(([index, next]) => {
      if (!index.ok) {
        respondUnavailable(index.reason, cliPath);

        return;
      }

      if (!next.ok) {
        respondUnavailable(next.reason, cliPath);

        return;
      }

      response.status(200).json({ index: index.value, next: next.value });
    })
    // Without this a throw in the handler above is an UNHANDLED REJECTION,
    // which takes the whole server process down rather than failing one request.
    .catch(() => {
      respondUnavailable("work CLI relay failed", cliPath);
    });
});
