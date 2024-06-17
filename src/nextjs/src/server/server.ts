import { applyWSSHandler } from "@trpc/server/adapters/ws";
import express from "express";
import http from "http";
import next from "next";
import { parse } from "url";
import ws from "ws";
import { appRouter } from "~/server/api/root";

/**
  Added a custom NextJS server to concurrently run a websocket server for real-time updates
*/

// This has to be the last import, otherwise the Env variables won't be loaded properly
/* eslint-disable import/order */
import { env } from "~/env.cjs";

const dev = env.NODE_ENV !== "production";
const port = process.env.PORT ?? 3000;
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();
const upgradeHandler = nextApp.getUpgradeHandler();

// Create the nextjs server
nextApp.prepare().then(async () => {
  const expressApp = express(); // Use express for http requests

  expressApp.all("*", (req, res) => {
    const proto = req.headers["x-forwarded-proto"];
    if (proto && proto === "http") {
      // redirect to ssl
      res.writeHead(303, {
        location:
          // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
          `https://` + req.headers.host + (req.headers.url ?? ""),
      });
      res.end();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const parsedUrl = parse(req.url!, true);
    void nextHandler(req, res, parsedUrl); // give the request to NextJS
  });

  const server = http.createServer(expressApp);

  // Upgrade websocket connections
  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url!, true);
    if (pathname !== "/_next/webpack-hmr") {
      wss.handleUpgrade(req, socket, head, function done(ws) {
        wss.emit("connection", ws, req);
      });
    } else upgradeHandler(req, socket, head);
  });

  // Create Websocket Server
  const wss = new ws.Server({ path: "/ws", noServer: true });

  // Let tRPC handle the websocket server connections
  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext: () => ({ session: null }),
  });

  // Some logging
  wss.on("connection", (socket) => {
    if (dev) console.log("New Connection", wss.clients.size);

    socket.onclose = (cause) => {
      console.log("Socket closed", wss.clients.size, cause.code, cause.reason);
    };

    socket.onerror = (error) => {
      console.log("Socket error", error.message);
    };
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM");
    handler.broadcastReconnectNotification();
  });

  server.listen(port);

  console.log(
    `> Server listening at ${env.NEXT_PUBLIC_URL} as ${dev ? "development" : process.env.NODE_ENV
    }`
  );
});
