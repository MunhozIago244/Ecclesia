import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === Users ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("VOLUNTARIO"), // ADMIN, LIDER, VOLUNTARIO
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });

// === Ministries ===
export const ministries = pgTable("ministries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const insertMinistrySchema = createInsertSchema(ministries).omit({ id: true });

export const ministryMembers = pgTable("ministry_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  ministryId: integer("ministry_id").notNull(),
  isLeader: boolean("is_leader").default(false),
});

export const insertMinistryMemberSchema = createInsertSchema(ministryMembers).omit({ id: true });

// === Locations & Resources ===
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  capacity: integer("capacity"),
});

export const insertLocationSchema = createInsertSchema(locations).omit({ id: true });

export const equipments = pgTable("equipments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // audio, video, iluminacao, musical
  status: text("status").notNull().default("disponivel"), // disponivel, uso, manutencao
  locationId: integer("location_id"),
});

export const insertEquipmentSchema = createInsertSchema(equipments).omit({ id: true });

// === Services & Events ===
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  dayOfWeek: text("day_of_week").notNull(), // Monday, Tuesday...
  time: text("time").notNull(), // HH:mm
  locationId: integer("location_id"),
});

export const insertServiceSchema = createInsertSchema(services).omit({ id: true });

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  time: text("time").notNull(),
  description: text("description"),
  locationId: integer("location_id"),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true });

// === Schedules (Escalas) ===
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  type: text("type").notNull(), // SERVICE, EVENT
  serviceId: integer("service_id"),
  eventId: integer("event_id"),
  name: text("name"), // Optional override or display name
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({ id: true });

export const scheduleAssignments = pgTable("schedule_assignments", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull(), // Function: "Vocal", "Guitar", "Camera"
  confirmed: boolean("confirmed").default(false),
});

export const insertScheduleAssignmentSchema = createInsertSchema(scheduleAssignments).omit({ id: true });

// === Types ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Ministry = typeof ministries.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Equipment = typeof equipments.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type ScheduleAssignment = typeof scheduleAssignments.$inferSelect;

// === Relations ===
export const ministryMembersRelations = relations(ministryMembers, ({ one }) => ({
  user: one(users, { fields: [ministryMembers.userId], references: [users.id] }),
  ministry: one(ministries, { fields: [ministryMembers.ministryId], references: [ministries.id] }),
}));

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  service: one(services, { fields: [schedules.serviceId], references: [services.id] }),
  event: one(events, { fields: [schedules.eventId], references: [events.id] }),
  assignments: many(scheduleAssignments),
}));

export const scheduleAssignmentsRelations = relations(scheduleAssignments, ({ one }) => ({
  schedule: one(schedules, { fields: [scheduleAssignments.scheduleId], references: [schedules.id] }),
  user: one(users, { fields: [scheduleAssignments.userId], references: [users.id] }),
}));
