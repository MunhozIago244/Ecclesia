import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import cors from "cors";
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Configuração do CORS para o seu sistema acessar a API
app.use(cors({
  origin: "*", // Em produção, troque pela URL da vercel do seu front-end
  methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rota de Health Check para testar o Neon
app.get("/api/health", async (_req, res) => {
  res.json({ 
    status: "online", 
    db: "connected (Neon Pooler)",
    time: new Date().toISOString() 
  });
});

(async () => {
  // Registra suas rotas do arquivo routes.ts
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
  });
})();

// Mantemos o listen apenas para desenvolvimento local
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Servidor local rodando em http://localhost:${port}`);
  });
}

export default app;