import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === 1. TABELAS DE USUÁRIOS E ACESSO ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // admin, leader, user
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  phone: text("phone"),
  theme: text("theme").default("system"),
  active: boolean("active").default(true),
});

export const userAvailability = pgTable("user_availability", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dayOfWeek: text("day_of_week").notNull(), 
  period: text("period").notNull(), 
  isAvailable: boolean("is_available").default(true),
});

// === 2. TABELAS DE MINISTÉRIOS E ESTRUTURA ===

export const ministries = pgTable("ministries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  leaderId: integer("leader_id").references(() => users.id, { onDelete: "set null" }),
});

export const ministryFunctions = pgTable("ministry_functions", {
  id: serial("id").primaryKey(),
  ministryId: integer("ministry_id").notNull().references(() => ministries.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Ex: "Teclado", "Som"
  description: text("description"),
  requiresTraining: boolean("requires_training").default(false),
});

export const ministryMembers = pgTable("ministry_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ministryId: integer("ministry_id").notNull().references(() => ministries.id, { onDelete: "cascade" }),
  functionId: integer("function_id").references(() => ministryFunctions.id, { onDelete: "set null" }),
  isLeader: boolean("is_leader").default(false),
});

export const userMinistries = pgTable("user_ministries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ministryId: integer("ministry_id").notNull().references(() => ministries.id, { onDelete: "cascade" }),
  roles: text("roles").notNull(), 
  status: text("status").notNull().default("PENDING"), // PENDING, APPROVED, REJECTED
  createdAt: timestamp("created_at").defaultNow(),
});

export const userFunctions = pgTable("user_functions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  functionId: integer("function_id").notNull().references(() => ministryFunctions.id, { onDelete: "cascade" }),
  experienceLevel: text("experience_level"), 
});

// === 3. INFRAESTRUTURA E RECURSOS ===

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  capacity: integer("capacity"),
});

export const equipments = pgTable("equipments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("disponivel"),
  locationId: integer("location_id").references(() => locations.id, { onDelete: "set null" }),
});

// === 4. SERVIÇOS, EVENTOS E ESCALAS ===

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  time: text("time").notNull(),
  locationId: integer("location_id").references(() => locations.id, { onDelete: "set null" }),
  recurrenceType: text("recurrence_type").notNull().default("WEEKLY"),
  intervalWeeks: integer("interval_weeks").default(1),
  startDate: timestamp("start_date", { mode: "date" }).notNull().defaultNow(),
  isActive: boolean("is_active").default(true),
  monthlyWeeks: text("monthly_weeks"),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: timestamp("date", { mode: "date" }).notNull(),
  time: text("time").notNull(),
  description: text("description"),
  locationId: integer("location_id").references(() => locations.id, { onDelete: "set null" }),
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  date: timestamp("date", { mode: "date" }).notNull(),
  type: text("type").notNull(), // SERVICE, EVENT
  serviceId: integer("service_id").references(() => services.id, { onDelete: "cascade" }),
  eventId: integer("event_id").references(() => events.id, { onDelete: "cascade" }),
  name: text("name"),
});

export const scheduleAssignments = pgTable("schedule_assignments", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull().references(() => schedules.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  functionId: integer("function_id").notNull().references(() => ministryFunctions.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending, confirmed, declined
  notes: text("notes"),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  details: text("details").notNull(),
  adminId: integer("admin_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// === 5. ZOD SCHEMAS (COM COERÇÃO DE TIPOS) ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true });

export const insertMinistrySchema = createInsertSchema(ministries, {
  leaderId: z.coerce.number().nullable(),
}).omit({ id: true });

export const insertMinistryFunctionSchema = createInsertSchema(ministryFunctions).omit({ id: true });

export const insertLocationSchema = createInsertSchema(locations, {
  capacity: z.coerce.number().optional(),
}).omit({ id: true });

export const insertEquipmentSchema = createInsertSchema(equipments, {
  locationId: z.coerce.number().nullable(),
  status: z.enum(["disponivel", "manutencao", "em_uso"]),
}).omit({ id: true });

export const insertServiceSchema = createInsertSchema(services, {
  dayOfWeek: z.coerce.number(),
  intervalWeeks: z.coerce.number().optional().nullable(),
  locationId: z.coerce.number().nullable(),
  startDate: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date()),
}).omit({ id: true });

export const insertEventSchema = createInsertSchema(events, { 
  date: z.coerce.date(),
  locationId: z.coerce.number().nullable(),
}).omit({ id: true });

export const insertScheduleSchema = createInsertSchema(schedules, { 
  date: z.coerce.date(),
  serviceId: z.coerce.number().nullable(),
  eventId: z.coerce.number().nullable(),
}).omit({ id: true });

export const insertScheduleAssignmentSchema = createInsertSchema(scheduleAssignments, {
  userId: z.coerce.number(),
  scheduleId: z.coerce.number(),
  functionId: z.coerce.number().optional().nullable(),
}).omit({ id: true });

export const session = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

// === 6. TYPES (PARA TYPESCRIPT) ===

export type User = typeof users.$inferSelect;
export type Ministry = typeof ministries.$inferSelect;
export type MinistryFunction = typeof ministryFunctions.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Equipment = typeof equipments.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type ScheduleAssignment = typeof scheduleAssignments.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertMinistry = z.infer<typeof insertMinistrySchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type InsertScheduleAssignment = z.infer<typeof insertScheduleAssignmentSchema>;

// === 7. RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(ministryMembers),
  assignments: many(scheduleAssignments),
  requests: many(userMinistries),
}));

export const ministriesRelations = relations(ministries, ({ many, one }) => ({
  members: many(ministryMembers),
  functions: many(ministryFunctions),
  leader: one(users, { fields: [ministries.leaderId], references: [users.id] }),
}));

export const ministryFunctionsRelations = relations(ministryFunctions, ({ one, many }) => ({
  ministry: one(ministries, { fields: [ministryFunctions.ministryId], references: [ministries.id] }),
  assignments: many(scheduleAssignments),
}));

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  service: one(services, { fields: [schedules.serviceId], references: [services.id] }),
  event: one(events, { fields: [schedules.eventId], references: [events.id] }),
  assignments: many(scheduleAssignments),
}));

export const scheduleAssignmentsRelations = relations(scheduleAssignments, ({ one }) => ({
  schedule: one(schedules, { fields: [scheduleAssignments.scheduleId], references: [schedules.id] }),
  user: one(users, { fields: [scheduleAssignments.userId], references: [users.id] }),
  function: one(ministryFunctions, { fields: [scheduleAssignments.functionId], references: [ministryFunctions.id] }),
}));