import express, { type Express, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Solução híbrida para evitar o erro de import.meta
let __dirname: string;
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} catch (e) {
  // Caso o compilador force CommonJS
  __dirname = process.cwd(); 
}

function findStaticPath(): string | null {
  const possiblePaths = [
    path.resolve(__dirname, "..", "dist", "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "public"),
    path.resolve("/var/task", "dist", "public"),
  ];

  for (const staticPath of possiblePaths) {
    try {
      if (fs.existsSync(staticPath)) {
        const indexPath = path.join(staticPath, "index.html");
        if (fs.existsSync(indexPath)) {
          return staticPath;
        }
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

export function serveStatic(app: Express) {
  const distPath = findStaticPath();

  if (!distPath) {
    return;
  }

  app.use(express.static(distPath));

  app.get("*", (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  });
}