import { type Express } from "express";
import express from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viteLogger = createLogger();

// Ajustamos a ordem para (app, server) para bater com o seu index.ts
export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        // Não encerramos o processo em erros leves de HMR para não derrubar o dev
        if (!msg.includes("fetch")) process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // O Middleware do Vite deve vir ANTES das suas rotas estáticas
  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Caminho para o index.html do seu client
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      if (!fs.existsSync(clientTemplate)) {
        return res.status(404).send("index.html não encontrado em /client");
      }

      let template = await fs.promises.readFile(clientTemplate, "utf-8");

      // Injetamos um ID único para garantir que o navegador perceba a mudança
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

// Criamos a função que estava faltando para o modo produção
export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    console.warn(
      `⚠️ Diretório de build não encontrado em: ${distPath}. Rode 'npm run build' primeiro.`,
    );
  }

  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
