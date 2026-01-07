import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import {
  insertEventSchema,
  insertScheduleSchema,
  insertEquipmentSchema,
  insertMinistrySchema,
  insertServiceSchema,
  insertLocationSchema,
} from "@shared/schema";

/**
 * MIDDLEWARE DE PROTEÇÃO
 * Bloqueia usuários inativos de acessar qualquer API,
 * exceto as de seu próprio perfil e logout.
 */
function ensureActive(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401);
  }

  if ((req.user as any).active === true) {
    return next();
  }
  const allowedPaths = [
    "/api/user",
    "/api/user/upload",
    "/api/logout",
    "/api/auth/me",
    "/api/user/me",
  ];

  if (allowedPaths.includes(req.path)) {
    return next();
  }

  res.status(403).json({
    message:
      "Sua conta está inativa. Entre em contato com o administrador para restaurar o acesso.",
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configura a autenticação (Session, Passport, etc)
  setupAuth(app);

  /* ===========================
      EQUIPAMENTOS (EQUIPMENTS)
     =========================== */

  app.get(api.equipments.list.path, ensureActive, async (_req, res) => {
    res.json(await storage.getEquipments());
  });

  app.post(api.equipments.create.path, ensureActive, async (req, res) => {
    const result = insertEquipmentSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    const equipment = await storage.createEquipment(result.data);
    res.status(201).json(equipment);
  });

  app.patch("/api/equipments/:id", ensureActive, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

    const result = insertEquipmentSchema.partial().safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    try {
      const updated = await storage.updateEquipment(id, result.data);
      res.json(updated);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  });

  app.delete("/api/equipments/:id", ensureActive, async (req, res) => {
    if ((req.user as any).role === "user") return res.sendStatus(403);
    const id = Number(req.params.id);
    await storage.deleteEquipment(id);
    res.sendStatus(204);
  });

  /* ===========================
      MINISTÉRIOS (MINISTRIES)
     =========================== */

  app.get(api.ministries.list.path, ensureActive, async (_req, res) => {
    const detailedMinistries = await storage.getMinistriesWithCount();
    res.json(detailedMinistries);
  });

  app.post(api.ministries.create.path, ensureActive, async (req, res) => {
    const result = insertMinistrySchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    const ministry = await storage.createMinistry(result.data);

    if (req.body.functions && Array.isArray(req.body.functions)) {
      await Promise.all(
        req.body.functions.map((fnName: string) =>
          storage.createMinistryFunction(ministry.id, fnName)
        )
      );
    }
    res.status(201).json(ministry);
  });

  app.patch("/api/ministries/:id", ensureActive, async (req, res) => {
    if ((req.user as any).role !== "admin") return res.sendStatus(403);
    const id = Number(req.params.id);
    const updated = await storage.updateMinistry(id, req.body);
    res.json(updated);
  });

  app.delete("/api/ministries/:id", ensureActive, async (req, res) => {
    if ((req.user as any).role !== "admin") return res.sendStatus(403);
    await storage.deleteMinistry(Number(req.params.id));
    res.sendStatus(204);
  });

  /* ===========================
      EVENTOS (EVENTS)
     =========================== */

  app.get(api.events.list.path, ensureActive, async (_req, res) => {
    res.json(await storage.getEvents());
  });

  app.post(api.events.create.path, ensureActive, async (req, res) => {
    const data = insertEventSchema.safeParse(req.body);
    if (!data.success) return res.status(400).json(data.error);
    res.status(201).json(await storage.createEvent(data.data));
  });

  app.patch("/api/events/:id", ensureActive, async (req, res) => {
    if ((req.user as any).role !== "admin") return res.sendStatus(403);
    const id = Number(req.params.id);
    const data = insertEventSchema.partial().safeParse(req.body);
    if (!data.success) return res.status(400).json(data.error);

    const updated = await storage.updateEvent(id, data.data);
    res.json(updated);
  });

  app.delete("/api/events/:id", ensureActive, async (req, res) => {
    if ((req.user as any).role !== "admin") return res.sendStatus(403);
    await storage.deleteEvent(Number(req.params.id));
    res.sendStatus(204);
  });

  /* ===========================
      CULTOS (SERVICES)
     =========================== */

  app.get(api.services.list.path, ensureActive, async (_req, res) => {
    res.json(await storage.getServices());
  });

  app.post(api.services.create.path, ensureActive, async (req, res) => {
    const result = insertServiceSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
    res.status(201).json(await storage.createService(result.data));
  });

  /* ===========================
      ESCALAS (SCHEDULES)
     =========================== */

  app.get(api.schedules.list.path, ensureActive, async (_req, res) => {
    res.json(await storage.getSchedules());
  });

  app.post(api.schedules.create.path, ensureActive, async (req, res) => {
    const data = insertScheduleSchema.safeParse(req.body);
    if (!data.success) return res.status(400).json(data.error);
    res.status(201).json(await storage.createSchedule(data.data));
  });

  /* ===========================
      INFRAESTRUTURA (LOCATIONS)
     =========================== */

  app.get(api.locations.list.path, ensureActive, async (_req, res) => {
    res.json(await storage.getLocations());
  });

  /* ===========================
      ADMIN & AUXILIARES
     =========================== */

  app.get("/api/admin/users", ensureActive, async (req, res) => {
    if ((req.user as any).role !== "admin") return res.sendStatus(403);
    res.json(await storage.getUsers());
  });

  /* ===========================
      USUÁRIO E PERFIL (USER)
      Nota: Estas rotas NÃO usam o ensureActive para permitir
      que o usuário inativo ainda consiga ver seu próprio perfil.
     =========================== */

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const upload = multer({ storage: multer.memoryStorage() });

  /* ===========================
      ADMINISTRAÇÃO DE USUÁRIOS
     =========================== */

  // Listar todos os usuários
  app.get("/api/admin/users", ensureActive, async (req, res) => {
    if ((req.user as any).role !== "admin") return res.sendStatus(403);
    res.json(await storage.getUsers());
  });

  // ATUALIZAR USUÁRIO (A rota que estava faltando para o botão Salvar)
  app.patch("/api/admin/users/:id", ensureActive, async (req, res) => {
    if ((req.user as any).role !== "admin") return res.sendStatus(403);

    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

    // Segurança: Impede o admin de desativar a si mesmo ou mudar o próprio cargo por aqui
    if (id === (req.user as any).id && req.body.active === false) {
      return res
        .status(400)
        .json({
          message:
            "Você não pode desativar sua própria conta de administrador.",
        });
    }

    try {
      // Filtramos o body para garantir que apenas campos permitidos sejam alterados
      const updateData = {
        name: req.body.name,
        role: req.body.role,
        active: req.body.active,
      };

      const updated = await storage.updateUser(id, updateData);
      if (!updated)
        return res.status(404).json({ message: "Usuário não encontrado" });

      res.json(updated);
    } catch (error: any) {
      console.error("Erro ao atualizar usuário admin:", error);
      res.status(500).json({ message: "Erro interno ao salvar alterações" });
    }
  });

  // DELETAR USUÁRIO
  app.delete("/api/admin/users/:id", ensureActive, async (req, res) => {
    if ((req.user as any).role !== "admin") return res.sendStatus(403);

    const id = Number(req.params.id);
    if (id === (req.user as any).id) {
      return res
        .status(400)
        .json({ message: "Não é possível excluir a si mesmo." });
    }

    await storage.deleteUser(id);
    res.sendStatus(204);
  });

  app.post("/api/user/upload", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Tipamos o 'err' como 'any' ou 'Error' e processamos o upload
    upload.single("file")(req, res, async (err: any) => {
      if (err) {
        console.error("Erro Multer:", err);
        return res.status(400).send("Erro no processamento do arquivo");
      }

      // Usamos o 'as any' ou uma interface estendida para o TS não reclamar do .file
      const requestWithFile = req as Request & { file?: Express.Multer.File };

      if (!requestWithFile.file) {
        return res.status(400).send("Nenhuma imagem enviada");
      }

      try {
        const file = requestWithFile.file;
        const b64 = Buffer.from(file.buffer).toString("base64");
        const dataURI = `data:${file.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
          folder: "ecclesia_profiles",
          public_id: `user_${(req.user as any).id}`,
          overwrite: true,
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
          ],
        });

        await storage.updateUser((req.user as any).id, {
          avatarUrl: result.secure_url,
        });

        res.json({ url: result.secure_url });
      } catch (error) {
        console.error("Erro Cloudinary:", error);
        res.status(500).json({ message: "Erro no upload Cloudinary" });
      }
    });
  });

  app.patch("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const updatedUser = await storage.updateUser(
        (req.user as any).id,
        req.body
      );
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
