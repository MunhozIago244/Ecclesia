import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import { serveStatic } from "./static";

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

// Rota de Health Check - Teste rápido de conectividade
app.get("/api/health", async (_req, res) => {
  try {
    const { pool } = await import("./db");
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

// Inicialização assíncrona para Vercel Serverless
let initialized = false;
const initPromise = (async () => {
  if (initialized) return;

  try {
    console.log("[Server Init] Connecting to Database...");
    const { pool } = await import("./db");
    
    // Testa a conexão imediatamente no boot
    const client = await pool.connect();
    client.release();

    // Registra rotas
    await registerRoutes(app);
    
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    }

    initialized = true;
    console.log("[Server Init] Complete");
  } catch (error: any) {
    console.error("[Server Init] Fatal Error:", error.message);
    // Não travamos o processo para a Vercel não dar erro de timeout
    initialized = true; 
  }
})();

// Middleware de segurança para aguardar o DB
app.use(async (req, res, next) => {
  await initPromise;
  next();
});

// Handler de Erro Global
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
});

// Exportação para Vercel
export default app;

// Listen apenas local
if (process.env.NODE_ENV !== "production") {
  initPromise.then(() => {
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Local: http://localhost:${port}`);
    });
  });
}