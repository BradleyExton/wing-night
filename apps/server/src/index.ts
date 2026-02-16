import { createServer } from "node:http";

import { createApp } from "./createApp/index.js";
import { attachSocketServer } from "./socketServer/index.js";

const parsedPort = Number(process.env.PORT);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3000;
const app = createApp();
const httpServer = createServer(app);

attachSocketServer(httpServer);

httpServer
  .listen(port, () => {
    console.log(`Wing Night server listening on http://localhost:${port}`);
  })
  .on("error", (error) => {
    console.error("Failed to start Wing Night server:", error);
    process.exit(1);
  });
