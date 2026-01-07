import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import { serveStatic } from "./static";

dotenv.config();

const app = express();

// Handler de erro deve ser registrado PRIMEIRO para capturar todos os erros
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Error Handler]", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
});

// Configuração do CORS para o seu sistema acessar a API
app.use(
  cors({
    origin: "*", // Em produção, troque pela URL da vercel do seu front-end
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rota de Health Check para testar o Neon
app.get("/api/health", async (_req, res) => {
  try {
    // Testa conexão com o banco
    const { pool } = await import("./db");
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();

    res.json({
      status: "online",
      db: "connected",
      time: new Date().toISOString(),
      env: process.env.NODE_ENV,
    });
  } catch (error: any) {
    console.error("[Health Check] Database connection failed:", error);
    res.status(503).json({
      status: "error",
      db: "disconnected",
      error: error.message,
      time: new Date().toISOString(),
    });
  }
});

// Inicialização assíncrona - aguarda antes de exportar
let initialized = false;
const initPromise = (async () => {
  if (initialized) return;

  try {
    console.log("[Server Init] Starting initialization...");
    console.log("[Server Init] Environment:", {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
      VERCEL: process.env.VERCEL ? "YES" : "NO",
    });

    // Testa conexão com banco antes de continuar
    try {
      const { pool } = await import("./db");
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      console.log("[Server Init] Database connection OK");
    } catch (dbError: any) {
      console.error(
        "[Server Init] Database connection failed:",
        dbError.message
      );
      // Não bloqueia a inicialização, mas loga o erro
    }

    // Registra suas rotas do arquivo routes.ts
    await registerRoutes(app);
    console.log("[Server Init] Routes registered");

    // Serve arquivos estáticos em produção (Vercel)
    if (process.env.NODE_ENV === "production") {
      try {
        serveStatic(app);
        console.log("[Server Init] Static files configured");
      } catch (error) {
        console.error("[serveStatic] Error serving static files:", error);
        // Continua mesmo se houver erro - API ainda funciona
      }
    }

    initialized = true;
    console.log("[Server Init] Initialization complete");
  } catch (error: any) {
    console.error("[Server Init] Error initializing server:", error);
    console.error("[Server Init] Error stack:", error.stack);
    // Não re-lança o erro aqui, o handler acima já vai capturar
    initialized = true; // Marca como inicializado mesmo com erro para não travar
  }
})();

// Middleware para garantir que a inicialização seja concluída antes de processar requisições
app.use(async (req, res, next) => {
  await initPromise;
  next();
});

// Mantemos o listen apenas para desenvolvimento local
if (process.env.NODE_ENV !== "production") {
  initPromise.then(() => {
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Servidor local rodando em http://localhost:${port}`);
    });
  });
}

export default app;
