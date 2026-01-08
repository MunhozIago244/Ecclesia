import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { createServer } from "http"; 
import { registerRoutes } from "./routes.js";
import * as viteFunctions from "./vite.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Log customizado para monitorar as rotas
const customLog = (message: string) => {
  const time = new Date().toLocaleTimeString("pt-BR", { hour12: false });
  console.log(`\x1b[90m[${time}]\x1b[0m ${message}`);
};

async function startServer() {
  try {
    const server = createServer(app);

    // 1. Registra as rotas da API
    await registerRoutes(app);

    // 2. Middleware de Logs (Opcional, mas ajuda no visual)
    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) {
        const start = Date.now();
        res.on("finish", () => {
          const duration = Date.now() - start;
          console.log(`\x1b[90m[${new Date().toLocaleTimeString()}]\x1b[0m \x1b[32m${req.method}\x1b[0m ${req.path} \x1b[33m${res.statusCode}\x1b[0m - ${duration}ms`);
        });
      }
      next();
    });

    // 3. Configuração do Vite (TEMPO REAL)
    if (process.env.NODE_ENV !== "production") {
      // Forçamos a chamada garantindo que 'app' e 'server' sejam passados
      await viteFunctions.setupVite(app, server); 
      console.log("\x1b[35m%s\x1b[0m", "✨ [Vite] Hot Reload Ativado!");
    } else {
      if (typeof viteFunctions.serveStatic === 'function') {
        viteFunctions.serveStatic(app);
      } else {
        app.use(express.static("dist/public"));
      }
    }

    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
      console.log("");
      console.log("\x1b[36m%s\x1b[0m", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("\x1b[32m%s\x1b[0m", `  🚀 ECCLESIA ONLINE CONECTADO`);
      console.log("\x1b[37m%s\x1b[0m", `  📍 Local: http://localhost:${PORT}`);
      console.log("\x1b[36m%s\x1b[0m", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar servidor:", error);
  }
}

startServer();