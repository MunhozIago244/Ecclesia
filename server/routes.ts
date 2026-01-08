import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, ensureAdmin, ensureLeader, ensureAuthenticated } from "./auth";
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
  insertLocationSchema
} from "@shared/schema";

/**
 * MIDDLEWARE DE PROTEÇÃO DE CONTA ATIVA
 */
function ensureActive(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Sessão expirada ou não autenticada.");
  }

  // Se o usuário estiver ativo, prossegue
  if ((req.user as any).active === true) {
    return next();
  }

  // Caminhos permitidos mesmo para usuários inativos (perfil e logout)
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
    message: "Sua conta está inativa. Entre em contato com o administrador.",
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Inicializa Passport e Sessões
  setupAuth(app);

  /* ===========================
      EQUIPAMENTOS (EQUIPMENTS)
     =========================== */

  app.get(api.equipments.list.path, ensureActive, async (_req, res) => {
    res.json(await storage.getEquipments());
  });

  app.post(api.equipments.create.path, ensureActive, ensureLeader, async (req, res) => {
    const result = insertEquipmentSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
    const equipment = await storage.createEquipment(result.data);
    res.status(201).json(equipment);
  });

  app.patch("/api/equipments/:id", ensureActive, ensureLeader, async (req, res) => {
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

  app.delete("/api/equipments/:id", ensureActive, ensureAdmin, async (req, res) => {
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

  app.post(api.ministries.create.path, ensureActive, ensureAdmin, async (req, res) => {
    const result = insertMinistrySchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    try {
      const ministry = await storage.createMinistry(result.data);
      if (req.body.functions && Array.isArray(req.body.functions)) {
        await Promise.all(
          req.body.functions.map((fnName: string) =>
            storage.createMinistryFunction(ministry.id, fnName)
          )
        );
      }
      res.status(201).json(ministry);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar ministério." });
    }
  });

  app.patch("/api/ministries/:id", ensureActive, ensureAdmin, async (req, res) => {
    const id = Number(req.params.id);
    try {
      const { functions, ...ministryData } = req.body;
      const updated = await storage.updateMinistry(id, ministryData);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar ministério." });
    }
  });

  app.delete("/api/ministries/:id", ensureActive, ensureAdmin, async (req, res) => {
    await storage.deleteMinistry(Number(req.params.id));
    res.sendStatus(204);
  });

  // Especialidades de Ministérios
  app.get("/api/ministries/:id/functions", ensureActive, async (req, res) => {
    const id = Number(req.params.id);
    res.json(await storage.getMinistryFunctions(id));
  });

  app.post("/api/ministries/:id/functions", ensureActive, ensureLeader, async (req, res) => {
    const ministryId = Number(req.params.id);
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Nome obrigatório" });
    
    try {
      const newFunction = await storage.createMinistryFunction(ministryId, name.trim());
      res.status(201).json(newFunction);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/ministry-functions/:id", ensureActive, ensureLeader, async (req, res) => {
    const functionId = Number(req.params.id);
    await storage.deleteMinistryFunction(functionId);
    res.sendStatus(204);
  });

  /* ===========================
      EVENTOS E ESCALAS
     =========================== */

  app.get(api.events.list.path, ensureActive, async (_req, res) => {
    res.json(await storage.getEvents());
  });

  app.post(api.events.create.path, ensureActive, ensureLeader, async (req, res) => {
    const data = insertEventSchema.safeParse(req.body);
    if (!data.success) return res.status(400).json(data.error);
    res.status(201).json(await storage.createEvent(data.data));
  });

  app.delete("/api/events/:id", ensureActive, ensureAdmin, async (req, res) => {
    await storage.deleteEvent(Number(req.params.id));
    res.sendStatus(204);
  });

  /* ===========================
      USUÁRIO E ADMINISTRAÇÃO
     =========================== */

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const upload = multer({ storage: multer.memoryStorage() });

  app.get("/api/admin/users", ensureActive, ensureAdmin, async (req, res) => {
    res.json(await storage.getUsers());
  });

  app.patch("/api/admin/users/:id", ensureActive, ensureAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (id === (req.user as any).id && req.body.active === false) {
      return res.status(400).json({ message: "Você não pode desativar sua própria conta." });
    }
    const updated = await storage.updateUser(id, req.body);
    res.json(updated);
  });

  app.post("/api/user/upload", ensureAuthenticated, upload.single("file"), async (req: any, res) => {
    if (!req.file) return res.status(400).send("Nenhuma imagem enviada");
    try {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "ecclesia_profiles",
        public_id: `user_${(req.user as any).id}`,
        overwrite: true,
      });
      await storage.updateUser((req.user as any).id, { avatarUrl: result.secure_url });
      res.json({ url: result.secure_url });
    } catch (error) {
      res.status(500).json({ message: "Erro no upload Cloudinary" });
    }
  });

  /* ===========================
      MEMBROS DOS MINISTÉRIOS
     =========================== */

  app.get("/api/ministries/:id/members", ensureActive, async (req, res) => {
    const id = Number(req.params.id);
    res.json(await storage.getMinistryMembers(id));
  });

  app.post("/api/ministries/:id/members", ensureActive, ensureLeader, async (req, res) => {
    const ministryId = Number(req.params.id);
    const userId = Number(req.body.user_id);
    const functionId = req.body.function_id ? Number(req.body.function_id) : null;

    if (isNaN(ministryId) || isNaN(userId)) {
      return res.status(400).json({ message: "IDs de ministério ou usuário inválidos" });
    }

    try {
      await storage.addMinistryMember(ministryId, userId, functionId);
      res.status(201).json({ message: "Membro adicionado com sucesso" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/ministries/:id/members/:userId", ensureActive, ensureLeader, async (req, res) => {
    const ministryId = Number(req.params.id);
    const userId = Number(req.params.userId);
    await storage.removeMinistryMember(ministryId, userId);
    res.sendStatus(204);
  });

  /* ===========================
      LOCAIS (LOCATIONS)
     =========================== */

  app.get("/api/locations", ensureActive, async (_req, res) => {
    res.json(await storage.getLocations());
  });

  app.post("/api/locations", ensureActive, ensureLeader, async (req, res) => {
    const result = insertLocationSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
    
    try {
      const location = await storage.createLocation(result.data);
      res.status(201).json(location);
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao criar local." });
    }
  });

  app.get("/api/locations", ensureActive, async (_req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar locais." });
    }
  });

  app.post("/api/locations", ensureActive, ensureLeader, async (req, res) => {
    // Validação usando o Zod Schema
    const result = insertLocationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(result.error);
    }
    
    try {
      const location = await storage.createLocation(result.data);
      res.status(201).json(location);
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao criar local." });
    }
  });

  /* ===========================
      SERVIÇOS (SERVICES)
     =========================== */

  app.get("/api/services", ensureActive, async (_req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
      res.status(500).json({ message: "Erro interno ao buscar serviços" });
    }
  });

  app.post("/api/services", ensureActive, ensureLeader, async (req, res) => {
    const result = insertServiceSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(result.error);
    }
    try {
      const service = await storage.createService(result.data);
      res.status(201).json(service);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar serviço" });
    }
  });

  /* ===========================
    ATRIBUIÇÕES / ESCALAS (ASSIGNMENTS)
   =========================== */

  app.post("/api/assignments", ensureActive, async (req, res) => {
    try {
      const { eventId, ministryId, roleName, status } = req.body;
      
      // Mapeando para os campos do schema (scheduleId)
      const assignment = await storage.createAssignment({
        scheduleId: Number(eventId),
        userId: (req.user as any).id,
        ministryId: Number(ministryId),
        roleName: roleName,
        status: status || "pending"
      });

      res.status(201).json(assignment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}