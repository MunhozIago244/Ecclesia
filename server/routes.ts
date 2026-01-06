import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertEventSchema, insertScheduleSchema, insertServiceSchema, insertMinistrySchema, insertLocationSchema, insertEquipmentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Configura a autenticação primeiro
  setupAuth(app);

  // === Ministries ===
  app.get(api.ministries.list.path, async (req, res) => {
    const allMinistries = await storage.getMinistries();
    
    // Para cada ministério, buscamos quantos membros ele tem
    const detailedMinistries = await Promise.all(
      allMinistries.map(async (m) => {
        const members = await storage.getMinistryMembers(m.id);
        return { 
          ...m, 
          memberCount: members.length
        };
      })
    );
    
    res.json(detailedMinistries);
  });

  app.post(api.ministries.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Garantir que o leaderId seja número se existir
    const data = {
      ...req.body,
      leaderId: req.body.leaderId ? Number(req.body.leaderId) : null
    };
    
    const ministry = await storage.createMinistry(data);
    res.status(201).json(ministry);
  });

  app.patch("/api/ministries/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    
    const id = Number(req.params.id);
    const data = {
      ...req.body,
      leaderId: req.body.leaderId ? Number(req.body.leaderId) : null
    };

    const updated = await storage.updateMinistry(id, data);
    res.json(updated);
  });

  app.delete("/api/ministries/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    await storage.deleteMinistry(Number(req.params.id));
    res.sendStatus(204);
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

  // === Admin / Users ===
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const users = await storage.getUsers();
    res.json(users);
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
  
  // === Ministry Members Management ===
  app.get("/api/ministries/:id/members", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const members = await storage.getMinistryMembers(Number(req.params.id));
    res.json(members);
  });

  app.post("/api/ministries/:id/members", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const ministryId = parseInt(req.params.id);
    const { userId } = req.body;
    await storage.addMinistryMember(ministryId, userId); 
    res.sendStatus(201);
  });

  app.delete("/api/ministries/:id/members/:userId", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const ministryId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    await storage.removeMinistryMember(ministryId, userId);
    res.sendStatus(200);
  });

  app.patch("/api/ministries/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const id = Number(req.params.id);
    // Garante que o leaderId seja número
    const data = {
      ...req.body,
      leaderId: req.body.leaderId ? Number(req.body.leaderId) : null
    };
    const updated = await storage.updateMinistry(id, data);
    res.json(updated);
  });

  app.delete("/api/ministries/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const id = Number(req.params.id);
    await storage.deleteMinistry(id);
    res.sendStatus(204);
  });

  app.get("/api/ministries", async (req, res) => {
    const ministries = await storage.getMinistries();
    // Adicionamos a contagem de membros para cada ministério
    const detailedMinistries = await Promise.all(
      ministries.map(async (m) => {
        const members = await storage.getMinistryMembers(m.id);
        return { ...m, memberCount: members.length };
      })
    );
    res.json(detailedMinistries);
  });

  const httpServer = createServer(app);
  return httpServer;
}