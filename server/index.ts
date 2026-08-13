import "dotenv/config";
import cors from "cors";
import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { initDatabase } from "./db";
import router from "./routes";

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(clerkMiddleware());
app.use("/api", router);

app.use((_request, response) => {
  response.status(404).json({ error: "Route not found", code: "not_found" });
});

initDatabase()
  .then(() => {
    app.listen(port, "0.0.0.0");
  })
  .catch((error: unknown) => {
    process.stderr.write(`Compass server failed to start: ${String(error)}\n`);
    process.exitCode = 1;
  });