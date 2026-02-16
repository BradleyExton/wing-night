import { createServer } from "node:http";

const parsedPort = Number(process.env.PORT);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3000;

const server = createServer((_request, response) => {
  response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  response.end("Wing Night server stub\n");
});

server
  .listen(port, () => {
    console.log(`Wing Night server stub listening on http://localhost:${port}`);
  })
  .on("error", (error) => {
    console.error("Failed to start Wing Night server stub:", error);
    process.exit(1);
  });
