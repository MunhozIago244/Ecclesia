import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import { serveStatic } from "./static.js";

dotenv.config();

const app = express();

// Configuração do CORS
app.use(
  cors({
    origin: "*", 
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rota de Health Check
app.get("/api/health", async (_req, res) => {
  try {
    // Import dinâmico com .js para evitar erro de módulo
    const { pool } = await import("./db.js");
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();

    res.json({
      status: "online",
      db: "connected",
      time: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: "error",
      error: error.message,
    });
  }
});

let initialized = false;
const initPromise = (async () => {
  if (initialized) return;

  try {
    console.log("[Server Init] Starting...");
    const { pool } = await import("./db.js"); 
    
    const client = await pool.connect();
    client.release();

    await registerRoutes(app);
    
    if (process.env.NODE_ENV === "production") {
      try {
        serveStatic(app);
      } catch (e) {
        console.error("[Static] Error or not found, skipping...");
      }
    }

    initialized = true;
    console.log("[Server Init] Complete");
  } catch (error: any) {
    console.error("[Server Init] Fatal Error:", error.message);
    initialized = true; 
  }
})();

app.use(async (req, res, next) => {
  await initPromise;
  next();
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
});

// Exportação obrigatória para Vercel
export default app;

if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Servidor local rodando na porta ${port}`);
  });
}