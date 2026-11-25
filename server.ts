import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  analyzeNewsWithGemini,
  extractArticleFromUrl,
  getHealthStatus,
} from "./lib/newsService.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    const result = getHealthStatus();
    res.status(result.status).json(result.body);
  });

  app.post("/api/extract-url", async (req, res) => {
    const result = await extractArticleFromUrl(req.body?.url);
    res.status(result.status).json(result.body);
  });

  app.post("/api/analyze", async (req, res) => {
    const result = await analyzeNewsWithGemini({
      text: req.body?.text,
      title: req.body?.title,
      sourceUrl: req.body?.sourceUrl,
    });
    res.status(result.status).json(result.body);
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VeritasLens server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
