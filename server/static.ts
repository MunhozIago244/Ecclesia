import express, {
  type Express,
  Request,
  Response,
  NextFunction,
} from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  // No Vercel, os arquivos estáticos estão em dist/public relativo à raiz do projeto
  // Como o servidor é executado a partir de server/index.ts, precisamos subir um nível
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Serve arquivos estáticos (CSS, JS, imagens, etc.)
  app.use(express.static(distPath));

  // Fallback para index.html apenas para rotas que não são da API
  // Isso permite que o SPA (Single Page Application) funcione corretamente
  app.get("*", (req: Request, res: Response, next: NextFunction) => {
    // Se a rota começa com /api, não serve o index.html
    if (req.path.startsWith("/api")) {
      return next();
    }

    // Para todas as outras rotas, serve o index.html (SPA routing)
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
