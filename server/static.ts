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

/**
 * Encontra o caminho dos arquivos estáticos buildados
 * Tenta múltiplos caminhos possíveis para funcionar em diferentes ambientes
 */
function findStaticPath(): string | null {
  // Log de debug para entender o ambiente
  console.log("[serveStatic] Environment info:", {
    __dirname,
    cwd: process.cwd(),
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
  });

  const possiblePaths = [
    // Caminho relativo ao arquivo atual (desenvolvimento local)
    path.resolve(__dirname, "..", "dist", "public"),
    // Caminho absoluto a partir da raiz (Vercel pode usar isso)
    path.resolve(process.cwd(), "dist", "public"),
    // Caminho alternativo no Vercel (serverless function)
    path.resolve("/var/task", "dist", "public"),
    // Caminho relativo ao diretório de trabalho atual
    path.resolve(".", "dist", "public"),
    // Caminho alternativo se o build estiver na raiz
    path.resolve(process.cwd(), "public"),
  ];

  for (const staticPath of possiblePaths) {
    try {
      if (fs.existsSync(staticPath)) {
        const indexPath = path.join(staticPath, "index.html");
        if (fs.existsSync(indexPath)) {
          console.log(`[serveStatic] ✓ Found static files at: ${staticPath}`);
          return staticPath;
        } else {
          console.log(
            `[serveStatic] ✗ Directory exists but no index.html: ${staticPath}`
          );
        }
      }
    } catch (error) {
      console.log(`[serveStatic] ✗ Error checking path ${staticPath}:`, error);
    }
  }

  console.warn(
    `[serveStatic] Could not find static files. Tried paths:\n${possiblePaths
      .map((p) => `  - ${p}`)
      .join("\n")}`
  );
  return null;
}

export function serveStatic(app: Express) {
  const distPath = findStaticPath();

  if (!distPath) {
    // Não lança erro, apenas loga e continua
    // Isso permite que a API funcione mesmo sem arquivos estáticos
    console.warn(
      "[serveStatic] Static files not found. API will work, but frontend routes may not."
    );
    return;
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
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Se index.html não existe, retorna 404
      res.status(404).json({ message: "Not found" });
    }
  });
}
