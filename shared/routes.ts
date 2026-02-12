import { z } from "zod";
import {
  insertUserSchema,
  insertMinistrySchema,
  insertLocationSchema,
  insertEquipmentSchema,
  insertServiceSchema,
  insertEventSchema,
  insertScheduleSchema,
  insertScheduleAssignmentSchema,
  users,
  ministries,
  locations,
  equipments,
  services,
  events,
  schedules,
  scheduleAssignments,
} from "./schema";

// Shared error schemas
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/login",
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: "POST" as const,
      path: "/api/logout",
      responses: {
        200: z.void(),
      },
    },
    register: {
      method: "POST" as const,
      path: "/api/register",
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    me: {
      method: "GET" as const,
      path: "/api/user",
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  ministries: {
    list: {
      method: "GET" as const,
      path: "/api/ministries",
      responses: {
        200: z.array(z.custom<typeof ministries.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/ministries",
      input: insertMinistrySchema,
      responses: {
        201: z.custom<typeof ministries.$inferSelect>(),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/ministries/:id",
      responses: {
        200: z.custom<typeof ministries.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/ministries/:id",
      input: insertMinistrySchema.partial(),
      responses: {
        200: z.custom<typeof ministries.$inferSelect>(),
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/ministries/:id",
      responses: {
        204: z.void(),
      },
    },
  },
  locations: {
    list: {
      method: "GET" as const,
      path: "/api/locations",
      responses: {
        200: z.array(z.custom<typeof locations.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/locations",
      input: insertLocationSchema,
      responses: {
        201: z.custom<typeof locations.$inferSelect>(),
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/locations/:id",
      input: insertLocationSchema.partial(),
      responses: {
        200: z.custom<typeof locations.$inferSelect>(),
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/locations/:id",
      responses: {
        204: z.void(),
      },
    },
  },
  equipments: {
    list: {
      method: "GET" as const,
      path: "/api/equipments",
      responses: {
        200: z.array(z.custom<typeof equipments.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/equipments",
      input: insertEquipmentSchema,
      responses: {
        201: z.custom<typeof equipments.$inferSelect>(),
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/equipments/:id",
      input: insertEquipmentSchema.partial(),
      responses: {
        200: z.custom<typeof equipments.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/equipments/:id",
      responses: {
        204: z.void(),
      },
    },
  },
  services: {
    list: {
      method: "GET" as const,
      path: "/api/services",
      responses: {
        200: z.array(z.custom<typeof services.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/services",
      input: insertServiceSchema,
      responses: {
        201: z.custom<typeof services.$inferSelect>(),
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/services/:id",
      input: insertServiceSchema.partial(),
      responses: {
        200: z.custom<typeof services.$inferSelect>(),
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/services/:id",
      responses: {
        204: z.void(),
      },
    },
  },
  events: {
    list: {
      method: "GET" as const,
      path: "/api/events",
      responses: {
        200: z.array(z.custom<typeof events.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/events",
      input: insertEventSchema,
      responses: {
        201: z.custom<typeof events.$inferSelect>(),
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/events/:id",
      input: insertEventSchema.partial(),
      responses: {
        200: z.custom<typeof events.$inferSelect>(),
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/events/:id",
      responses: {
        204: z.void(),
      },
    },
  },
  schedules: {
    list: {
      method: "GET" as const,
      path: "/api/schedules",
      responses: {
        200: z.array(
          z.custom<
            typeof schedules.$inferSelect & {
              assignments: (typeof scheduleAssignments.$inferSelect)[];
            }
          >(),
        ),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/schedules",
      input: insertScheduleSchema,
      responses: {
        201: z.custom<typeof schedules.$inferSelect>(),
      },
    },
    assign: {
      method: "POST" as const,
      path: "/api/schedules/:id/assign",
      input: insertScheduleAssignmentSchema.omit({ scheduleId: true }),
      responses: {
        201: z.custom<typeof scheduleAssignments.$inferSelect>(),
      },
    },
  },
  admin: {
    users: {
      list: {
        method: "GET" as const,
        path: "/api/admin/users",
        responses: {
          200: z.array(z.custom<typeof users.$inferSelect>()),
        },
      },
      update: {
        method: "PATCH" as const,
        path: "/api/admin/users/:id",
        input: insertUserSchema
          .partial()
          .extend({ active: z.boolean().optional() }),
        responses: {
          200: z.custom<typeof users.$inferSelect>(),
          403: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
      delete: {
        method: "DELETE" as const,
        path: "/api/admin/users/:id",
        responses: {
          204: z.void(),
        },
      },
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
