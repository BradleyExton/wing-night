import express from "express";
import { healthRouter } from "../routes/health/index.js";

export const createApp = (): express.Express => {
  const app = express();

  app.use("/health", healthRouter);

  return app;
};
