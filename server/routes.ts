import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import {
  setupAuth,
  ensureAdmin,
  ensureLeader,
  ensureAuthenticated,
} from "./auth";
import { storage } from "./storage";
import { emailService } from "./email";
import { schedulerService } from "./scheduler";
import { api } from "@shared/routes";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import {
  insertEventSchema,
  insertScheduleSchema,
  insertScheduleAssignmentSchema,
  insertEquipmentSchema,
  insertMinistrySchema,
  insertServiceSchema,
  insertLocationSchema,
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

  app.post(
    api.equipments.create.path,
    ensureActive,
    ensureLeader,
    async (req, res) => {
      const result = insertEquipmentSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json(result.error);
      const equipment = await storage.createEquipment(result.data);
      res.status(201).json(equipment);
    },
  );

  app.patch(
    "/api/equipments/:id",
    ensureActive,
    ensureLeader,
    async (req, res) => {
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
    },
  );

  app.delete(
    "/api/equipments/:id",
    ensureActive,
    ensureAdmin,
    async (req, res) => {
      const id = Number(req.params.id);
      await storage.deleteEquipment(id);
      await storage.createAuditLog(
        (req.user as any).id,
        "DELETE_EQUIPMENT",
        `Equipamento ${id} removido`,
      );
      res.sendStatus(204);
    },
  );

  /* ===========================
      MINISTÉRIOS (MINISTRIES)
     =========================== */

  app.get(
    "/api/admin/ministry-requests/count",
    ensureActive,
    ensureLeader,
    async (_req, res) => {
      const count = await storage.getPendingMinistryRequestsCount();
      res.json({ count });
    },
  );

  app.get(
    "/api/admin/ministry-requests",
    ensureActive,
    ensureLeader,
    async (_req, res) => {
      res.json(await storage.getPendingMinistryRequests());
    },
  );

  app.patch(
    "/api/admin/ministry-requests/:id",
    ensureActive,
    ensureLeader,
    async (req, res) => {
      const id = Number(req.params.id);
      const { status } = req.body;
      const adminId = (req.user as any).id;

      try {
        const updated = await storage.updateMinistryRequestStatus(
          id,
          status,
          adminId,
        );
        await storage.createAuditLog(
          adminId,
          "UPDATE_REQUEST",
          `Solicitação ${id} atualizada para ${status}`,
        );

        if (status === "APPROVED" && updated) {
          try {
            await storage.addMinistryMember(
              updated.ministryId,
              updated.userId,
              null,
            );

            // Buscar informações do usuário e ministério para enviar email
            const user = await storage.getUser(updated.userId);
            const ministry = await storage.getMinistry(updated.ministryId);

            if (user && ministry) {
              await emailService.sendMinistryApproval(
                user.email,
                user.name,
                ministry.name,
              );
            }
          } catch (err: any) {
            // Se já for membro, apenas ignora ou loga
            console.log(
              "Usuário já é membro ou erro ao adicionar:",
              err.message,
            );
          }
        } else if (status === "REJECTED" && updated) {
          // Notificar sobre rejeição
          const user = await storage.getUser(updated.userId);
          const ministry = await storage.getMinistry(updated.ministryId);

          if (user && ministry) {
            await emailService.sendMinistryRejection(
              user.email,
              user.name,
              ministry.name,
            );
          }
        }

        res.json(updated);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    },
  );

  app.get(api.ministries.list.path, ensureActive, async (_req, res) => {
    const detailedMinistries = await storage.getMinistriesWithCount();
    res.json(detailedMinistries);
  });

  app.post(
    api.ministries.create.path,
    ensureActive,
    ensureAdmin,
    async (req, res) => {
      const result = insertMinistrySchema.safeParse(req.body);
      if (!result.success) return res.status(400).json(result.error);

      try {
        const ministry = await storage.createMinistry(result.data);
        await storage.createAuditLog(
          (req.user as any).id,
          "CREATE_MINISTRY",
          `Ministério ${ministry.name} criado`,
        );
        if (req.body.functions && Array.isArray(req.body.functions)) {
          await Promise.all(
            req.body.functions.map((fnName: string) =>
              storage.createMinistryFunction(ministry.id, fnName),
            ),
          );
        }
        res.status(201).json(ministry);
      } catch (error) {
        res.status(500).json({ message: "Erro ao criar ministério." });
      }
    },
  );

  app.patch(
    "/api/ministries/:id",
    ensureActive,
    ensureAdmin,
    async (req, res) => {
      const id = Number(req.params.id);
      try {
        const { functions, ...ministryData } = req.body;
        const updated = await storage.updateMinistry(id, ministryData);
        await storage.createAuditLog(
          (req.user as any).id,
          "UPDATE_MINISTRY",
          `Ministério ${id} atualizado`,
        );
        res.json(updated);
      } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar ministério." });
      }
    },
  );

  app.delete(
    "/api/ministries/:id",
    ensureActive,
    ensureAdmin,
    async (req, res) => {
      const id = Number(req.params.id);
      await storage.deleteMinistry(id);
      await storage.createAuditLog(
        (req.user as any).id,
        "DELETE_MINISTRY",
        `Ministério ${id} removido`,
      );
      res.sendStatus(204);
    },
  );

  // Especialidades de Ministérios
  app.get("/api/ministries/:id/functions", ensureActive, async (req, res) => {
    const id = Number(req.params.id);
    res.json(await storage.getMinistryFunctions(id));
  });

  app.post(
    "/api/ministries/:id/functions",
    ensureActive,
    ensureLeader,
    async (req, res) => {
      const ministryId = Number(req.params.id);
      const { name } = req.body;
      if (!name?.trim())
        return res.status(400).json({ message: "Nome obrigatório" });

      try {
        const newFunction = await storage.createMinistryFunction(
          ministryId,
          name.trim(),
        );
        res.status(201).json(newFunction);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    },
  );

  app.delete(
    "/api/ministry-functions/:id",
    ensureActive,
    ensureLeader,
    async (req, res) => {
      const functionId = Number(req.params.id);
      await storage.deleteMinistryFunction(functionId);
      res.sendStatus(204);
    },
  );

  /* ===========================
      EVENTOS E ESCALAS
     =========================== */

  app.get(api.events.list.path, ensureActive, async (_req, res) => {
    res.json(await storage.getEvents());
  });

  app.post(
    api.events.create.path,
    ensureActive,
    ensureLeader,
    async (req, res) => {
      const data = insertEventSchema.safeParse(req.body);
      if (!data.success) return res.status(400).json(data.error);
      res.status(201).json(await storage.createEvent(data.data));
    },
  );

  app.delete("/api/events/:id", ensureActive, ensureAdmin, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteEvent(id);
    await storage.createAuditLog(
      (req.user as any).id,
      "DELETE_EVENT",
      `Evento ${id} removido`,
    );
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

  app.patch(
    "/api/admin/users/:id",
    ensureActive,
    ensureAdmin,
    async (req, res) => {
      const id = Number(req.params.id);
      if (id === (req.user as any).id && req.body.active === false) {
        return res
          .status(400)
          .json({ message: "Você não pode desativar sua própria conta." });
      }

      // Buscar usuário antes de atualizar para verificar mudança de status
      const userBefore = await storage.getUser(id);
      const updated = await storage.updateUser(id, req.body);
      await storage.createAuditLog(
        (req.user as any).id,
        "UPDATE_USER",
        `Usuário ${id} atualizado (Role: ${req.body.role}, Active: ${req.body.active})`,
      );

      // Enviar email se o status de ativação mudou
      if (
        userBefore &&
        typeof req.body.active === "boolean" &&
        userBefore.active !== req.body.active
      ) {
        if (req.body.active === true) {
          await emailService.sendAccountActivation(updated.email, updated.name);
        } else {
          await emailService.sendAccountDeactivation(
            updated.email,
            updated.name,
          );
        }
      }

      res.json(updated);
    },
  );

  app.post(
    "/api/user/upload",
    ensureAuthenticated,
    upload.single("file"),
    async (req: any, res) => {
      if (!req.file) return res.status(400).send("Nenhuma imagem enviada");
      try {
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: "ecclesia_profiles",
          public_id: `user_${(req.user as any).id}`,
          overwrite: true,
        });
        await storage.updateUser((req.user as any).id, {
          avatarUrl: result.secure_url,
        });
        res.json({ url: result.secure_url });
      } catch (error) {
        res.status(500).json({ message: "Erro no upload Cloudinary" });
      }
    },
  );

  /* ===========================
      MEMBROS DOS MINISTÉRIOS
     =========================== */

  app.get("/api/ministries/:id/members", ensureActive, async (req, res) => {
    const id = Number(req.params.id);
    res.json(await storage.getMinistryMembers(id));
  });

  app.post(
    "/api/ministries/:id/members",
    ensureActive,
    ensureLeader,
    async (req, res) => {
      const ministryId = Number(req.params.id);
      const userId = Number(req.body.user_id);
      const functionId = req.body.function_id
        ? Number(req.body.function_id)
        : null;

      if (isNaN(ministryId) || isNaN(userId)) {
        return res
          .status(400)
          .json({ message: "IDs de ministério ou usuário inválidos" });
      }

      try {
        await storage.addMinistryMember(ministryId, userId, functionId);
        res.status(201).json({ message: "Membro adicionado com sucesso" });
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    },
  );

  app.delete(
    "/api/ministries/:id/members/:userId",
    ensureActive,
    ensureLeader,
    async (req, res) => {
      const ministryId = Number(req.params.id);
      const userId = Number(req.params.userId);
      await storage.removeMinistryMember(ministryId, userId);
      res.sendStatus(204);
    },
  );

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
    ESCALAS E ATRIBUIÇÕES (SCHEDULES)
   =========================== */

  app.get("/api/schedules", ensureActive, async (_req, res) => {
    res.json(await storage.getSchedules());
  });

  /**
   * GET /api/my-assignments
   * Retorna todas as escalas (schedule_assignments) do usuário logado
   * com as informações completas de schedule, function, user
   */
  app.get("/api/my-assignments", ensureActive, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const assignments = await storage.getUserScheduleAssignments(userId);
      res.json(assignments);
    } catch (error: any) {
      console.error("Erro ao buscar assignments do usuário:", error);
      res.status(500).json({ message: "Erro ao buscar escalas" });
    }
  });

  app.post("/api/schedules", ensureActive, ensureLeader, async (req, res) => {
    const result = insertScheduleSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
    const schedule = await storage.createSchedule(result.data);
    await storage.createAuditLog(
      (req.user as any).id,
      "CREATE_SCHEDULE",
      `Escala ${schedule.id} criada`,
    );
    res.status(201).json(schedule);
  });

  app.post(
    "/api/schedules/:id/assign",
    ensureActive,
    ensureLeader,
    async (req, res) => {
      const scheduleId = Number(req.params.id);
      const result = insertScheduleAssignmentSchema
        .omit({ scheduleId: true })
        .safeParse(req.body);

      if (!result.success) return res.status(400).json(result.error);

      try {
        const assignment = await storage.createAssignment({
          ...result.data,
          scheduleId,
        });

        // Enviar notificação por email ao usuário escalado
        try {
          const user = await storage.getUser(result.data.userId);
          const schedule = await storage.getSchedule(scheduleId);
          const functionData = result.data.functionId
            ? await storage.getMinistryFunction(result.data.functionId)
            : null;

          if (user && schedule) {
            const scheduleDate = new Date(schedule.date).toLocaleDateString(
              "pt-BR",
              {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              },
            );

            await emailService.sendScheduleAssignment(
              user.email,
              user.name,
              schedule.name || "Serviço",
              scheduleDate,
              functionData?.name || "Voluntário",
            );
          }
        } catch (emailError) {
          console.error("Erro ao enviar email de escala:", emailError);
          // Não impede a criação da escala se o email falhar
        }

        res.status(201).json(assignment);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    },
  );

  /* ===========================
      DISTRIBUIÇÃO AUTOMÁTICA DE ESCALAS
     =========================== */

  /**
   * POST /api/schedules/auto-suggest
   * Gera sugestões de distribuição automática para escalas
   * Body: { scheduleIds: number[], ministryId?: number }
   */
  app.post(
    "/api/schedules/auto-suggest",
    ensureActive,
    ensureLeader,
    async (req, res) => {
      try {
        const { scheduleIds, ministryId } = req.body;

        if (!Array.isArray(scheduleIds) || scheduleIds.length === 0) {
          return res
            .status(400)
            .json({ message: "scheduleIds deve ser um array não vazio" });
        }

        const result = await schedulerService.suggestDistribution(
          scheduleIds,
          ministryId,
        );

        res.json(result);
      } catch (error: any) {
        console.error("Erro na distribuição automática:", error);
        res.status(500).json({ message: error.message });
      }
    },
  );

  /**
   * POST /api/schedules/auto-apply
   * Aplica automaticamente as sugestões de distribuição
   * Body: { suggestions: DistributionSuggestion[] }
   */
  app.post(
    "/api/schedules/auto-apply",
    ensureActive,
    ensureLeader,
    async (req, res) => {
      try {
        const { suggestions } = req.body;

        if (!Array.isArray(suggestions)) {
          return res
            .status(400)
            .json({ message: "suggestions deve ser um array" });
        }

        const result = await schedulerService.applyDistribution(suggestions);

        // Log de auditoria
        await storage.createAuditLog(
          (req.user as any).id,
          "AUTO_DISTRIBUTE",
          `Distribuição automática aplicada: ${result.assignmentsCreated} atribuições criadas`,
        );

        res.json(result);
      } catch (error: any) {
        console.error("Erro ao aplicar distribuição:", error);
        res.status(500).json({ message: error.message });
      }
    },
  );

  /**
   * POST /api/schedules/validate-assignment
   * Valida se uma atribuição é viável
   * Body: { scheduleId: number, userId: number }
   */
  app.post(
    "/api/schedules/validate-assignment",
    ensureActive,
    ensureLeader,
    async (req, res) => {
      try {
        const { scheduleId, userId } = req.body;

        if (!scheduleId || !userId) {
          return res
            .status(400)
            .json({ message: "scheduleId e userId são obrigatórios" });
        }

        const validation = await schedulerService.validateDistribution(
          Number(scheduleId),
          Number(userId),
        );

        res.json(validation);
      } catch (error: any) {
        console.error("Erro na validação:", error);
        res.status(500).json({ message: error.message });
      }
    },
  );

  const httpServer = createServer(app);
  return httpServer;
}
