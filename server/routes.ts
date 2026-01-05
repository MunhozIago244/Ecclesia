import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
// Importe os schemas validados
import { insertEventSchema, insertScheduleSchema, insertServiceSchema, insertMinistrySchema, insertLocationSchema, insertEquipmentSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Set up authentication first
  setupAuth(app);

  const validate = (schema: z.ZodSchema, data: any) => {
    try {
      return schema.parse(data);
    } catch (e) {
      return null;
    }
  };

  // === Ministries ===
  app.get(api.ministries.list.path, async (req, res) => {
    const ministries = await storage.getMinistries();
    res.json(ministries);
  });

  app.post(api.ministries.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const ministry = await storage.createMinistry(req.body);
    res.status(201).json(ministry);
  });

  app.get(api.ministries.get.path, async (req, res) => {
    const ministry = await storage.getMinistry(Number(req.params.id));
    if (!ministry) return res.sendStatus(404);
    res.json(ministry);
  });

  // === Locations ===
  app.get(api.locations.list.path, async (req, res) => {
    const locations = await storage.getLocations();
    res.json(locations);
  });

  app.post(api.locations.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const location = await storage.createLocation(req.body);
    res.status(201).json(location);
  });

  // === Equipment ===
  app.get(api.equipments.list.path, async (req, res) => {
    const equipments = await storage.getEquipments();
    res.json(equipments);
  });

  app.post(api.equipments.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const equipment = await storage.createEquipment(req.body);
    res.status(201).json(equipment);
  });

  // === Services ===
  app.get(api.services.list.path, async (req, res) => {
    const services = await storage.getServices();
    res.json(services);
  });

  app.post(api.services.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const service = await storage.createService(req.body);
    res.status(201).json(service);
  });

  // === Events ===
  app.get(api.events.list.path, async (req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  app.post(api.events.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // O parse aqui transforma a string "2026-01-05" em new Date()
    const data = insertEventSchema.safeParse(req.body);
    
    if (!data.success) {
      return res.status(400).json({ error: "Data ou campos inválidos", details: data.error.format() });
    }

    const event = await storage.createEvent(data.data);
    res.status(201).json(event);
  });

  // === Schedules ===
  app.get(api.schedules.list.path, async (req, res) => {
    const schedules = await storage.getSchedules();
    res.json(schedules);
  });

  app.post(api.schedules.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const data = insertScheduleSchema.safeParse(req.body);
    
    if (!data.success) {
      return res.status(400).json({ error: "Data ou campos inválidos", details: data.error.format() });
    }

    const schedule = await storage.createSchedule(data.data);
    res.status(201).json(schedule);
  });

  app.patch("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const updated = await storage.updateUser(Number(req.params.id), req.body);
    res.json(updated);
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    await storage.deleteUser(Number(req.params.id));
    res.sendStatus(204);
  });

  // === Admin / Users ===
  app.get("/api/admin/users", async (req, res) => {
    // 1. Verifica se está logado e se é admin
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }

    try {
      // 2. Chama o método getUsers que já existe no seu storage.ts
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).send("Erro interno ao buscar usuários");
    }
  });

  // Seed data if empty
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const users = await storage.getUser(1);
  if (!users) {
    console.log("Seeding database...");
    // Admin user
    // Note: In real app, password should be hashed. The auth setup handles hashing.
    // For seeding, we'll rely on the auth implementation to hash if we use createUser directly via storage
    // But storage doesn't hash. We should rely on a registration flow or pre-hash.
    // For simplicity in this mock, we assume storage stores what it gets, and auth compares.
    // Wait, we need to use scrypt to hash for the seed user to work with passport setup.
    // OR we can just register via API if we were running.
    // Let's NOT seed a user here because of the hashing requirement, unless we import the hash function.
    // Better: We will let the user register the first account.
    
    // Seed ministries
    await storage.createMinistry({ name: "Louvor", description: "Equipe de música e adoração" });
    await storage.createMinistry({ name: "Mídia", description: "Projeção e transmissão" });
    await storage.createMinistry({ name: "Som", description: "Engenharia de áudio" });
    
    // Seed locations
    await storage.createLocation({ name: "Templo Principal", address: "Rua Principal, 100", capacity: 500 });
    await storage.createLocation({ name: "Salão Anexo", address: "Rua Principal, 100", capacity: 100 });
    
    // Seed Services
    await storage.createService({ name: "Culto de Domingo", dayOfWeek: "Domingo", time: "18:00", locationId: 1 });
    await storage.createService({ name: "Culto de Jovens", dayOfWeek: "Sábado", time: "19:30", locationId: 2 });
  }
}
